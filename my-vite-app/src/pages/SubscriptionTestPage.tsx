import React from "react";
import { Button, Card, Space } from "antd";
import { useNavigate } from "react-router";

const SubscriptionTestPage: React.FC = () => {
  const navigate = useNavigate();

  const testSuccessRoute = () => {
    navigate("/subscription/success?session_id=test_session_123");
  };

  const testCancelRoute = () => {
    navigate("/subscription/cancel");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card title="Test Subscription Routes" className="max-w-md">
        <Space direction="vertical" size="large" className="w-full">
          <p>Use these buttons to test the subscription flow:</p>

          <Button type="primary" size="large" block onClick={testSuccessRoute}>
            Test Success Page
          </Button>

          <Button size="large" block onClick={testCancelRoute}>
            Test Cancel Page
          </Button>

          <Button type="link" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default SubscriptionTestPage;
