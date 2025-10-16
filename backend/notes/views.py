from django.apps import apps
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin, UpdateModelMixin, DestroyModelMixin
from rest_framework.viewsets import GenericViewSet, ModelViewSet
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Note, NoteItem
from .serializers import NotesSerializer, NoteMeSerializer, NotesDetailSerializer, UserKeyInfoSerializer, \
            ChangeEncryptionSerializer, ShareNoteSerializer, ShareEncryptedNoteSerializer, GetPublicKeySerializer, RemoveAccessToNote
from .permissions import CanReadNote, CanWriteNote, CanShareNote, CanDeleteNote, CanChangeEncryption


class NotesViewSet(CreateModelMixin, RetrieveModelMixin, UpdateModelMixin, DestroyModelMixin, GenericViewSet): # This endpoint also supports the POST request
    queryset = Note.objects.all()
    serializer_class = NotesSerializer

    def _get_user_key(self, user_id_list):
        """Utility method to get UserKey for a user from settings Returns UserKey instance or None if not found."""
        #! CURRENTLY USER CAN HAVE MANY USERKEY RECORDS SO FILTER WILL RETURN A LIST OF OBJECTS
        #TODO: DO SOMETHING WITH THIS ^^ - EITHER ADDITIONAL QUERY OR ENSURE THAT A USER CAN HAVE JUST ONE USERKEY OBJECT -- DUNNO YET
        try:
            UserKey = apps.get_model(settings.AUTH_USER_KEY_MODEL) # Get the UserKey model from the settings - this approach maintains the principle of loose coupling between apps (I think)
            user_key_list = [UserKey.objects.get(user=user_id) for user_id in user_id_list]
            if 1 == len(user_key_list):
                return user_key_list[0]
            return user_key_list
        except UserKey.DoesNotExist:
            return None
        except (LookupError, AttributeError):
            #TODO: Handle case where AUTH_USER_KEY_MODEL setting doesn't exist
            return None


    def get_permissions(self):
        """Apply different permissions based on action."""
        if self.action == 'retrieve':
            permission_classes = [CanReadNote]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [CanWriteNote]
        elif self.action == 'destroy':
            permission_classes = [CanDeleteNote]
        elif self.action == 'share':
            permission_classes = [CanShareNote]
        elif self.action == 'change_encryption':
            permission_classes = [CanChangeEncryption]
        else:
            permission_classes = [IsAuthenticated]  # Default

        return [permission() for permission in permission_classes]


    def get_serializer_class(self):
        """Based on action returns serializer."""
        if self.action == 'remove_access':
            return RemoveAccessToNote
        if self.action in ['list', 'create']:
            return NotesSerializer # Basic info for list/create
        return NotesDetailSerializer # Detailed info for retrieve/update/delete of specific note


    def get_serializer_context(self):
        """Return owner_id in the context in order to automatically set owner id during notes creation."""
        context = super().get_serializer_context()
        context['owner_id'] = self.request.user.id # Inserts owner_id into context to use it in the NotesSerializer
        context['get_user_key'] = self._get_user_key # Pass the function to serializer so that it's reusable there :>
        return context


    @action(detail=False, methods=['GET'])
    def me(self, request):
        """Get all notes that current user has access to"""
        user_key = self._get_user_key([request.user.id])
        note_items = NoteItem.objects.filter(user_key=user_key).select_related('note')
        data = [NoteMeSerializer(note_item).data for note_item in note_items]

        return Response(data, status=status.HTTP_200_OK)


    # One cannot separate changing body from changing the encryption state from sending a key as those operations are tightly coupled - encrypted text without the key is useless and vice versa.
    # Marking encrypted text as not encrypted (without updating the text) would also render the text useless thus all those operations have to be combined in one endpoint
    # TODO: THIS SHOULD SET ENCRYPTION FOR ALL USERS THAT HAVE ACCESS TO THE NOTE!
    # !!!!!!!!!!!!!!!!!!!
    @action(detail=True, methods=['PUT'])
    def change_encryption(self, request, pk=None):
        """
        Change encryption status of specific note.
        This endpoint requires encrypted symmetric keys for all users that have access to the note
        (as symmetric key is encrypted with each users' public key and storred in the NoteItem.
        Also encrypted note's body differs from unencrypted thus new body is mandatory to store along those keys).
        """
        note = self.get_object() # Automatically get the note by pk from URL

        serializer = ChangeEncryptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_note_body = request.data.get('new_body')
        is_encrypted = request.data.get('is_encrypted')
        encryption_keys = request.data.get('keys')

        if is_encrypted and not encryption_keys:
            return Response({'encryption_keys': ['This field is required if is_encrypted is true']})

        note.body = new_note_body.encode(settings.DEFAULT_ENCODING) # Set new body
        note.is_encrypted = is_encrypted # Set encrypted state
        note.save() # Save this note in db (I always forget)

        # Disable encryption
        if not is_encrypted:
            NoteItem.objects.filter(note=note).update(encryption_key=None) # If id_encrypted is set to false (notes are no longer encrypted) than delete encryption_keys for all users who have access to this nore as they (keys) are no longer needed
            return Response({
                'detail': 'Encryption disabled successfully',
                'note_id': str(note.id),
                'is_encrypted': is_encrypted,
                'users_affected': NoteItem.objects.filter(note=note).count()
            }, status=status.HTTP_200_OK)


        # Enable/Update encryption:
        note_items = NoteItem.objects.filter(note=note).select_related('user_key').all() # Query for all NoteItems associated with current note and get related UserKeys in order to mathc user ids
        new_symmetric_keys_lookup = {key.get('user_id'): key.get('key') for key in encryption_keys} # Create a lookup dict from JSON data for O(n) complexity. This line results in {user_id: symmetric_key} dictionary

        required_user_ids = {str(note_item.user_key.user.id) for note_item in note_items} # Get all user IDs that have access to the note
        provided_user_ids = set(new_symmetric_keys_lookup.keys()) # Get all user IDs that were provided in the request
        missing_user_ids = required_user_ids - provided_user_ids # Find missing user IDs

        if missing_user_ids:
            return Response({
                'error': 'Missing encryption keys',
                'detail': f'Encryption keys required for all users with access to this note',
                'required_users': list(required_user_ids),
                'missing_users': list(missing_user_ids)
            }, status=status.HTTP_400_BAD_REQUEST) # Return info with all missing user ids

        # Update symmetric keys in db:
        for note_item in note_items:
            note_item_user_id = str(note_item.user_key.user.id) # Get user id from current NoteItem
            new_symmetric_key = new_symmetric_keys_lookup.get(note_item_user_id) # Get encrypted symmtric key associated with user id; using `[]` instead of .get() method as I want to raise excption if encryption keys were NOT provided for ALL users 
            if new_symmetric_key:
                note_item.encryption_key = new_symmetric_key.encode(settings.DEFAULT_ENCODING)
                note_item.save()

        return Response({
            'detail': 'Encryption updated successfully',
            'note_id': str(note.id),
            'is_encrypted': is_encrypted,
            'users': list(provided_user_ids)
        }, status=status.HTTP_200_OK)


    @action(detail=True, methods=['GET', 'POST'])
    def share(self, request, pk=None):
        """
        GET: List users who have access to this note
        POST: Share note with another user
        """
        note = self.get_object()

        if request.method == 'GET': # Return list of users with access to this note
            note_items = NoteItem.objects.filter(note=note).select_related('user_key__user')
            shared_users = [
                {
                    'user_id': item.user_key.user.id,
                    'user': item.user_key.user.username,
                    'permission': item.permission
                } for item in note_items
            ]
            return Response({'shared_with': shared_users}, status=status.HTTP_200_OK)

        elif request.method == 'POST':
            # POST method - share the note
            if note.is_encrypted: # Check if note is encrypted and based on that require (or don't) encryption_key in JSON
                serializer = ShareEncryptedNoteSerializer(data=request.data)
            else:
                serializer = ShareNoteSerializer(data=request.data) # For not encrypted notes don't require encryption_key in JSON
            serializer.is_valid(raise_exception=True)

            target_user = request.data.get('user')
            encryption_key = request.data.get('encryption_key')
            permission = request.data.get('permission')

            user_key_target = self._get_user_key([target_user]) # This is a UserKey instance of a user that the note will be shared to
            user_key_current = self._get_user_key([request.user.id]) # This is a UserKey of a user that shares the note

            # Verify if the target user has already access to this note
            if (note_item := NoteItem.objects.filter(note=note, user_key=user_key_target)).exists():
                obj = note_item.first()
                if obj.permission != 'O':
                    obj.permission = permission
                    obj.save()
                return Response({'detail': f'Updated {target_user} permissions to the note'}, status=status.HTTP_200_OK)

            if note.is_encrypted and not user_key_target:
                return Response({'non_field_errors': [f'Public key required for encrypted notes. User {target_user} has to create UserKey at /users/users/keys/']}, status=status.HTTP_400_BAD_REQUEST)

            if note.is_encrypted:
                new_note_item = NoteItem.objects.create(
                    note=note,
                    user_key=user_key_target,
                    encryption_key=encryption_key.encode(settings.DEFAULT_ENCODING), # Only for encrypted notes set encryption_key, empty otherwise
                    permission=permission
                )
            else:
                new_note_item = NoteItem.objects.create(
                    note=note,
                    user_key=user_key_target,
                    permission=permission
                )

            return Response({'detail': f'Note shared: {new_note_item.id}'}, status=status.HTTP_201_CREATED)


    @action(detail=False, methods=['DELETE'])
    def remove_access(self, request):
        """Remove a user's access to a note by deleting their NoteItem."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        note_id = serializer.validated_data['note']
        user_id = serializer.validated_data['user']

        try:
            UserKey = apps.get_model(settings.AUTH_USER_KEY_MODEL)
            user_key = UserKey.objects.get(user=user_id)
        
            deleted_count, _ = NoteItem.objects.filter(note_id=note_id, user_key=user_key).delete()

            if deleted_count == 0:
                return Response({'detail': 'User doesn\'t have access to the note'}, status=status.HTTP_404_NOT_FOUND)

            return Response({'detail': 'Access removed successfully'}, status=status.HTTP_204_NO_CONTENT)

        except UserKey.DoesNotExist:
            return Response({'detail': 'UserKey not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['GET'])
    def get_public_keys(self, request, pk=None):
        """List public keys of all users who have access to specific note"""
        note = self.get_object()
        # Get user keys for current note as UserKey entries hold the user's public keys and in order to properly encrypt notes symmetric key must be encrypted with public keys of all users who have access to the note
        users_public_key = NoteItem.objects.filter(note=note).select_related('user_key__user') # Here also get user that is realted to this user_key record as we want to reutrn user.id as well

        # Create the response data structure
        response_data = {
            'id': str(note.id),
            'keys': users_public_key
        }

        serializer = GetPublicKeySerializer(response_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


# TODO: Endure only authenticated users (those that have confirmed their email address) can access those endpoints.