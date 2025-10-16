from django.shortcuts import get_object_or_404
from django.conf import settings
from rest_framework import status
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin, UpdateModelMixin, DestroyModelMixin
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenVerifyView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, UserKey
from .serializers import UserCreateSerializer, UserSerializer, UserUpdateSerializer, UserKeySerializer, \
                        UserActivationSerializer, ResendActivationEmailSerializer
from .account_activation import verify_activation_key
from .tasks import send_verification_mail
from .permissions import HasEmailVerifiedPermission


class UserViewSet(CreateModelMixin, ListModelMixin, GenericViewSet): # No retrive action here
# class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    # permission_classes = [AllowAny]

    def get_permissions(self):
        """Apply different permissions based on action. AllowAny is mandatory here as users would not be able to create accounts otherwise"""
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        users = User.objects.prefetch_related('keys').all()

        users_data = []
        for user in users:
            if not user.is_verified:
                continue

            user_key = user.keys.first() # Assuming one UserKey per User
            if not user_key or not user_key.public_key:
                continue

            try:
                public_key_bytes = bytes(user_key.public_key)
                public_key_decoded = public_key_bytes.decode(settings.DEFAULT_ENCODING)
                user_data = {
                    'id': str(user.id),
                    'username': user.username,
                    'public_key': public_key_decoded
                }
            except UnicodeDecodeError:
                import base64
                user_data['public_key'] = base64.b64decode(public_key_bytes).decode('ascii')

            users_data.append(user_data)

        return Response(users_data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        try:
            response = super().create(request, *args, **kwargs)
            # if 201 == response.status_code: # Only if response status code is 201 send email verification mail to the specified mail in the JSON request
            #     user_id = response.data.get('id')
            #     username = response.data.get('username')
            #     email = response.data.get('email')
            #     send_verification_mail.delay(user_id, username, email)
            return (response)
        except Exception as e: # In order to return the message of what went wrong with the account creation:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                for field, errors in serializer.errors.items():
                    error_messages = [str(error).strip('.') for error in errors]

                final_message = ', '.join(error_messages).capitalize() + '.'
                return Response({'message': final_message}, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=False, methods=['GET', 'PUT', 'DELETE'])
    def me(self, request):
        """
        GET: Displays info about specific user
        PUT: Chagnes data about specific user
        DELETE: Deletes specific user
        """
        user = get_object_or_404(User, id=request.user.id)
        if request.method == 'GET':
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        elif request.method == 'PUT':
            original_email = user.email
            original_username = user.username
            new_email = request.data.get('email')
            new_username = request.data.get('username')

            serializer = UserUpdateSerializer(user, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            if original_email == new_email and original_username == new_username:
                return Response(serializer.data, status=status.HTTP_200_OK)

            if original_email != new_email:
                user.is_verified = False
                user.save()
                send_verification_mail.delay(str(user.id), new_username, new_email)

            return Response(serializer.data, status=status.HTTP_200_OK)
        elif request.method == 'DELETE':
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        user = request.user
        current_password = request.data.get('currentPassword')
        new_password = request.data.get('newPassword')

        if not user.check_password(current_password):
            return Response({'currentPassword': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password updated successfully.'}, status=status.HTTP_200_OK)


class UserKeyViewSet(CreateModelMixin, RetrieveModelMixin, DestroyModelMixin, GenericViewSet): # No list and update actions here
    queryset = UserKey.objects.all()
    serializer_class = UserKeySerializer

    def get_serializer_context(self):
        """Inserts user's id into the context to use in serializer."""
        context = super().get_serializer_context()
        context.update({'user_id': self.request.user.id})
        return context

    @action(detail=False, methods=['GET'])
    def me(self, request):
        user_key = get_object_or_404(UserKey, user=request.user.id)
        serializer = UserKeySerializer(user_key).data
        return Response(serializer, status=status.HTTP_200_OK)

class APIViewBase(APIView):
    permission_classes = [AllowAny]
    serializer_class = ''

    def get_serializer(self, *args, **kwargs) -> serializers.Serializer:
        """Manually define get_serializer for APIView"""
        return self.serializer_class(*args, **kwargs)

    def gen_tokens_for_user(self, user) -> Response:
        refresh_token = RefreshToken.for_user(user)
        access_token = refresh_token.access_token
        response_data = {'access_token': str(access_token)}

        response = Response(response_data, status=status.HTTP_200_OK)
        response.set_cookie(key='refresh_token', value=refresh_token, max_age=settings.REFRESH_TOKEN_LIFETIME.total_seconds(),
                            secure=settings.SESSION_COOKIE_SECURE, httponly=True, samesite=settings.SESSION_COOKIE_SAMESITE, domain=None, path='/')
        return response

class UserActivationViewSet(APIViewBase):
    serializer_class = UserActivationSerializer

    def post(self, request, *args, **kwargs):
        """Verify user's email using activation key"""

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        # user_id = verify_activation_key(activation_key)

        # if not user_id:
        #     return Response({'status': 'Invalid or expired activation_key'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)

            # if user.is_verified:
            #     return Response({'status': 'Email already verified'}, status=status.HTTP_200_OK)

            user.is_verified = True
            user.save()

            return self.gen_tokens_for_user(user) # Returns Response with refresh token in http-ONLY cookie nad access token in body

        except User.DoesNotExist:
            return Response({'status': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class ResendActivationEmailViewSet(APIViewBase):
    serializer_class = ResendActivationEmailSerializer

    def post(self, request, *args, **kwargs):
        """Resend email to user with new activation key"""

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']

        if user.is_verified:
            return Response({'status': 'Email already verified'}, status=status.HTTP_200_OK)

        send_verification_mail.delay(str(user.id), user.username, user.email) # user.id must be string and not UUID object

        return Response({'message': 'Email sent successfuly'}, status=status.HTTP_200_OK)


class CreateJWT(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer
    permission_classes = [HasEmailVerifiedPermission]

    def post(self, request, *args, **kwargs):
        response =  super().post(request, *args, **kwargs) # Obtain the refresh and access tokens via TokenObtainPairSerializer
        refresh_token = response.data['refresh'] # Get refresh token from respose data (body)
        del response.data['refresh'] # Remove refresh token from response data (body)

        # Set refresh token in HTTP-only cookie (not body) - reportedly more secure than storing in localstore in frontned - immune to js thus save from XSS - I think at least)
        if refresh_token:
            response.set_cookie(key='refresh_token', value=refresh_token, max_age=settings.REFRESH_TOKEN_LIFETIME.total_seconds(),
                            secure=settings.SESSION_COOKIE_SECURE, httponly=True, samesite=settings.SESSION_COOKIE_SAMESITE, domain=None, path='/')

        return response

class RefreshJWT(TokenRefreshView):
    def post(self, request, *args, **kwargs):

        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response({'refresh_token': ['No refresh_token in cookies']}, status=400)

        request.data['refresh'] = refresh_token # Get the data from http-only cookie and pass into default endpoint in body
        return super().post(request, *args, **kwargs) # Return new access token

class ExpireJWT(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):

        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({'message': 'No refresh token.'}, status=status.HTTP_200_OK) # This endpoint returns status code of 204 as well as if there is no refresh token that means user is already logged out so everything is fine

        try:
            token = RefreshToken(refresh_token)
            token.blacklist() # Revoke token so that it cannot be used again
            return Response({'message': 'Successfuly logged out'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message': 'Already logged out or invalid token'}, status=status.HTTP_200_OK)
