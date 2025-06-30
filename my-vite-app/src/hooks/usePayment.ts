import { useState, useEffect } from "react";
import { message } from "antd";
import fetchProducts from "../api/fetchProducts";
import { fetchClientSecret } from "../api/fetchClientSecret";
import { Product, PaymentItem } from "../types/payment";

export const usePayment = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<PaymentItem[]>([]);

  // Fetch products on mount
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const productsData = await fetchProducts();
        if (!Array.isArray(productsData)) {
          console.error("Invalid data format for products:", productsData);
          message.error("فشل في تحميل المنتجات");
          return;
        }

        setProducts(
          productsData.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.default_price.unit_amount / 100, // Convert to dollars
            currency: product.default_price.currency,
          }))
        );
      } catch (error) {
        console.error("Error fetching products:", error);
        message.error("فشل في تحميل المنتجات");
      }
    };

    fetchProductsData();
  }, []);
  const handlePayment = async (): Promise<string | null> => {
    try {
      console.log("handlePayment called with items:", items);
      const data = await fetchClientSecret(items);
      if (!data) {
        throw new Error("Failed to fetch client secret");
      }

      console.log("Setting clientSecret and showPayment to true");
      setClientSecret(data);
      setShowPayment(true);
      return data;
    } catch (error) {
      console.error("Payment error:", error);
      message.error("حدث خطأ أثناء الدفع");
      setShowPayment(false);
      return null;
    }
  };
  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setClientSecret(null);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setClientSecret(null);
    setItems([]);
    message.info("تم إلغاء الدفع");
  };

  const onProductChange = (checkedValues: string[]) => {
    const selectedProducts = products.filter((product) =>
      checkedValues.includes(product.name)
    );

    const newItems = selectedProducts.map((product) => ({
      productId: product.id,
      quantity: 1,
      priceId: product.id,
      productName: product.name,
      highlight: product.name === "تمييز الإعلان",
    }));

    console.log("Selected products:", newItems.length);

    setItems(newItems);
  };

  const hasSelectedProducts = items.length > 0;

  return {
    clientSecret,
    showPayment,
    products,
    items,
    handlePayment,
    handlePaymentSuccess,
    handlePaymentCancel,
    onProductChange,
    hasSelectedProducts,
  };
};
