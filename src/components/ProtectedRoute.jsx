import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "./ui/misc";

/**
 * Gate a route behind authentication and, optionally, an admin role.
 * Unauthenticated → /login; non-admins hitting an admin route → /.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
