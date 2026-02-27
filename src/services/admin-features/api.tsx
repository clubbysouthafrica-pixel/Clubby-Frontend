import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_ADMIN_FEATURES_BACKEND_API,
    timeout: 10000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken'); 

        if (token) {
            config.headers['Authorization'] = `${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

export { api }