import DbCache from "../classes/DbCache";
import {
  AllCars,
  CarCardProps,
  CarInfo,
  ListingDetailResponse,
  ListingInfo,
} from "../types";
import { ApiResponse } from "../types/api.types";
import { ListingTransformer, ListingError } from "../utils/listingTransform";
import { loadApiConfig } from "../config/apiConfig";

const { apiUrl: API_URL, stripePublicKey, stripeSecretKey } = loadApiConfig();

console.log("API URL:", API_URL);
console.log("Stripe Public Key:", stripePublicKey);
console.log("Stripe Secret Key:", stripeSecretKey);

const makesCache = new DbCache<string[]>();

export const fetchCarMakes = async () => {
  console.log(API_URL);

  const cachedMakes = makesCache.get("car-makes");
  if (cachedMakes) {
    console.log("Using cached car makes");
    console.log("Cached makes:", cachedMakes.length);

    return cachedMakes.map((car: string) => ({
      label: car,
      value: car,
    }));
  }

  const res = await fetch(`${API_URL}/makes`, {
    headers: {
      "Content-type": "application/json",
      accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error("Error fetching car makes:", await res.text());
    throw new Error("Failed to fetch car makes");
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    console.error("Unexpected data format for car makes:", data);
    throw new Error("Invalid response format for car makes");
  }
  makesCache.set("car-makes", data);

  const carBrands = data.map((car: string) => {
    return {
      label: car,
      value: car,
    };
  });

  return carBrands;
};

// Type for grouped models for Ant Design Select
export interface GroupedModelOptions {
  label: string; // make name
  options: { label: string; value: string }[];
}

/**
 * Fetch car models grouped by make for Ant Design Select with OptGroup
 * Backend should return an object: { [make: string]: string[] }
 * This function transforms it to grouped options for Select
 */
export const fetchCarModels = async (
  makes: string[]
): Promise<Array<string>> => {
  if (!makes || makes.length === 0) {
    console.error("No car makes provided for fetching models");
    throw new Error("No car makes provided");
  }

  let formattedMakes;
  if (!Array.isArray(makes)) {
    formattedMakes = makes;
  } else {
    formattedMakes = makes.join(",");
  }

  const res = await fetch(`${API_URL}/models?makes=${formattedMakes}`, {
    headers: {
      "Content-type": "application/json",
      accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error("Error fetching car models:", await res.text());
    throw new Error("Failed to fetch car models");
  }

  // Backend should return: array of strings
  // Example: ["Model1", "Model2", ...]
  const data: Array<string> = await res.json();
  console.log("Fetched grouped car models:", data);

  return data;
};

export const fetchListings = async (endpoint: string = "/listings") => {
  console.log("Fetching listings from endpoint:", API_URL + endpoint);

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-type": "application/json",
      accept: "application/json",
    },
    credentials: "include", // Include credentials for user-specific data
  });

  const data: AllCars = await response.json();
  console.log("Fetched listings data:", data.total);

  if (!response.ok) {
    console.error("Error fetching listings:", await response.text());
    throw new Error("Failed to fetch listings");
  }

  console.log("listings", data);

  return data;
};

export const fetchListingsByUsername = async (username: string) => {
  if (!username || username.trim().length === 0) {
    console.error("Invalid username provided for fetching listings");
    throw new Error("Invalid username");
  }

  const res = await fetch(`${API_URL}/listings/username/${username}`, {
    headers: {
      "Content-type": "application/json",
      accept: "application/json",
    },
    credentials: "include", // Include credentials for user-specific data
  });
  if (!res.ok) {
    console.error("Error fetching listings by username:", await res.text());
    throw new Error("Failed to fetch listings by username");
  }
  const data = await res.json();
  console.log("Fetched listings by username:", data);
  if (!data || !Array.isArray(data)) {
    console.error("Unexpected data format for listings by username:", data);
    throw new Error("Invalid response format for listings by username");
  }
  return data;
};

export const fetchImagesById = async (id: number) => {
  const res = await fetch(`${API_URL}/images?${id}`, {
    headers: {
      "Content-type": "application/json",
      accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error("error fetching images");
    throw await res.text();
  }

  const data = await res.json();

  console.log("images", data);

  if (!Array.isArray(data)) {
    console.error("Unexpected data format for images:", data);
    throw new Error("Invalid response format for images");
  }

  return data;
};

export const fetchListingsByUserId = async () => {
  const res = await fetch(`${API_URL}/listings/user-listings`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      accept: "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    console.error("error fetching listings");
    throw await res.text();
  }

  const data: CarCardProps[] = await res.json();

  return data;
};

export const fetchSomeCarDetailsById = async (id: CarInfo["id"]) => {
  const res = await fetch(`${API_URL}/listings/some-listing/${id}`, {
    headers: {
      "Content-type": "application/json",
      accept: "application/json",
    },
  });

  if (!res.ok) {
    console.error("error fetching listings");
    throw await res.text();
  }

  const data: CarInfo[] = await res.json();
  console.log("some car details by id", data);

  return data;
};

/**
 * Fetch a single listing by ID with proper error handling
 * Returns separated car and seller information
 * @param id - Listing ID
 * @returns Promise<ListingInfo> - Separated car and seller data
 */
export const fetchListingById = async (
  id: CarInfo["id"]
): Promise<ListingInfo> => {
  try {
    const res = await fetch(`${API_URL}/listings/get-listing/${id}`, {
      headers: {
        "Content-type": "application/json",
        accept: "application/json",
      },
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw ListingError.notFound(id);
      }

      const errorText = await res.text();
      throw ListingError.fetchFailed(id, errorText);
    }

    const apiResponse: ListingDetailResponse = await res.json();
    console.log("Raw API response for listing:", apiResponse);

    // Transform API response to separated car and seller data
    const listingInfo = ListingTransformer.transformApiResponse(apiResponse);
    console.log("Transformed listing info:", listingInfo);

    return listingInfo;
  } catch (error) {
    console.error("Error fetching listing by ID:", error);

    if (error instanceof ListingError) {
      throw error;
    }

    throw ListingError.fetchFailed(
      id,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
};

/**
 * Fetch listing by ID with backward compatibility
 * Returns CarInfo with seller data for components that haven't been updated yet
 * @deprecated Use fetchListingById instead for better separation of concerns
 */
export const fetchListingByIdLegacy = async (id: CarInfo["id"]) => {
  const listingInfo = await fetchListingById(id);
  return ListingTransformer.createBackwardCompatibleCarInfo(listingInfo);
};

export const deleteListingById = async (id: CarInfo["id"], reason: string) => {
  const res = await fetch(`${API_URL}/listings/delete-listing/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    console.error("error fetching listings");
    throw await res.text();
  }

  const data: ApiResponse = await res.json();
  console.log("delete listing by id", data);

  return data;
};
