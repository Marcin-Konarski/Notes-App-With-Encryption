import axios from "axios";


const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000', // Import URL from environment variable from docker-compose.yaml
    withCredentials: true,
})


let accessToken = undefined;


function getAccessToken() {
    return accessToken;
}

function setAccessToken(token) {
    accessToken = token;
}

function clearAccessToken() {
    accessToken = null;
}

apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();

        config.headers.Authorization =
            !config._retry && token
                ? `Bearer ${token}`
                : config.headers.Authorization;

        return config;
    },
    (error) => {
        return Promise.reject(error)
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.endsWith('/users/jwt/refresh/')
        ) {
            originalRequest._retry = true;
            try {
                const response = await apiClient.post('/users/jwt/refresh/');
                const token = response.data.access;
                setAccessToken(token);

                originalRequest.headers.Authorization = `Bearer ${token}`;
                return apiClient(originalRequest);
            } catch (err) {
                clearAccessToken();
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);


export { apiClient, getAccessToken, setAccessToken, clearAccessToken };