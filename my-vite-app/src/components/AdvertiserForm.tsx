import { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Select,
  message,
  Upload,
  DatePicker,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { RangePickerProps } from "antd/es/date-picker";
import AdBanner from "./AdBanner";
import CropModal from "./CropModal";
import { loadApiConfig } from "../config/apiConfig";

const { RangePicker } = DatePicker;
const { apiUrl } = loadApiConfig();

interface AdvertiserFormValues {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website?: string;
  business_type: string;
  address: string;
  ad_title: string;
  ad_description: string;
  placement: string;
  target_url: string;
  budget: number;
  date_range: [Date, Date];
}

const AdvertiserForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [adImage, setAdImage] = useState<UploadFile[]>([]);
  const [cropperVisible, setCropperVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // form values
  const targetUrl = Form.useWatch("target_url", form);
  console.log("Target URL:", targetUrl);

  const businessTypes = [
    "تجارة",
    "خدمات",
    "تقنية",
    "تعليمية",
    "صحية",
    "سياحية",
    "مالية",
  ];

  // Handle image selection
  const onImageChange = (fileList: UploadFile[]) => {
    const file = fileList[0]?.originFileObj;
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setCropperVisible(true);
    }
  };

  // Handle crop confirm
  const handleCrop = (croppedBlob: Blob, croppedUrl: string) => {
    if (selectedFile) {
      const croppedFile = new File([croppedBlob], selectedFile.name, {
        type: selectedFile.type,
      }) as RcFile;
      setAdImage([
        {
          uid: Date.now().toString(),
          name: croppedFile.name,
          status: "done",
          url: croppedUrl,
          thumbUrl: croppedUrl,
          originFileObj: croppedFile,
        },
      ]);
      setCropperVisible(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const onFinish = async (values: AdvertiserFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Add advertiser info
      Object.entries(values).forEach(([key, value]) => {
        if (key !== "date_range" && value) {
          formData.append(key, value.toString());
        }
      });

      // Add dates
      formData.append("start_date", values.date_range[0].toISOString());
      formData.append("end_date", values.date_range[1].toISOString());

      // Add image if exists
      if (adImage[0]?.originFileObj) {
        formData.append("ad_image", adImage[0].originFileObj);
      }

      const response = await fetch(`${apiUrl}/advertisers`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to submit");
      }

      message.success("تم تقديم طلب الإعلان بنجاح!");
      form.resetFields();
      setAdImage([]);
    } catch (error) {
      console.error("Error:", error);
      message.error("حدث خطأ أثناء تقديم الطلب");
    } finally {
      setLoading(false);
    }
  };

  const disabledDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current.valueOf() < Date.now();
  };

  return (
    <>
      <AdBanner
        altText="إعلانك هنا"
        adImage={
          adImage[0]?.thumbUrl ??
          "https://th.bing.com/th/id/OIP._7bU1JRuo_-B9-Sc_2YMUQHaEQ?r=0&rs=1&pid=ImgDetMain"
        }
        adUrl={targetUrl || "#"}
      />

      <CropModal
        open={cropperVisible}
        imageUrl={previewUrl || ""}
        onCancel={() => setCropperVisible(false)}
        onCrop={handleCrop}
        aspect={5 / 1}
      />

      <p className="text-center text-gray-500 mt-4">
        يمكنك تقديم طلب إعلان هنا. يرجى ملء النموذج أدناه وسنقوم بالتواصل معك
        قريبًا.
      </p>
      <Card className="max-w-3xl mx-auto my-8">
        <h1 className="text-2xl font-bold text-center mb-6">طلب إعلان</h1>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="company_name"
              label="اسم الشركة"
              rules={[{ required: true, message: "الرجاء إدخال اسم الشركة" }]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              name="contact_name"
              label="اسم المسؤول"
              rules={[{ required: true, message: "الرجاء إدخال اسم المسؤول" }]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              name="email"
              label="البريد الإلكتروني"
              rules={[
                { required: true, message: "الرجاء إدخال البريد الإلكتروني" },
                { type: "email", message: "البريد الإلكتروني غير صالح" },
              ]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="رقم الهاتف"
              rules={[
                { required: true, message: "الرجاء إدخال رقم الهاتف" },
                {
                  pattern: /^\+?[0-9\s-]+$/,
                  message: "رقم الهاتف غير صالح",
                },
              ]}
            >
              <Input size="large" placeholder="مثال: +966123456789" />
            </Form.Item>
            <Form.Item
              name="business_type"
              label="نوع النشاط التجاري"
              rules={[{ required: true, message: "الرجاء اختيار نوع النشاط" }]}
            >
              <Select size="large" placeholder="اختر نوع النشاط">
                {businessTypes.map((type) => (
                  <Select.Option key={type} value={type}>
                    {type}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="ad_image"
            label="صورة الإعلان"
            rules={[{ required: true, message: "الرجاء اختيار صورة الإعلان" }]}
          >
            <Upload
              listType="picture-card"
              fileList={adImage}
              beforeUpload={() => false}
              onChange={({ fileList }) => onImageChange(fileList)}
              onRemove={() => {
                setAdImage([]);
                return true;
              }}
              accept="image/*"
              showUploadList={{ showRemoveIcon: true }}
              maxCount={1}
            >
              {adImage.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div className="mt-2">رفع صورة</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item
            name="target_url"
            label="رابط الإعلان"
            rules={[
              { required: true, message: "الرجاء إدخال رابط الإعلان" },
              { type: "url", message: "الرابط غير صالح" },
            ]}
          >
            <Input size="large" placeholder="https://example.com" />
          </Form.Item>

          <Form.Item
            name="placement"
            label="موقع الإعلان"
            rules={[{ required: true, message: "الرجاء اختيار موقع الإعلان" }]}
          >
            <Select size="large">
              <Select.Option value="HOME">الصفحة الرئيسية</Select.Option>
              {/* <Select.Option value="SEARCH">صفحة البحث</Select.Option>
              <Select.Option value="LISTING_PAGE">صفحة الإعلان</Select.Option> */}
              <Select.Option value="SIDEBAR">الشريط الجانبي</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="date_range"
            label="فترة الإعلان"
            rules={[{ required: true, message: "الرجاء اختيار فترة الإعلان" }]}
          >
            <RangePicker
              size="large"
              className="w-full"
              disabledDate={disabledDate}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              تقديم طلب الإعلان
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
};

export default AdvertiserForm;
