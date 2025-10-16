import pytest
from model_bakery import baker
from rest_framework import status
from django.conf import settings

from accounts.models import User, UserKey


@pytest.mark.django_db
class TestUser:

    def test_id_user_created_returns_201(self, api_client):
        # AAA (Arrange, Act, Assert)

        user_object = {
            "username": "b",
            "email": "b@domain.com",
            "password": "bb1234bb"
        }
        response = api_client.post('/users/users/', user_object)

        assert 201 == response.status_code


    # @pytest.mark.skip
    def test_if_user_details_retrieved_but_user_not_authenticated_returns_401(self, api_client):

        response = api_client.get('/users/users/me/')

        assert status.HTTP_401_UNAUTHORIZED == response.status_code


    def test_if_user_details_retrieved_returns_200(self, api_client, authenticate):
        user = baker.make(User)
        authenticate(api_client, user)
        print(user.__dict__)

        response = api_client.get('/users/users/me/')

        assert status.HTTP_200_OK == response.status_code
        assert response.data == {
            'id': str(user.id),
            'username': user.username,
            'email': user.email
        }
        assert 'password' not in response.data


    def test_if_user_details_updated_but_user_not_authenticated_returns_401(self, api_client):
        user = baker.make(User)
        print(user.__dict__)

        updated_user = {
            'username': 'updated_username',
            'email': 'updated_email@domain.com'
        }
        response = api_client.put('/users/users/me/', updated_user)

        assert status.HTTP_401_UNAUTHORIZED == response.status_code # Check status code of the response


    def test_if_user_details_updated_returns_200(self, api_client, authenticate):
        user = baker.make(User)
        authenticate(api_client, user)
        print(user.__dict__)

        updated_user = {
            'username': 'updated_username',
            'email': 'updated_email@domain.com'
        }
        response = api_client.put('/users/users/me/', updated_user)

        # Refresh user from database
        user.refresh_from_db()

        # Check status code of the response:
        assert status.HTTP_200_OK == response.status_code
        # Check if response data matches and was correctly updated:
        assert response.data == {
            'id': str(user.id),
            'username': user.username,
            'email': user.email
        }
        # check if data was actually updated correctly in the db:
        assert user.username == updated_user.get('username')
        assert user.email == updated_user.get('email')


    def test_if_user_delete_but_user_not_authenticated_returns_401(self, api_client):

        response = api_client.delete('/users/users/me/')

        assert status.HTTP_401_UNAUTHORIZED == response.status_code

    def test_if_user_successful_deletion_returns_204(self, api_client, authenticate):
        user = baker.make(User)
        authenticate(api_client, user)
        print(user.__dict__)

        response = api_client.delete('/users/users/me/')

        assert status.HTTP_204_NO_CONTENT == response.status_code
        with pytest.raises(User.DoesNotExist):
            User.objects.get(id=user.id)


@pytest.mark.django_db
class TestUserKey:

    def test_if_user_key_created_but_user_not_authorized_returns_401(self, api_client):

        user_key_object = {"public_key": "some_valid_public_key_string"}
        response = api_client.post('/users/keys/', user_key_object)

        assert status.HTTP_401_UNAUTHORIZED == response.status_code


    def test_if_user_key_created_returns_201(self, api_client, authenticate):
        user = baker.make(User)
        authenticate(api_client, user)
        
        user_key_object = {"public_key": "some_valid_public_key_string"}
        response = api_client.post('/users/keys/', user_key_object)

        assert status.HTTP_201_CREATED == response.status_code
        assert response.data['user'] == user.id
        assert response.data['public_key'] == "some_valid_public_key_string"
        assert 'id' in response.data
        assert 'created_at' in response.data


    def test_if_user_key_retrieve_but_user_not_authenticated_returns_401(self, api_client, authenticate):
        
        response = api_client.get('/users/keys/me/')

        assert status.HTTP_401_UNAUTHORIZED == response.status_code

    def test_if_user_key_retrieve_returns_200(self, api_client, authenticate):
        user = baker.make(User)
        authenticate(api_client, user)
        key = 'valid_public_key_text'
        user_key = baker.make(UserKey, user=user, public_key=key.encode(settings.DEFAULT_ENCODING))

        response = api_client.get('/users/keys/me/')

        print(response, response.data)
        print(f'{str(user_key.id)=}')
        print(f'{user_key.user.id=}')
        print(f'{user_key.public_key=}')
        print(f'{user_key.created_at.isoformat()=}')

        assert status.HTTP_200_OK == response.status_code
        assert response.data == {
            'id': str(user_key.id),
            'user': user_key.user.id,
            'public_key': key,
            'created_at': user_key.created_at.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),  # Use strftime to format created_at to match the DRF's formatiing
        }


    def test_if_user_key_delete_but_user_is_not_authenticated_returns_401(self, api_client, authenticate):
        user = baker.make(User)
        authenticate(api_client, user)
        user_key = baker.make(UserKey, user=user)

        response = api_client.delete(f'/users/keys/{user_key.id}/')

        assert status.HTTP_204_NO_CONTENT == response.status_code
        with pytest.raises(UserKey.DoesNotExist):
            UserKey.objects.get(id=user_key.id)


