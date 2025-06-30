import { Form, Input, Select } from "antd";
import { ShopOutlined, BankOutlined, GlobalOutlined } from "@ant-design/icons";

/**
 * Company Information Step Component
 *
 * RESPONSIBILITIES:
 * - Collect basic company information
 * - Validate company details
 * - Handle address and location data
 *
 * #TODO: Add company logo upload functionality
 * #TODO: Implement company registration number validation by country
 * #TODO: Add real-time company name availability checking
 */
// No props interface needed as this component uses Form.Item which connects to parent form

const CompanyInfoStep: React.FC = () => {
  return (
    <div className="space-y-4">
      <Form.Item
        name="companyName"
        label="اسم الشركة / الوكالة"
        rules={[{ required: true, message: "الرجاء إدخال اسم الشركة" }]}
      >
        <Input
          prefix={<ShopOutlined />}
          size="large"
          placeholder="مثال: وكالة السيارات المتحدة"
        />
      </Form.Item>{" "}
      <Form.Item
        name="companyDescription"
        label="وصف الشركة"
        rules={[
          { required: true, message: "الرجاء إدخال وصف الشركة" },
          {
            min: 10,
            message: "وصف الشركة يجب أن يكون على الأقل 10 أحرف",
          },
          {
            max: 1000,
            message: "وصف الشركة يجب ألا يتجاوز 1000 حرف",
          },
        ]}
        extra="يجب أن يكون الوصف بين 10 و 1000 حرف. اكتب نبذة مفصلة عن نشاط الشركة وخدماتها."
      >
        <Input.TextArea
          rows={4}
          size="large"
          placeholder="مثال: نحن شركة متخصصة في بيع وشراء السيارات المستعملة والجديدة، نقدم خدمات متنوعة تشمل التمويل والصيانة والضمان..."
          showCount
          maxLength={1000}
        />
      </Form.Item>
      <div className="flex gap-4">
        {" "}
        <Form.Item
          name="companyAddress"
          label="عنوان الشركة"
          className="flex-1"
          rules={[
            { required: true, message: "الرجاء إدخال عنوان الشركة" },
            {
              min: 5,
              message: "عنوان الشركة يجب أن يكون على الأقل 5 أحرف",
            },
            {
              max: 200,
              message: "عنوان الشركة يجب ألا يتجاوز 200 حرف",
            },
          ]}
          extra="العنوان التفصيلي يجب أن يكون بين 5 و 200 حرف"
        >
          <Input
            prefix={<BankOutlined />}
            size="large"
            placeholder="مثال: شارع الثورة، مبنى رقم 123، الطابق الثاني"
            maxLength={200}
            showCount
          />
        </Form.Item>
        <Form.Item
          name="companyCity"
          label="المدينة"
          className="flex-1"
          rules={[{ required: true, message: "الرجاء اختيار المدينة" }]}
        >
          <Select size="large" placeholder="اختر المدينة">
            <Select.Option value="دمشق">دمشق</Select.Option>
            <Select.Option value="حلب">حلب</Select.Option>
            <Select.Option value="حمص">حمص</Select.Option>
            <Select.Option value="حماة">حماة</Select.Option>
            <Select.Option value="اللاذقية">اللاذقية</Select.Option>
            <Select.Option value="طرطوس">طرطوس</Select.Option>
            <Select.Option value="درعا">درعا</Select.Option>
            <Select.Option value="السويداء">السويداء</Select.Option>
            <Select.Option value="القنيطرة">القنيطرة</Select.Option>
            <Select.Option value="الحسكة">الحسكة</Select.Option>
            <Select.Option value="الرقة">الرقة</Select.Option>
            <Select.Option value="دير الزور">دير الزور</Select.Option>
            <Select.Option value="إدلب">إدلب</Select.Option>
            <Select.Option value="ريف دمشق">ريف دمشق</Select.Option>
          </Select>
        </Form.Item>
      </div>
      <Form.Item
        name="taxId"
        label="الرقم الضريبي"
        rules={[
          { required: true, message: "الرجاء إدخال الرقم الضريبي" },
          {
            min: 6,
            message: "الرقم الضريبي يجب أن يكون 6 أرقام على الأقل",
          },
        ]}
      >
        <Input
          prefix={<BankOutlined />}
          size="large"
          placeholder="الرقم الضريبي للشركة"
        />
      </Form.Item>
      <Form.Item name="website" label="الموقع الإلكتروني (اختياري)">
        <Input
          prefix={<GlobalOutlined />}
          size="large"
          placeholder="https://example.com"
        />
      </Form.Item>
    </div>
  );
};

export default CompanyInfoStep;
