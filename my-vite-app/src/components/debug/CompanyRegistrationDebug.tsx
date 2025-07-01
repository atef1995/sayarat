/**
 * Debug Form Component for Testing Company Registration
 *
 * This component helps debug the company registration process
 * by showing the current form state and testing individual
 * validation endpoints.
 */

import React, { useState } from "react";
import { Card, Button, Input, Space, Typography, Alert, Spin } from "antd";
import { ExperimentOutlined } from "@ant-design/icons";
import { loadApiConfig } from "../../config/apiConfig";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const { apiUrl } = loadApiConfig();

interface TestResult {
  endpoint: string;
  success: boolean;
  data: unknown;
  error?: string;
}

const CompanyRegistrationDebug: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("Test Company");
  const [email, setEmail] = useState("test@company.com");
  const [username, setUsername] = useState("testuser");

  const testEndpoint = async (
    endpoint: string,
    payload: Record<string, unknown>
  ) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      const result: TestResult = {
        endpoint,
        success: response.ok,
        data,
        error: response.ok
          ? undefined
          : data.error || `HTTP ${response.status}`,
      };

      setTestResults((prev) => [result, ...prev]);
      return result;
    } catch (error) {
      const result: TestResult = {
        endpoint,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      setTestResults((prev) => [result, ...prev]);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const testStep1Validation = async () => {
    await testEndpoint("/auth/validate-company-step", {
      companyName,
      step: 1,
    });
  };

  const testStep2Validation = async () => {
    await testEndpoint("/auth/validate-admin-step", {
      email,
      username,
      step: 2,
    });
  };

  const testFieldValidation = async () => {
    await testEndpoint("/auth/validate-field", {
      fieldName: "email",
      fieldValue: email,
      checkExistence: true,
    });
  };

  const testFullValidation = async () => {
    await testEndpoint("/auth/validate-company-signup", {
      companyName,
      email,
      username,
      companyDescription:
        "This is a detailed test description for our company that meets the minimum 10 character requirement for validation.",
      companyAddress: "123 Test Street, Test Building, Test Area",
      companyCity: "Test City",
      taxId: "123456789",
      firstName: "Test",
      lastName: "User",
      phone: "1234567890",
      password: "TestPass123!",
      confirmPassword: "TestPass123!",
    });
  };

  const testCompanyCreation = async () => {
    await testEndpoint("/auth/company-signup", {
      // Company Information
      companyName,
      companyDescription:
        "This is a comprehensive test description for our company that provides detailed information about our services and meets all validation requirements for the registration process.",
      companyAddress:
        "123 Test Street, Test Building, Test Area, Test District",
      companyCity: "Test City",
      taxId: "123456789",
      website: "https://testcompany.com",

      // Admin Information
      firstName: "Test",
      lastName: "User",
      email,
      username,
      phone: "1234567890",
      password: "TestPass123!",
      confirmPassword: "TestPass123!",

      // Account type
      accountType: "company",
      // Note: subscriptionType is now optional and will default to 'pending'
    });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="mb-6">
          {" "}
          <Title level={2} className="flex items-center gap-2">
            <ExperimentOutlined className="mr-2" />
            Company Registration Debug Tool
          </Title>
          <Paragraph type="secondary">
            Test the step-based validation endpoints for company registration
          </Paragraph>
        </div>

        <Alert
          message="Debug Information"
          description="This tool helps test the company registration validation endpoints. Make sure your backend server is running."
          type="info"
          showIcon
          className="mb-6"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Title level={4}>Test Data</Title>
            <Space direction="vertical" className="w-full">
              <div>
                <Text strong>Company Name:</Text>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Text strong>Email:</Text>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Text strong>Username:</Text>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
            </Space>
          </div>

          <div>
            <Title level={4}>Test Endpoints</Title>
            <Space direction="vertical" className="w-full">
              <Button
                type="primary"
                onClick={testStep1Validation}
                loading={loading}
                block
              >
                Test Step 1 Validation (Company Info)
              </Button>
              <Button
                type="primary"
                onClick={testStep2Validation}
                loading={loading}
                block
              >
                Test Step 2 Validation (Admin Info)
              </Button>
              <Button
                type="default"
                onClick={testFieldValidation}
                loading={loading}
                block
              >
                Test Field Validation
              </Button>
              <Button
                type="dashed"
                onClick={testFullValidation}
                loading={loading}
                block
              >
                Test Full Validation
              </Button>{" "}
              <Button
                type="primary"
                onClick={testCompanyCreation}
                loading={loading}
                block
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Test Complete Company Creation
              </Button>
              <Button
                danger
                onClick={clearResults}
                disabled={testResults.length === 0}
                block
              >
                Clear Results
              </Button>
            </Space>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <Title level={4}>Test Results</Title>
            {loading && <Spin />}
          </div>

          {testResults.length === 0 ? (
            <Alert
              message="No tests run yet"
              description="Click on the test buttons above to start testing the endpoints"
              type="info"
            />
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <Card
                  key={index}
                  size="small"
                  className={`border-l-4 ${
                    result.success ? "border-l-green-500" : "border-l-red-500"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Text strong>{result.endpoint}</Text>
                    <Text
                      className={
                        result.success ? "text-green-600" : "text-red-600"
                      }
                    >
                      {result.success ? "✅ Success" : "❌ Failed"}
                    </Text>
                  </div>

                  {result.error && (
                    <Alert
                      message="Error"
                      description={result.error}
                      type="error"
                      className="mb-2"
                    />
                  )}

                  <div>
                    <Text strong>Response:</Text>
                    <TextArea
                      value={JSON.stringify(result.data, null, 2)}
                      rows={4}
                      readOnly
                      className="mt-1"
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CompanyRegistrationDebug;
