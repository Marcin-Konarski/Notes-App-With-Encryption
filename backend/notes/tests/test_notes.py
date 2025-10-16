import pytest
from rest_framework.test import APIClient
from rest_framework import status
from model_bakery import baker

from notes.models import Note, NoteItem


@pytest.mark.django_db
class TestCreateNotes:

    def test_create_note_but_user_not_authenticated_returns_401(self, api_client):

        body = {
            "title": "aa",
            "body": "aa",
            "is_encrypted": True
        }
        response = api_client.post('/notes/notes/', body)

        assert status.HTTP_401_UNAUTHORIZED == response.status_code


    def test_create_unencrypted_note_returns_201(self, api_client, make_authenticated_user_and_user_key):
        user, user_key = make_authenticated_user_and_user_key(api_client) # This line is neccessary as the endpoint should expect authenticated users only, and requires users to have UserKey created

        body = {
            "title": "aa",
            "body": "aa",
            "is_encrypted": False
        }
        response = api_client.post('/notes/notes/', body)

        assert status.HTTP_201_CREATED == response.status_code
        for field in ['id', 'title', 'body', 'owner', 'is_encrypted', 'created_at', 'noteitem']: # Check that expected fields are present in the response
            assert field in response.data
        assert False == response.data.get('is_encrypted')


    def test_create_encrypted_note_returns_201(self, api_client, make_authenticated_user_and_user_key):
        user, user_key = make_authenticated_user_and_user_key(api_client) # This line is neccessary as the endpoint should expect authenticated users only, and requires users to have UserKey created

        body = {
            "title": "aa",
            "body": "aa",
            "is_encrypted": True,
            'encryption_key': 'aa'
        }
        response = api_client.post('/notes/notes/', body)

        assert status.HTTP_201_CREATED == response.status_code
        for field in ['id', 'title', 'body', 'owner', 'is_encrypted', 'created_at', 'noteitem']: # Check that expected fields are present in the response
            assert field in response.data
        assert True == response.data.get('is_encrypted')





@pytest.mark.django_db
class TestDeleteNotes:

    def test_delete_note_but_user_not_authenticated_returns_401(self, api_client, make_note, make_user):
        note = make_note(api_client) # Create a note (this fixture already authenticated users)
        api_client.force_authenticate(user=None) # log out to make user not authenticated

        response = api_client.delete(f'/notes/notes/{note.id}/')

        assert status.HTTP_401_UNAUTHORIZED == response.status_code


    def test_delete_note_but_user_is_not_note_owner_returns_403(self, api_client, make_note, make_authenticated_user):
        note = make_note(api_client)  # Create note with authenticated authenticated user
        new_client = APIClient() # new api_client to log in as user who is not note's owner
        user = make_authenticated_user(new_client) # Log in as new user

        response = new_client.delete(f'/notes/notes/{note.id}/')

        assert status.HTTP_403_FORBIDDEN == response.status_code


    def test_delete_note_returns_204(self, api_client, make_note):
        note = make_note(api_client) # Already authenticated user

        response = api_client.delete(f'/notes/notes/{note.id}/')

        assert status.HTTP_204_NO_CONTENT == response.status_code




@pytest.mark.django_db
class TestChangeEncryptionNotes:

    def test_change_unencrypted_note_encryption_to_true_returns_200(self, api_client, make_authenticated_user_and_user_key, make_note):
        user, user_key = make_authenticated_user_and_user_key(api_client)
        note = make_note(api_client, user=user)
        is_encrypted = note.is_encrypted

        body = {
            "new_body": "aa",
            "is_encrypted": True,
            "keys": [
                {
                    "user_id": user.id,
                    "key": "aa"
                },
            ]
        }
        response = api_client.put(f'/notes/notes/{note.id}/change_encryption/', data=body, format='json')

        print(response.data)
        assert status.HTTP_200_OK == response.status_code
        assert is_encrypted != response.data.get('is_encrypted')


    def test_change_encrypted_note_encryption_to_false_returns_200(self, api_client, make_note, make_authenticated_user):
        note = make_note(api_client, is_encrypted=True)
        is_encrypted = note.is_encrypted

        body = {
            "new_body": "aa",
            "is_encrypted": False
        }
        response = api_client.put(f'/notes/notes/{note.id}/change_encryption/', data=body, format='json')

        print(response.data)
        assert status.HTTP_200_OK == response.status_code
        assert is_encrypted != response.data.get('is_encrypted')


    def test_change_encrypted_note_encryption_to_false_but_note_is_shared_with_other_users_returns_200(self, api_client, make_shared_note):
        note, owner, shared_user, shared_user_key = make_shared_note(api_client, is_encrypted=True)
        is_encrypted = note.is_encrypted

        body = {
            "new_body": "aa",
            "is_encrypted": False
        }
        response = api_client.put(f'/notes/notes/{note.id}/change_encryption/', data=body, format='json')

        assert status.HTTP_200_OK == response.status_code
        assert is_encrypted != response.data.get('is_encrypted')
        assert response.data.get('users_affected') == 2  # Owner + shared user


    def test_change_unencrypted_note_encryption_to_true_but_note_is_shared_with_other_users_returns_200(self, api_client, make_shared_note):
        note, owner, shared_user, shared_user_key = make_shared_note(api_client, is_encrypted=False)
        is_encrypted = note.is_encrypted

        body = {
            "new_body": "aa",
            "is_encrypted": True,
            "keys": [
                {
                    "user_id": str(owner.id),
                    "key": "aa"
                },
                {
                    "user_id": str(shared_user.id),
                    "key": "aa"
                }
            ]
        }
        response = api_client.put(f'/notes/notes/{note.id}/change_encryption/', data=body, format='json')

        assert status.HTTP_200_OK == response.status_code
        assert is_encrypted != response.data.get('is_encrypted')
        assert len(response.data.get('users')) == 2





@pytest.mark.django_db
class TestShareNotes:

    def test_get_shared_with_users_returns_200(self, api_client, make_shared_note):
        note, owner, shared_user, shared_user_key = make_shared_note(api_client, share_permission='R')

        response = api_client.get(f'/notes/notes/{note.id}/share/')

        assert status.HTTP_200_OK == response.status_code
        assert 'shared_with' in response.data
        assert len(response.data.get('shared_with')) == 2  # Owner + shared user
        user_ids = [user.get('user_id') for user in response.data.get('shared_with')] # Get all user ids from the response
        assert owner.id in user_ids # Check if owner is in the response
        assert shared_user.id in user_ids # Check if shared user is in the response


    def test_share_unencrypted_note_returns_201(self, api_client, make_note, make_authenticated_user_and_user_key):
        target_user, target_user_key = make_authenticated_user_and_user_key(api_client) # create authenticated user with their corresponsing UserKey
        new_client = APIClient() # New session
        note = make_note(new_client, is_encrypted=False) # Create a note (for that creates a user and corresponding UserKey first)

        body = {
            "user": str(target_user.id),
            "permission": "R"
        }
        response = new_client.post(f'/notes/notes/{note.id}/share/', data=body, format='json') # Share note with `new_client` - the note's owner

        assert status.HTTP_201_CREATED == response.status_code
        assert 'Note shared' in response.data.get('detail')


    def test_share_encrypted_note_returns_201(self, api_client, make_note, make_authenticated_user_and_user_key):
        target_user, target_user_key = make_authenticated_user_and_user_key(api_client)
        new_client = APIClient()
        note = make_note(new_client, is_encrypted=True)

        body = {
            "user": str(target_user.id),
            "encryption_key": "aa",
            "permission": "R"
        }
        response = new_client.post(f'/notes/notes/{note.id}/share/', data=body, format='json') # Share note with `new_client` - the note's owner

        assert status.HTTP_201_CREATED == response.status_code
        assert 'Note shared' in response.data['detail']


    def test_user_with_share_permissions_shares_note_returns_201(self, api_client, make_note, make_user_with_permission, make_authenticated_user_and_user_key):
        note = make_note(api_client, is_encrypted=False) # Create note as note owner
        sharing_user, sharing_user_key = make_user_with_permission(api_client, note, permission='S') # Share a note to user and set permission to 'S'
        new_client_for_target_user = APIClient() # New session to create target user
        target_user, targer_user_key = make_authenticated_user_and_user_key(new_client_for_target_user)


        # Authenticate as user with share permissions
        new_client = APIClient()
        new_client.force_authenticate(user=sharing_user)

        body = {
            "user": str(target_user.id),
            "permission": "R"
        }
        response = new_client.post(f'/notes/notes/{note.id}/share/', data=body, format='json')

        assert status.HTTP_201_CREATED == response.status_code
        assert 'Note shared' in response.data['detail']


    def test_share_note_but_user_not_authenticated_returns_401(self, api_client, make_note, make_user):
        note = make_note(api_client)
        target_user = make_user()

        api_client.force_authenticate(user=None) # Log out user

        body = {
            "user": str(target_user.id),
            "permission": "R"
        }
        response = api_client.post(f'/notes/notes/{note.id}/share/', data=body, format='json')

        assert status.HTTP_401_UNAUTHORIZED == response.status_code


    def test_share_note_but_user_does_not_have_share_permissions_returns_403(self, api_client, make_note, make_user_with_permission, make_authenticated_user_and_user_key):
        note = make_note(api_client, is_encrypted=False)
        user_with_write_only, user_key = make_user_with_permission(api_client, note, permission='W')  # Only write permissions
        new_client_for_target_user = APIClient() # New session to create target user
        target_user, targer_user_key = make_authenticated_user_and_user_key(new_client_for_target_user) # Target user to whom this note will be shared to

        # Authenticate as user with only write permissions
        new_client = APIClient()
        new_client.force_authenticate(user=user_with_write_only)

        body = {
            "user": str(target_user.id),
            "permission": "R"
        }
        response = new_client.post(f'/notes/notes/{note.id}/share/', data=body, format='json')

        assert status.HTTP_403_FORBIDDEN == response.status_code




