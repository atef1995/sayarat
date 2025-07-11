import React from "react";
import { useCheckout } from "@stripe/react-stripe-js";

interface StripeError {
  message: string;
  code?: string | null;
  [key: string]: unknown;
}

const PayButton = () => {
  const { confirm } = useCheckout();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<StripeError | null>(null);

  const handleClick = () => {
    setLoading(true);
    confirm().then((result) => {
      if (result.type === "error") {
        setError(result.error as StripeError);
      }
      setLoading(false);
    });
  };

  return (
    <div>
      <button disabled={loading} onClick={handleClick}>
        Pay
      </button>
      {error && <div>{error.message}</div>}
    </div>
  );
};

export default PayButton;
