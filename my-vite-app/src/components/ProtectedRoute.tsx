import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";

interface ProtectedRouteProps {
  component: React.ComponentType;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  console.log("ProtectedRoute rendered, isAuthenticated:", isAuthenticated);

  useEffect(() => {
    if (isAuthenticated === false) {
      console.log(
        { isAuthenticated },
        "protected route, navigating to login.."
      );
      navigate("/login");
    }
  }, []);

  return <Component />;
};
