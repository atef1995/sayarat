import React, { useState } from "react";
import { Card, Form, Input, Button, Row, Col, message, Space } from "antd";
import {
  SaveOutlined,
  EditOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { Company, CompanyUpdateRequest } from "../../types/company.types";
import { CompanyService } from "../../services/companyService";

const { TextArea } = Input;

interface CompanyProfileFormProps {
  company: Company;
  onUpdate: (company: Company) => void;
}

const CompanyProfileForm: React.FC<CompanyProfileFormProps> = ({
  company,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: CompanyUpdateRequest) => {
    setIsLoading(true);
    try {
      const updatedCompany = await CompanyService.updateCompanyProfile(values);
      onUpdate(updatedCompany);
      setIsEditing(false);
    } catch (error) {
      message.error("فشل في تحديث بيانات الشركة");
      console.error("Error updating company:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.setFieldsValue({
      name: company.name,
      description: company.description || "",
      address: company.address || "",
      city: company.city || "",
      taxId: company.taxId || "",
      website: company.website || "",
    });
    setIsEditing(false);
  };

  React.useEffect(() => {
    form.setFieldsValue({
      name: company.name,
      description: company.description || "",
      address: company.address || "",
      city: company.city || "",
      taxId: company.taxId || "",
      website: company.website || "",
    });
  }, [company, form]);

  return (
    <Card title="معلومات الشركة" className="w-full">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={!isEditing}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="name"
              label="اسم الشركة"
              rules={[
                { required: true, message: "يرجى إدخال اسم الشركة" },
                { min: 2, message: "يجب أن يكون اسم الشركة حرفين على الأقل" },
              ]}
            >
              <Input
                prefix={<IdcardOutlined />}
                placeholder="اسم الشركة"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="website"
              label="الموقع الإلكتروني"
              rules={[{ type: "url", message: "يرجى إدخال رابط صحيح" }]}
            >
              <Input
                prefix={<GlobalOutlined />}
                placeholder="https://example.com"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item name="city" label="المدينة">
              <Input
                prefix={<EnvironmentOutlined />}
                placeholder="المدينة"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="taxId" label="الرقم الضريبي">
              <Input placeholder="الرقم الضريبي" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item name="address" label="العنوان">
              <Input
                prefix={<EnvironmentOutlined />}
                placeholder="العنوان الكامل"
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item name="description" label="وصف الشركة">
              <TextArea
                placeholder="وصف مختصر عن الشركة وأنشطتها"
                rows={4}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col xs={24}>
            <Form.Item>
              {isEditing && (
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={isLoading}
                    size="large"
                  >
                    حفظ التغييرات
                  </Button>
                  <Button onClick={handleCancel} size="large">
                    إلغاء
                  </Button>
                </Space>
              )}
            </Form.Item>
          </Col>
        </Row>
      </Form>
      {!isEditing && (
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="large"
          onClick={() => setIsEditing(true)}
        >
          تعديل المعلومات
        </Button>
      )}
    </Card>
  );
};

export default CompanyProfileForm;
