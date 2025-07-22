import { Suspense } from "react";
import { Spin } from "antd";
import { CreateListing as CreateListingType } from "../types";
import CreateListingContainer from "./CreateListingContainer";
import CheckoutForm from "./CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { usePayment } from "../hooks/usePayment";
import { loadApiConfig } from "../config/apiConfig";

// Make all props optional for routing compatibility
interface CreateListingProps {
  initialValues?: CreateListingType;
}
const { stripePublicKey } = loadApiConfig();
const stripePromise = loadStripe(stripePublicKey || "VITE_STRIPE_PUBLIC_KEY");

const CreateListing: React.FC<CreateListingProps> = ({ initialValues }) => {
  console.log("Initial values in CreateListing:", initialValues);

  const paymentState = usePayment();
  const {
    clientSecret,
    showPayment,
    handlePaymentSuccess,
    handlePaymentCancel,
  } = paymentState;

  console.log("Payment state in CreateListing:", {
    clientSecret: !!clientSecret,
    showPayment,
    hasProducts: paymentState.products.length > 0,
    hasItems: paymentState.items.length > 0,
  });

  return (
    <Suspense
      fallback={<Spin size="large" className="flex justify-center mt-10" />}
    >
      {showPayment && clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{
            appearance: { theme: "night" },
            loader: "auto",
            clientSecret,
          }}
        >
          <CheckoutForm
            onSuccess={handlePaymentSuccess}
            cancel={handlePaymentCancel}
          />
        </Elements>
      ) : (
        <CreateListingContainer
          initialValues={initialValues}
          paymentState={paymentState}
        />
      )}
    </Suspense>
  );
};

export default CreateListing;
