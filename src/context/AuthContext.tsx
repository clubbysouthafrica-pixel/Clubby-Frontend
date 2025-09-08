import {createContext, ReactNode, useEffect, useState} from 'react';
import axios, {AxiosResponse} from 'axios';

export interface AuthContextType {
    user: boolean | null;
    isAdmin: boolean | false;
    loading: boolean;
    login: (isAdmin: boolean, email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string) => Promise<AxiosResponse>;
    logout: () => void;
    verifyConfirmationCode: (email: string, confirmationCode: string) => Promise<AxiosResponse>;
}

export interface User {
    name: string;
    username: string;
    displayName: string;
    // add any other properties your user object may have
}

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const accessToken = "accessToken"
const refreshToken = "refreshToken"
const adminKey = "isAdmin"

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const apiUrl = import.meta.env.VITE_BACKEND_API;
    const adminApiUrl = import.meta.env.VITE_ADMIN_BACKEND_API;

    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [user, setUser] = useState<boolean | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const token = localStorage.getItem(accessToken);
        const isAdmin = localStorage.getItem(adminKey);

        setUser(!!token);
        setIsAdmin(isAdmin === "true");
        setLoading(false);
    }, []);

    const login = async (isAdmin: boolean, email: string, password: string): Promise<boolean> => {
        const response = await axios.post((isAdmin ? adminApiUrl : apiUrl) + ( isAdmin ? '/admin/signIn': '/member/signIn'), { username: email, password });

        // Store tokens
        localStorage.setItem(accessToken, response.data.accessToken);
        localStorage.setItem(refreshToken, response.data.refreshToken);

        if (isAdmin) {
            localStorage.setItem(adminKey, "true")
            setIsAdmin(true)
        }

        axios.defaults.headers.common['Authorization'] = `${response.data.accessToken}`;
        setUser(true);

        return response.data.onboarded
    };

    const verifyConfirmationCode = async (email: string, confirmationCode: string) => {
        return axios.post(apiUrl + '/member/verifySignUp', { username: email, confirmation_code: confirmationCode });
    }

    const register = (email: string, password: string): Promise<AxiosResponse> => {
        return axios.post(apiUrl + '/member/signUp',
            {username: email, password},
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        )
    };

    const logout = () => {
        localStorage.removeItem(accessToken);
        localStorage.removeItem(refreshToken);
        localStorage.removeItem(adminKey)
        
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setIsAdmin(false)
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, verifyConfirmationCode, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
