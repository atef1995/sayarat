import React from "react";
import { Button, Space, Typography } from "antd";
import { usePayment } from "../hooks/usePayment";

const { Text } = Typography;

const PaymentDebugComponent: React.FC = () => {
  const paymentState = usePayment();

  const {
    clientSecret,
    showPayment,
    products,
    items,
    handlePayment,
    onProductChange,
    hasSelectedProducts,
  } = paymentState;

  const testPaymentFlow = async () => {
    // First select a product if available
    if (products.length > 0 && items.length === 0) {
      onProductChange([products[0].name]);
    }

    // Then trigger payment
    const result = await handlePayment();
    console.log("Payment flow result:", result);
  };
  return (
    <div className="p-5 border border-gray-300 m-5">
      <h3>Payment Debug Panel</h3>
      <Space direction="vertical">
        <Text>Products loaded: {products.length}</Text>
        <Text>Items selected: {items.length}</Text>
        <Text>Has selected products: {hasSelectedProducts.toString()}</Text>
        <Text>Client secret exists: {clientSecret ? "Yes" : "No"}</Text>
        <Text>Show payment: {showPayment.toString()}</Text>

        {products.length > 0 && (
          <Button onClick={() => onProductChange([products[0].name])}>
            Select First Product
          </Button>
        )}

        <Button onClick={testPaymentFlow} type="primary">
          Test Payment Flow
        </Button>

        <Button onClick={() => console.log("Payment State:", paymentState)}>
          Log Payment State
        </Button>
      </Space>
    </div>
  );
};

export default PaymentDebugComponent;
