import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

interface ProductData {
  active: boolean;
  attributes: Array<string>;
  created: number;
  description: string;
  id: string;
  images: Array<string>;
  livemode: boolean;
  metadata: Record<string, string>;
  name: string;
  object: string;
  updated: number;
  default_price: {
    currency: string;
    type: string;
    unit_amount: number;
  };
}

const fetchProducts = async () => {
  const res = await fetch(`${apiUrl}/payment/products`, {
    headers: {
      "Content-type": "application/json",
      accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error("Error fetching products");
    throw await res.text();
  }

  const { data } = await res.json();
  console.log("Fetched products:", data);

  return data as ProductData[];
};

export default fetchProducts;
