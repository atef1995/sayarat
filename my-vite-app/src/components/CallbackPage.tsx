import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

const CallbackPage = () => {
  const navigate = useNavigate();
  const { checkSession } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await checkSession();
        navigate("/profile");
      } catch (error) {
        console.error("Authentication error:", error);
        navigate("/login");
      }
    };

    handleCallback();
  }, []);

  return <div>Loading...</div>;
};

export default CallbackPage;
