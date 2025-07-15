import React, { useState } from "react";
import { Button, Card, Space, Typography } from "antd";
import {
  UserAddOutlined,
  CarOutlined,
  StarFilled,
  HeartFilled,
  CloseOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";

const { Text, Title } = Typography;

/**
 * Guest Call-to-Action Banner
 *
 * Elegant banner that encourages non-authenticated users to create an account
 * Shows the benefits of signing up in an attractive way
 */
const GuestCTABanner: React.FC = () => {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);

  if (hidden) {
    return null;
  }

  return (
    <Card className="absolute top-1/4  mb-6 bg-gradient-to-r dark:bg-blue-800 shadow-sm hover:shadow-md transition-all duration-300 z-50">
      {/* Close button positioned in top-right corner */}
      <Button
        type="text"
        icon={<CloseOutlined />}
        onClick={() => setHidden(true)}
        className="absolute top-2 left-2 z-10 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-gray-100 dark:hover:bg-gray-500 active:bg-gray-500 rounded-full transition-colors duration-200"
        size="small"
      />

      <div className="text-center pt-2">
        <Space direction="vertical" size="middle" className="w-full">
          {/* Header with icons */}
          <div className="flex justify-center items-center gap-2 mb-2">
            <CarOutlined className="text-blue-500 text-xl" />
            <StarFilled className="text-yellow-500 text-lg" />
            <HeartFilled className="text-red-500 text-lg" />
          </div>

          {/* Main message */}
          <Title level={4} className="!mb-2 text-gray-800 dark:text-gray-100">
            انضم إلى مجتمع سيارات اليوم! 🚗
          </Title>

          <Text className="text-base block max-w-md mx-auto leading-relaxed">
            أنشئ حسابك المجاني وتمتع ببيع وشراء السيارات بسهولة، وإدارة
            إعلاناتك، والتواصل مع البائعين مباشرة
          </Text>

          {/* Benefits list */}
          <div className="flex flex-wrap justify-center gap-4 mt-3 mb-4">
            <div className="flex items-center gap-1 text-sm">
              <CarOutlined className="text-blue-500" />
              <span>بيع سيارتك بسهولة</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <HeartFilled className="text-red-500" />
              <span>حفظ المفضلة</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <StarFilled className="text-yellow-500" />
              <span>تجربة مميزة</span>
            </div>
          </div>

          {/* Action buttons */}
          <Space size="middle" wrap>
            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              onClick={() => navigate("/signup")}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-none shadow-lg hover:shadow-xl transition-all duration-300"
              style={{ minWidth: "140px" }}
            >
              إنشاء حساب مجاني
            </Button>

            <Button
              size="large"
              onClick={() => navigate("/login")}
              className="hover:text-blue-600 hover:border-blue-400 transition-colors duration-300"
              style={{ minWidth: "120px" }}
            >
              تسجيل الدخول
            </Button>
          </Space>

          {/* Company signup link */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Text className="text-sm ">
              هل أنت تاجر سيارات؟{" "}
              <Button
                type="link"
                size="small"
                onClick={() => navigate("/company-signup")}
                className="p-0 h-auto text-white hover:text-white font-medium"
              >
                إنشاء حساب شركة
              </Button>
            </Text>
          </div>
        </Space>
      </div>
    </Card>
  );
};

export default GuestCTABanner;
