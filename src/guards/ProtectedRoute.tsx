import React, { useContext, useEffect, useRef, ReactNode } from "react";
import { useNavigate, Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { buildLoginRedirectPath } from "@/services/auth-session";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const hasHandledSessionExpiry = useRef(false);

  if (!authContext) {
    throw new Error("ProtectedRoute must be used within an AuthProvider");
  }

  const { user, loading, logout } = authContext;

  useEffect(() => {
    const expireSession = () => {
      if (hasHandledSessionExpiry.current) {
        return;
      }

      hasHandledSessionExpiry.current = true;
      logout();
      navigate(
        buildLoginRedirectPath(`${location.pathname}${location.search}${location.hash}`),
        { replace: true },
      );
    };

    const checkTokenValidity = () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        expireSession();
        return;
      }
      if (import.meta.env.VITE_ENVIRONMENT !== "Dev") {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const exp = payload.exp * 1000;

          if (Date.now() > exp) {
            expireSession();
          }
        } catch (e) {
          expireSession();
        }
      }
    };

    checkTokenValidity();
    const interval = setInterval(checkTokenValidity, 5 * 1000);
    return () => clearInterval(interval);
  }, [location.hash, location.pathname, location.search, logout, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!user) {
    return (
      <Navigate
        to={buildLoginRedirectPath(`${location.pathname}${location.search}${location.hash}`)}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
