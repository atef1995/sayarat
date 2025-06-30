import React from "react";
import { Form, Checkbox } from "antd";

interface Product {
  id: string;
  name: string;
  price: number;
  currency: string;
}

interface ProductSelectionFormProps {
  products: Product[];
  onProductChange: (checkedValues: string[]) => void;
}

const ProductSelectionForm: React.FC<ProductSelectionFormProps> = ({
  products,
  onProductChange,
}) => {
  if (products.length === 0) {
    return null;
  }
  return (
    <div className="w-full">
      <Form.Item name="products" label="المنتجات" className="w-full">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-start">
          <Checkbox.Group
            className="w-full"
            options={products.map((product) => ({
              label: (
                <span className="text-sm sm:text-base whitespace-normal break-words">
                  {`${product.name} - ${product.currency} ${product.price}`}
                </span>
              ),
              value: product.name,
            }))}
            onChange={onProductChange}
          />
        </div>
      </Form.Item>
    </div>
  );
};

export default ProductSelectionForm;
