import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button, message } from "antd";
import { CloseOutlined, CreditCardTwoTone } from "@ant-design/icons";
import { useAuth } from "../hooks/useAuth";

interface CheckoutFormProps {
  onSuccess: () => Promise<void>;
  cancel: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onSuccess, cancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  console.log("CheckoutForm user:", user);

  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      message.error("Stripe is not loaded yet");
      return;
    }

    setProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/payment",
          payment_method_data: {
            billing_details: {
              name: (user && user?.firstName + user?.lastName) || "Anonymous",
              email: user?.email || "",
            },
          },
        },
      });

      if (error) {
        console.error("Payment error:", error);
        message.error("حدث خطأ أثناء الدفع: " + error.message);
        throw error;
      }

      message.success("تم الدفع بنجاح");
      await onSuccess();
    } catch (error) {
      console.error("Payment error:", error);
      message.error("حدث خطأ أثناء الدفع");
    } finally {
      setProcessing(false);
    }
  };

  // const paymentIntentOptions = {
  //   layout: "accordion",
  // };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <Button onClick={cancel}>
        <CloseOutlined />
      </Button>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <PaymentElement
            id="payment-element"
            options={{
              layout: "accordion",
            }}
          />
          <Button
            onClick={handleSubmit}
            htmlType="submit"
            disabled={processing || !stripe || !elements}
          >
            دفع
            <CreditCardTwoTone />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CheckoutForm;
