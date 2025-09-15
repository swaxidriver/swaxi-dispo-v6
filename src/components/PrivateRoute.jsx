import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

/**
 * PrivateRoute component that protects routes by checking authentication.
 * If user is not authenticated, redirects to /login with location state preserved.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected component to render
 */
function PrivateRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Check if user exists and has a valid role
  if (!user || !user.role) {
    // Redirect to login, preserving the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default PrivateRoute;