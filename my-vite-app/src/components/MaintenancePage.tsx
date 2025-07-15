import React, { useEffect, useState } from "react";
import { Result, Button, Card, Typography, Space, Spin } from "antd";
import { ToolOutlined, ReloadOutlined, MailOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface MaintenancePageProps {
  estimatedReturnTime?: Date;
  message?: string;
  contactEmail?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Maintenance Page Component
 *
 * Features:
 * - Arabic RTL support
 * - Auto-refresh functionality
 * - Customizable messages and return time
 * - Responsive design with Ant Design
 * - Beautiful animations and loading states
 */
const MaintenancePage: React.FC<MaintenancePageProps> = ({
  estimatedReturnTime,
  message = "نعتذر عن الإزعاج. نقوم حالياً بتحديث الموقع لتقديم تجربة أفضل لك.",
  contactEmail = "support@sayarat.autos",
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate time remaining until estimated return
  useEffect(() => {
    if (!estimatedReturnTime) return;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const returnTime = estimatedReturnTime.getTime();
      const difference = returnTime - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft(
          `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`
        );
      } else {
        setTimeLeft("جاري التحقق...");
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [estimatedReturnTime]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const refreshTimer = setInterval(() => {
      setIsRefreshing(true);
      // Simulate a check - in real implementation, you'd check if maintenance is over
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }, refreshInterval);

    return () => clearInterval(refreshTimer);
  }, [autoRefresh, refreshInterval]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <Card
        className="max-w-2xl w-full text-center shadow-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <Space direction="vertical" size="large" className="w-full">
          {/* Logo and Title */}
          <div>
            <Title
              level={1}
              className="!text-4xl !mb-2"
              style={{ color: "#1890ff" }}
            >
              سيارات 🚗
            </Title>
            <div className="text-6xl mb-4">
              <ToolOutlined spin className="text-blue-500" />
            </div>
          </div>

          {/* Main Message */}
          <Result
            status="info"
            title={
              <Title level={2} className="!text-2xl">
                الموقع تحت الصيانة
              </Title>
            }
            subTitle={
              <Space direction="vertical" size="middle">
                <Paragraph className="text-lg text-gray-600">
                  {message}
                </Paragraph>

                {estimatedReturnTime && (
                  <Card size="small" className="bg-blue-50 border-blue-200">
                    <Paragraph strong>الوقت المقدر للعودة:</Paragraph>
                    <Paragraph className="text-blue-600">
                      {estimatedReturnTime.toLocaleString("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Paragraph>
                    {timeLeft && (
                      <Paragraph className="text-sm text-gray-500">
                        الوقت المتبقي: {timeLeft}
                      </Paragraph>
                    )}
                  </Card>
                )}
              </Space>
            }
            extra={[
              <Button
                key="refresh"
                type="primary"
                icon={isRefreshing ? <Spin size="small" /> : <ReloadOutlined />}
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                size="large"
              >
                {isRefreshing ? "جاري التحديث..." : "تحديث الصفحة"}
              </Button>,
            ]}
          />

          {/* Contact Information */}
          <Card size="small" className="bg-gray-50">
            <Space direction="vertical" size="small">
              <Paragraph strong>
                <MailOutlined /> في حالة الاستفسار:
              </Paragraph>
              <Paragraph copyable={{ text: contactEmail }}>
                البريد الإلكتروني: {contactEmail}
              </Paragraph>
              <Paragraph className="text-sm text-gray-500">
                📱 للدعم الفني: اتصل بنا عبر وسائل التواصل الاجتماعي
              </Paragraph>
            </Space>
          </Card>

          {/* Auto-refresh notification */}
          {autoRefresh && (
            <Paragraph className="text-sm text-gray-400">
              سيتم تحديث الصفحة تلقائياً كل {refreshInterval / 1000} ثانية
            </Paragraph>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default MaintenancePage;
