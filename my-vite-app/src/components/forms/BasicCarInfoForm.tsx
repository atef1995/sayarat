import React from "react";
import { Form, Input, Select, InputNumber } from "antd";
import { CarOutlined } from "@ant-design/icons";
import { SelectProps } from "antd";
import carData from "../../cars.json";

const { Option } = Select;

interface BasicCarInfoFormProps {
  carMakes: SelectProps["options"];
  carModels: SelectProps["options"];
  setCurrency: (value: string) => void;
  onMakeChange: () => void;
}

const BasicCarInfoForm: React.FC<BasicCarInfoFormProps> = ({
  carMakes,
  carModels,
  setCurrency,
  onMakeChange,
}) => {
  const years = Array.from(
    { length: new Date().getFullYear() - 1980 + 1 },
    (_, i) => (new Date().getFullYear() - i).toString()
  ).map((year) => ({
    label: year,
    value: year,
  }));

  const selectAfter = (
    <Select
      defaultValue="usd"
      className="select-after"
      onChange={(value) => setCurrency(value)}
    >
      <Option value="usd">دولار</Option>
      <Option value="syp">ليرة سورية</Option>
    </Select>
  );

  return (
    <>
      <Form.Item
        name="title"
        label="عنوان الإعلان"
        rules={[
          {
            required: true,
            message: "الرجاء إدخال عنوان الإعلان",
            max: 50,
          },
        ]}
      >
        <Input showCount maxLength={50} size="large" />
      </Form.Item>{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Form.Item
          name="make"
          label="الشركة المصنعة"
          rules={[{ required: true, message: "الرجاء اختيار الشركة المصنعة" }]}
        >
          <Select
            prefix={<CarOutlined />}
            size="large"
            options={carMakes}
            onChange={onMakeChange}
            showSearch
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          name="model"
          label="الموديل"
          rules={[{ required: true, message: "الرجاء إدخال الموديل" }]}
        >
          <Select
            size="large"
            options={carModels}
            showSearch
            className="w-full"
          />
        </Form.Item>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {" "}
        <Form.Item
          name="year"
          label="سنة الصنع"
          rules={[{ required: true, message: "الرجاء إدخال سنة الصنع" }]}
        >
          <Select size="large" options={years} showSearch className="w-full" />
        </Form.Item>
        <Form.Item
          name="mileage"
          label="عدد الكيلومترات"
          rules={[{ required: true, message: "الرجاء إدخال عدد الكيلومترات" }]}
        >
          <Select
            showSearch
            size="large"
            options={carData.mileageRange.map((km: number) => ({
              label: km.toString(),
              value: km.toString(),
            }))}
            prefix="كم"
            className="w-full"
          />
        </Form.Item>
        <Form.Item
          name="price"
          label="السعر"
          rules={[{ required: true, message: "الرجاء إدخال السعر" }]}
        >
          <InputNumber
            min={0}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            size="large"
            className="w-full"
            addonAfter={selectAfter}
          />
        </Form.Item>
      </div>
    </>
  );
};

export default BasicCarInfoForm;
