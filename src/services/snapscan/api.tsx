import axios from "axios";
import { handleUnauthorizedSession, shouldHandleUnauthorizedError } from "../auth-session";

const api = axios.create({
    baseURL: import.meta.env.VITE_SNAPSCAN_BACKEND_API,
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
        // Handle request errors
        return Promise.reject(error);
    }
)

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (shouldHandleUnauthorizedError(error)) {
            handleUnauthorizedSession();
        }

        return Promise.reject(error);
    }
)

export { api }