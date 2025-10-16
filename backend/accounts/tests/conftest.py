import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def authenticate():
    def do_authenticate(api_client, user):
        return api_client.force_authenticate(user=user)
    return do_authenticate
