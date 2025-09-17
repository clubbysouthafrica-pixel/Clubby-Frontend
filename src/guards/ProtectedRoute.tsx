import React, { useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from "@/context/AuthContext.tsx";
import { Button } from "@/components/ui/button"
import {
    Card,
    CardHeader,
} from "@/components/ui/card"

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();
    const [sessionExpired, setSessionExpired] = useState(false);

    if (!authContext) {
        throw new Error("ProtectedRoute must be used within an AuthProvider");
    }

    const { user, loading, logout } = authContext;

    useEffect(() => {
        const checkTokenValidity = () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setSessionExpired(true);
                return;
            }
            if (import.meta.env.VITE_ENVIRONMENT !== "Dev") {
                try {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    const exp = payload.exp * 1000;

                    if (Date.now() > exp) {
                        setSessionExpired(true);
                    }
                } catch (e) {
                    setSessionExpired(true);
                }
            }
        };

        checkTokenValidity();
        const interval = setInterval(checkTokenValidity, 5 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handleRelogin = () => {
        const adminFlag = localStorage.getItem("isAdmin") === "true";
        navigate(adminFlag ? "/admin/login" : "/login");
        logout();
    };

    if (loading) return <div>Loading...</div>;
    if (!user && !sessionExpired) return <Navigate to="/login" />;

    if (sessionExpired) {
        return (
            <Card className="fixed m-1 inset-0 flex items-center justify-center bg-black/50 z-50">
                <div className="bg-white p-6 rounded shadow-lg text-center max-w-sm">
                    <CardHeader className="mb-1 text-s font-small p-1">Your session has expired.</CardHeader>
                    <Button onClick={handleRelogin}>
                        Click here to re-login
                    </Button >
                </div>
            </Card>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
