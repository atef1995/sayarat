import "./App.css";
import SearchSelect from "./components/SearchSelect";
import MyLayout from "./Layout";
import PaginatedCards from "./components/PaginatedCards";
import { useSearchParams, useNavigate } from "react-router";
import { useEffect, useMemo } from "react";
import { message } from "antd";
import { useAuth } from "./hooks/useAuth";
import { CapacitorUtils } from "./utils/capacitor";
import SEOHelmet from "./components/seo/SEOHelmet";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkSession } = useAuth();

  const seoConfig = useMemo(() => {
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const location = searchParams.get("location");

    const hasSearchContext = Boolean(make || model || location);
    const dynamicTitle = hasSearchContext
      ? `سيارات ${make || ""} ${model || ""} ${location ? `في ${location}` : ""} | مزادات السيارات`
          .replace(/\s+/g, " ")
          .trim()
      : "مزادات السيارات - أفضل منصة لبيع وشراء السيارات في سوريا";

    const dynamicDescription = hasSearchContext
      ? `اكتشف أحدث عروض السيارات ${make ? `من ${make}` : ""} ${
          model ? model : ""
        } ${
          location ? `في ${location}` : "في سوريا"
        }. قارن الأسعار وتواصل مع البائعين بسرعة وأمان.`
          .replace(/\s+/g, " ")
          .trim()
      : "منصة مزادات السيارات الرائدة في سوريا. اكتشف أفضل العروض، قارن الأسعار، واعثر على سيارة أحلامك بأفضل الأسعار مع ضمان الجودة والأمان.";

    return {
      title: dynamicTitle,
      description: dynamicDescription,
      canonicalUrl: `${window.location.origin}/`,
      ogTitle: dynamicTitle,
      ogDescription: dynamicDescription,
      alternateUrls: [
        { hreflang: "ar", href: `${window.location.origin}/` },
        { hreflang: "x-default", href: `${window.location.origin}/` },
      ],
    };
  }, [searchParams]);

  useEffect(() => {
    // Initialize Capacitor mobile app features
    CapacitorUtils.addPlatformClasses();
    CapacitorUtils.configureMobileApp();
  }, []);

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
      <SEOHelmet
        title={seoConfig.title}
        description={seoConfig.description}
        canonicalUrl={seoConfig.canonicalUrl}
        ogTitle={seoConfig.ogTitle}
        ogDescription={seoConfig.ogDescription}
        alternateUrls={seoConfig.alternateUrls}
      />
      <SearchSelect onSearch={(params) => setSearchParams(params)} />
      <PaginatedCards searchParams={searchParams} />
    </MyLayout>
  );
}

export default App;
