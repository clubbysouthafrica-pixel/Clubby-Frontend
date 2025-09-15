import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_API,
    timeout: 10000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken'); // Get token from localStorage (or any storage mechanism you're using)

        if (token) {
            config.headers['Authorization'] = `${token}`; // Add token to Authorization header
        }

        return config;
    },
    (error) => {
        // Handle request errors
        return Promise.reject(error);
    }
)

export { api }