import React from "react";
import { Form, Select, Radio, InputNumber } from "antd";
import carData from "../../cars.json";

const TechnicalSpecsForm: React.FC = () => {
  return (
    <>
      {" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Form.Item name="specs" label="مزايا الراحة">
          <Select
            size="large"
            mode="multiple"
            maxTagCount="responsive"
            className="w-full"
            options={carData.comfort_options.map((options) => {
              const category = options.category;
              const features = options.features;

              return {
                label: <span>{category}</span>,
                title: category,
                options: features.map((feature) => {
                  return {
                    label: <span>{feature}</span>,
                    value: feature,
                  };
                }),
                value: category,
              };
            })}
          />
        </Form.Item>
        <Form.Item
          name="car_type"
          label="نوع السيارة"
          rules={[{ required: true, message: "الرجاء اختيار نوع السيارة" }]}
        >
          <Select
            size="large"
            className="w-full"
            options={carData.carType.map((car) => {
              const carType = Object.keys(car)[0];
              return {
                label: carType,
                value: carType,
              };
            })}
            showSearch
          />
        </Form.Item>{" "}
        <Form.Item
          name="location"
          label="المحافظة"
          rules={[
            {
              required: true,
              message: "الرجاء اختيار مكان تواجد السيارة",
            },
          ]}
        >
          <Select
            size="large"
            className="w-full"
            options={carData.cities.map((city) => {
              return {
                label: city,
                value: city,
              };
            })}
          />
        </Form.Item>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Form.Item
          name="color"
          label="اللون"
          rules={[{ required: true, message: "الرجاء اختيار اللون" }]}
        >
          <Select
            size="large"
            className="w-full"
            options={carData.colors.map((color) => {
              return { label: color, value: color };
            })}
            showSearch
          />
        </Form.Item>

        <Form.Item
          name="transmission"
          label="ناقل الحركة"
          rules={[{ required: true, message: "الرجاء اختيار نوع ناقل الحركة" }]}
          className="sm:col-span-2 lg:col-span-1"
        >
          <Radio.Group size="large" className="flex flex-wrap gap-2">
            {carData.gearbox.map((gear) => {
              const gearType = Object.keys(gear)[0];
              return (
                <Radio.Button
                  key={gearType}
                  value={gearType}
                  className="flex-1 min-w-0 text-center"
                >
                  {gearType}
                </Radio.Button>
              );
            })}
          </Radio.Group>
        </Form.Item>

        <Form.Item name="hp" label="عدد الاحصنة">
          <InputNumber min={1} max={2000} size="large" className="w-full" />
        </Form.Item>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Form.Item
          name="fuel"
          label="الوقود"
          rules={[
            {
              required: true,
              message: "الرجاء اختيار نوع الوقود",
            },
          ]}
        >
          <Select
            showSearch
            size="large"
            className="w-full"
            options={carData.fuelType.map((fuel) => {
              const fuelKeys = Object.keys(fuel)[0];
              return {
                label: fuelKeys,
                value: fuelKeys,
              };
            })}
          />
        </Form.Item>

        <Form.Item name="engine_cylinders" label="عدد الاسطوانات">
          <Select
            showSearch
            size="large"
            placeholder="عدد الاسطوانات"
            className="w-full"
            options={carData.engine_cylinders.map((cylinder) => {
              return { label: cylinder, value: cylinder };
            })}
          />
        </Form.Item>

        <Form.Item name="engine_liters" label="السعة">
          <Select
            showSearch
            size="large"
            placeholder="السعة"
            className="w-full"
            options={carData.engine_liters.map((liter) => {
              return { label: liter, value: liter };
            })}
            suffixIcon={<span>لتر</span>}
          />
        </Form.Item>
      </div>
    </>
  );
};

export default TechnicalSpecsForm;
