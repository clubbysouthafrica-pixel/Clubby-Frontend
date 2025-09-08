import React, { useContext, ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import {AuthContext} from "@/context/AuthContext.tsx";

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error("ProtectedRoute must be used within an AuthProvider");
    }

    const { user, loading } = authContext;

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    return <>{children}</>;
};

export default ProtectedRoute;
