import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_ADMIN_BACKEND_API, // Replace with your API base URL
    timeout: 10000, // Request timeout in milliseconds
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