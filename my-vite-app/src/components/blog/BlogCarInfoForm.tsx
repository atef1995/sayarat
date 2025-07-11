import React from "react";
import { Form, Input, InputNumber, Rate } from "antd";

/**
 * Car information form section component
 */
export const BlogCarInfoForm: React.FC = () => {
  return (
    <div className="rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-6 border-b pb-3">
        Car Information (Optional)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Form.Item
          name="car_make"
          label={<span className="text-sm font-medium">Car Make</span>}
          className="mb-0"
        >
          <Input placeholder="e.g., Toyota, BMW, Mercedes" />
        </Form.Item>
        <Form.Item
          name="car_model"
          label={<span className="text-sm font-medium">Car Model</span>}
          className="mb-0"
        >
          <Input placeholder="e.g., Camry, X5, C-Class" />
        </Form.Item>
        <Form.Item
          name="car_year"
          label={<span className="text-sm font-medium">Year</span>}
          className="mb-0"
        >
          <InputNumber
            min={1900}
            max={new Date().getFullYear() + 2}
            placeholder="2023"
            className="w-full"
          />
        </Form.Item>
        <Form.Item
          name="rating"
          label={<span className="text-sm font-medium">Rating</span>}
          className="mb-0"
        >
          <Rate allowHalf />
        </Form.Item>
      </div>
    </div>
  );
};
