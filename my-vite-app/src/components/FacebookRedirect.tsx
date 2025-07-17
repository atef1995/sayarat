import { useEffect } from "react";
import { Spin } from "antd";

/**
 * FacebookRedirect Component
 *
 * Handles redirection from frontend route to backend Facebook OAuth endpoint.
 * This component is necessary because React Router tries to handle /auth/facebook
 * as a frontend route, but we need it to go to the backend.
 */
const FacebookRedirect: React.FC = () => {
  useEffect(() => {
    // Immediately redirect to the backend Facebook OAuth endpoint
    window.location.href = `/auth/facebook`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spin size="large" />
        <div className="mt-4">
          <h3>جاري التوجيه إلى فيسبوك...</h3>
          <p className="text-gray-600">
            يرجى الانتظار بينما نقوم بتوجيهك لتسجيل الدخول عبر فيسبوك
          </p>
        </div>
      </div>
    </div>
  );
};

export default FacebookRedirect;
