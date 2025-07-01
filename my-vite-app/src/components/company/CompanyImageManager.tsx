import React, { useState } from "react";
import {
  Card,
  Upload,
  Button,
  Row,
  Col,
  message,
  Image,
  Typography,
  Space,
  Modal,
} from "antd";
import { PlusOutlined, EyeOutlined, CameraOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { Company } from "../../types/company.types";
import { CompanyService } from "../../services/companyService";
import { loadApiConfig } from "../../config/apiConfig";

const { Title, Text } = Typography;

interface CompanyImageManagerProps {
  company: Company;
  onImageUpdate: (imageType: "logo" | "header", imageUrl: string) => void;
}

/**
 * Mobile-friendly Company Image Manager component
 *
 * Features:
 * - Upload and manage company logo and header images
 * - Mobile-responsive design with touch-friendly controls
 * - Image preview functionality
 * - Comprehensive error handling and user feedback
 * - File validation (type, size)
 * - Arabic localization
 *
 * #TODO: Add image cropping functionality
 * #TODO: Add drag and drop upload
 * #TODO: Add image compression before upload
 * #TODO: Add undo/redo functionality for image changes
 */
const CompanyImageManager: React.FC<CompanyImageManagerProps> = ({
  company,
  onImageUpdate,
}) => {
  const [logoUploading, setLogoUploading] = useState(false);
  const [headerUploading, setHeaderUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  // Debug function to test API connectivity
  const testAPIConnection = async () => {
    try {
      const { apiUrl } = loadApiConfig();

      const response = await fetch(`${apiUrl}/company/profile`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API test successful:", data);
      } else {
        console.error("API test failed:", response.statusText);
      }
    } catch (error) {
      console.error("API test error:", error);
    }
  };

  // Test API connection on component mount (only in development)
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      testAPIConnection();
    }
  }, []);
  const beforeUpload = (file: File) => {
    console.log("Validating file:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("يمكن رفع صور JPG/PNG فقط!");
      console.error("Invalid file type:", file.type);
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("يجب أن يكون حجم الصورة أقل من 5MB!");
      console.error("File too large:", file.size / 1024 / 1024, "MB");
      return false;
    }

    console.log("File validation passed - allowing upload");
    return true; // Allow upload to proceed to customRequest
  };

  const handleImageUpload = async (file: File, type: "logo" | "header") => {
    try {
      const setUploading =
        type === "logo" ? setLogoUploading : setHeaderUploading;
      setUploading(true);

      console.log("Starting image upload:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        type,
      });

      // Show upload started message
      message.loading({
        content: `جاري رفع ${type === "logo" ? "الشعار" : "صورة الرأس"}...`,
        key: `upload-${type}`,
      });

      const imageUrl = await CompanyService.uploadCompanyImage({ file, type });

      console.log("Upload successful:", { imageUrl, type });

      // Show success message
      message.success({
        content: `تم رفع ${type === "logo" ? "الشعار" : "صورة الرأس"} بنجاح!`,
        key: `upload-${type}`,
        duration: 3,
      });

      // Update parent component
      onImageUpdate(type, imageUrl);
    } catch (error) {
      console.error("Error uploading image:", {
        error: error instanceof Error ? error.message : error,
        type,
        fileName: file.name,
      });

      // Show error message
      message.error({
        content: `فشل في رفع ${type === "logo" ? "الشعار" : "صورة الرأس"}: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
        key: `upload-${type}`,
        duration: 5,
      });
    } finally {
      const setUploading =
        type === "logo" ? setLogoUploading : setHeaderUploading;
      setUploading(false);
    }
  };

  const handlePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl);
    setPreviewTitle(title);
    setPreviewOpen(true);
  };
  const logoUploadProps: UploadProps = {
    name: "image", // Match the backend expectation
    showUploadList: false,
    beforeUpload,
    customRequest: ({ file, onSuccess, onError }) => {
      console.log("Logo customRequest called:", { file });

      // Handle upload asynchronously
      (async () => {
        try {
          await handleImageUpload(file as File, "logo");
          console.log("Logo upload completed successfully");
          onSuccess?.("ok");
        } catch (error) {
          console.error("Logo upload failed in customRequest:", error);
          onError?.(error as Error);
        }
      })();
    },
    accept: "image/*",
    multiple: false,
  };

  const headerUploadProps: UploadProps = {
    name: "image", // Match the backend expectation
    showUploadList: false,
    beforeUpload,
    customRequest: ({ file, onSuccess, onError }) => {
      console.log("Header customRequest called:", { file });

      // Handle upload asynchronously
      (async () => {
        try {
          await handleImageUpload(file as File, "header");
          console.log("Header upload completed successfully");
          onSuccess?.("ok");
        } catch (error) {
          console.error("Header upload failed in customRequest:", error);
          onError?.(error as Error);
        }
      })();
    },
    accept: "image/*",
    multiple: false,
  };
  return (
    <div className="space-y-6">
      {/* Development debugging panel */}
      {import.meta.env.DEV && (
        <Card title="🔧 Debug Panel (Development Only)" size="small">
          <Space direction="vertical" className="w-full">
            <Button onClick={testAPIConnection} size="small" type="dashed">
              Test API Connection
            </Button>
            <div className="text-xs text-gray-500">
              Check browser console for detailed logs
            </div>
          </Space>
        </Card>
      )}

      {/* Logo Section */}
      <Card title="شعار الشركة" className="w-full">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={12}>
            <div className="text-center">
              {company.logo ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <Image
                      src={company.logo}
                      alt="Company Logo"
                      width={150}
                      height={150}
                      className="rounded-lg object-cover border border-gray-200"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-150 h-150 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <CameraOutlined className="text-4xl text-gray-400 mb-2" />
                    <Text className="text-gray-500">لا يوجد شعار</Text>
                  </div>
                </div>
              )}
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div className="space-y-4">
              <div>
                <Title level={5}>تحديث الشعار</Title>
                <Text type="secondary">
                  يُنصح بأن يكون الشعار مربع الشكل (1:1) وبدقة عالية
                </Text>
              </div>

              <Upload {...logoUploadProps}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  loading={logoUploading}
                  size="large"
                  block
                >
                  {logoUploading ? "جاري الرفع..." : "رفع شعار جديد"}
                </Button>
              </Upload>

              <div className="text-xs text-gray-500">
                <p>• الحد الأقصى: 5MB</p>
                <p>• الصيغ المدعومة: JPG, PNG</p>
                <p>• الحجم المُوصى به: 300x300 بكسل</p>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Header Image Section */}
      <Card title="صورة رأس الشركة" className="w-full">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24}>
            <div className="text-center space-y-4">
              {company.headerImage ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Image
                      src={company.headerImage}
                      alt="Company Header"
                      width="100%"
                      height={200}
                      className="rounded-lg object-cover border border-gray-200"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <Space>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() =>
                        handlePreview(company.headerImage!, "صورة رأس الشركة")
                      }
                    >
                      معاينة
                    </Button>
                  </Space>
                </div>
              ) : (
                <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <CameraOutlined className="text-4xl text-gray-400 mb-2" />
                    <Text className="text-gray-500">لا توجد صورة رأس</Text>
                  </div>
                </div>
              )}
            </div>
          </Col>

          <Col xs={24}>
            <div className="space-y-4">
              <div className="text-center">
                <Title level={5}>تحديث صورة الرأس</Title>
                <Text type="secondary">
                  ستظهر هذه الصورة في أعلى صفحة الشركة كخلفية جذابة
                </Text>
              </div>

              <Row justify="center">
                <Col xs={24} sm={16} md={12}>
                  <Upload {...headerUploadProps}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      loading={headerUploading}
                      size="large"
                      block
                    >
                      {headerUploading ? "جاري الرفع..." : "رفع صورة رأس جديدة"}
                    </Button>
                  </Upload>
                </Col>
              </Row>

              <div className="text-xs text-gray-500 text-center">
                <p>• الحد الأقصى: 5MB</p>
                <p>• الصيغ المدعومة: JPG, PNG</p>
                <p>• الحجم المُوصى به: 1200x400 بكسل (3:1)</p>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width="80%"
        centered
      >
        {" "}
        <img alt="preview" className="w-full" src={previewImage} />
      </Modal>
    </div>
  );
};

export default CompanyImageManager;
