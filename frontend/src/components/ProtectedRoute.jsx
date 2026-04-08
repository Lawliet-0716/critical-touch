import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    const savedRole = localStorage.getItem("role") || "patient";
    return <Navigate to={`/${savedRole}/login`} />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} />;
  }

  return children;
}
