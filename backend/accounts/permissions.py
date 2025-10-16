from django.contrib.auth import authenticate
from rest_framework.permissions import BasePermission


class HasEmailVerifiedPermission(BasePermission):
    def has_permission(self, request, view):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password) # Get the user based on credentials form request
        if not user:
            self.message = "Invalid username or password."
            return False
        if not user.is_verified: # Verify if user has confirmed their passowrd
            self.message = "Your email is not verified. Please verify your email to proceed."
            return False

        request.user = user # Attach the user instance to the request object (to use in the LoginViewSet)
        return True
