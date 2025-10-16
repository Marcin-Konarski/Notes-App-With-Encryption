import { apiClient } from "@/services/ApiClient"


class UserService {

    getUsersList() {
        return apiClient.get('/users/users/'); // This endpoint is used for geting users list in order to share notes to other users
    }

    createUser(data) {
        return apiClient.post('/users/users/', data);
    }

    getUserDetails() {
        return apiClient.get('/users/users/me/');
    }

    updateUser(data) {
        return apiClient.put('/users/users/me/', data);
    }

    deleteUser() {
        return apiClient.delete('/users/users/me/');
    }

    changePassword(data) {
        return apiClient.post('/users/users/change_password/', data);
    }

    getTokens(data) {
        return apiClient.post('/users/jwt/create/', data)
    }

    refreshToken() {
        return apiClient.post('/users/jwt/refresh/');
    }

    sendPublicKey(data) {
        return apiClient.post('/users/keys/', data)
    }

    async expireToken() {
        return apiClient.post('/users/jwt/expire/').catch(() => {
            return Promise.resolve() // If there are error - user might already be logged out thus ignore all errors
        })
    }
}

export default new UserService