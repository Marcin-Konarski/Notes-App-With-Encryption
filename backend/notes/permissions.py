from rest_framework.permissions import BasePermission
from django.apps import apps
from django.conf import settings
from .models import NoteItem


class HasAccessToNote(BasePermission):

    def has_permission(self, request, view):
        """Check if user has general permission to access the endpoint"""
        return bool(request.user and request.user.is_authenticated)

    def check_note_permission(self, user, note, required_permissions):
        if note.owner == user:
            return True

        try:
            UserKey = apps.get_model(settings.AUTH_USER_KEY_MODEL) # Get UserKey Model as UserKey has relation with NoteItem (and we want NoteItem as NoteItem has info about permission of current user to the note)
            user_key = UserKey.objects.get(user=user) # Query for user's UserKey
            note_item = NoteItem.objects.get(note=note, user_key=user_key) # Query for NoteItem
            return note_item.permission in required_permissions # Check if user's permission is in the list of required permissions for a given action
        except (UserKey.DoesNotExist, NoteItem.DoesNotExist):
            return False
        except Exception:
            raise


class CanReadNote(HasAccessToNote):
    def has_object_permission(self, request, view, obj):
        return self.check_note_permission(request.user, obj, ['R', 'W', 'S', 'O'])

class CanWriteNote(HasAccessToNote):
    def has_object_permission(self, request, view, obj):
        return self.check_note_permission(request.user, obj, ['W', 'S', 'O'])

class CanShareNote(HasAccessToNote):
    def has_object_permission(self, request, view, obj):
        return self.check_note_permission(request.user, obj, ['S', 'O'])

class CanDeleteNote(HasAccessToNote):
    def has_object_permission(self, request, view, obj):
        return self.check_note_permission(request.user, obj, ['O'])

class CanChangeEncryption(HasAccessToNote):
    def has_object_permission(self, request, view, obj):
        return self.check_note_permission(request.user, obj, ['O'])

