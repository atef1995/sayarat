import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Card, Result, Spin } from "antd";
import { loadApiConfig } from "../config/apiConfig";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { apiUrl } = loadApiConfig();

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        if (isMounted) {
          setError("Invalid verification link");
          setVerifying(false);
        }
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/verify-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
          signal: abortController.signal,
        });

        if (!isMounted) return;

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Verification failed");
        }

        setVerifying(false);
        setTimeout(() => {
          if (isMounted) {
            navigate("/login");
          }
        }, 3000);
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error && err.name === "AbortError") return;

        setError(err instanceof Error ? err.message : "Verification failed");
        setVerifying(false);
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [searchParams, navigate, apiUrl]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px] text-center">
          <Spin size="large" />
          <p className="mt-4">جاري التحقق من البريد الإلكتروني...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px]">
        <Result
          status={error ? "error" : "success"}
          title={error ? "فشل التحقق" : "تم التحقق بنجاح"}
          subTitle={
            error
              ? error
              : "تم التحقق من بريدك الإلكتروني بنجاح. سيتم تحويلك إلى صفحة تسجيل الدخول."
          }
        />
      </Card>
    </div>
  );
};

export default VerifyEmail;
