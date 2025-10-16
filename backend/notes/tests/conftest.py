import pytest
from django.apps import apps
from django.conf import settings
from rest_framework.test import APIClient
from model_bakery import baker

from notes.models import Note, NoteItem


# Helper functions to use in fixtures (to avoid code duplication):

def create_user():
    User = apps.get_model(settings.AUTH_USER_MODEL) # Get User model from django settings (this way maintains loose coupling principle - I think)
    return baker.make(User)

def create_authenticated_user(api_client):
    user = create_user()
    api_client.force_authenticate(user=user) # Authenticate a user
    return user

def create_authenticated_user_and_user_key(api_client):
    user = create_authenticated_user(api_client)
    UserKey = apps.get_model(settings.AUTH_USER_KEY_MODEL) # Get UserKey model from django settings (this way maintains loose coupling principle - I think)
    user_key = baker.make(UserKey, user=user) # Make UserKey for authenticated user
    return user, user_key





# Pytest fixtures:

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def make_user():
    def do_make_user():
        return create_user() # Factory uses helper function to avoid code duplication
    return do_make_user

@pytest.fixture
def make_authenticated_user():
    def do_make_authenticated_user(api_client):
        return create_authenticated_user(api_client)
    return do_make_authenticated_user

@pytest.fixture
def make_authenticated_user_and_user_key():
    def do_make_authenticated_user_and_user_key(api_client):
        return create_authenticated_user_and_user_key(api_client)
    return do_make_authenticated_user_and_user_key





@pytest.fixture
def make_note():
    def do_make_note(api_client, user=None, is_encrypted=False):
        if not user:
            user, user_key = create_authenticated_user_and_user_key(api_client)
        return baker.make(Note, owner=user, is_encrypted=is_encrypted)
    return do_make_note




@pytest.fixture
def make_shared_note():
    def do_make_shared_note(api_client, is_encrypted=False, share_permission='R'):
        owner, owner_key = create_authenticated_user_and_user_key(api_client) # Create owner and their key

        # Create another user to share with
        shared_user = create_user()
        UserKey = apps.get_model(settings.AUTH_USER_KEY_MODEL)
        shared_user_key = baker.make(UserKey, user=shared_user)

        note = baker.make(Note, owner=owner, is_encrypted=is_encrypted) # Create note

        note_item = baker.make(NoteItem, note=note, user_key=owner_key, permission='O') # Create NoteItem for owner

        # Create NoteItem for shared user
        note_item_data = {
            'note': note,
            'user_key': shared_user_key,
            'permission': share_permission
        }
        if is_encrypted: # Dynamically add encryption key to the data
            note_item_data['encryption_key'] = b'aa'

        shared_note_item = baker.make(NoteItem, **note_item_data)

        return note, owner, shared_user, shared_user_key
    return do_make_shared_note




@pytest.fixture
def make_user_with_permission():
    def do_make_user_with_permission(api_client, note, permission='R'):
        # user = create_user()
        # UserKey = apps.get_model(settings.AUTH_USER_KEY_MODEL)
        # user_key = baker.make(UserKey, user=user)
        user, user_key = create_authenticated_user_and_user_key(api_client)

        note_item_data = {
            'note': note,
            'user_key': user_key,
            'permission': permission
        }
        if note.is_encrypted:
            note_item_data['encryption_key'] = b'aa'

        baker.make(NoteItem, **note_item_data)
        return user, user_key
    return do_make_user_with_permission