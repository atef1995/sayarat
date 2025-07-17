import "./App.css";
import SearchSelect from "./components/SearchSelect";
import MyLayout from "./Layout";
import PaginatedCards from "./components/PaginatedCards";
import { useSearchParams, useNavigate } from "react-router";
import { useEffect } from "react";
import { message } from "antd";
import { useAuth } from "./hooks/useAuth";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkSession } = useAuth();

  useEffect(() => {
    const handleFacebookAuth = async () => {
      const facebookAuth = searchParams.get("facebook_auth");

      if (facebookAuth === "success") {
        // Remove the parameter from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("facebook_auth");
        setSearchParams(newSearchParams);

        // Check if user is now authenticated
        try {
          const authResult = await checkSession();
          if (authResult.data?.isAuthenticated) {
            message.success("تم تسجيل الدخول بنجاح عبر فيسبوك");

            // Get redirect URL from session storage or default to profile
            const redirectTo =
              sessionStorage.getItem("postLoginRedirect") || "/profile";
            sessionStorage.removeItem("postLoginRedirect");

            setTimeout(() => {
              navigate(redirectTo, { replace: true });
            }, 1500);
          } else {
            message.error("فشل في تسجيل الدخول عبر فيسبوك");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          message.error("حدث خطأ أثناء التحقق من تسجيل الدخول");
        }
      } else if (facebookAuth === "failed") {
        // Remove the parameter from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("facebook_auth");
        setSearchParams(newSearchParams);

        message.error("فشل في تسجيل الدخول عبر فيسبوك");
      }
    };

    handleFacebookAuth();
  }, [searchParams, setSearchParams, navigate, checkSession]);

  return (
    <MyLayout>
      <SearchSelect onSearch={(params) => setSearchParams(params)} />
      <PaginatedCards searchParams={searchParams} />
    </MyLayout>
  );
}

export default App;
