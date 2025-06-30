import { CarInfo, Seller, ListingInfo, ListingDetailResponse } from "../types";

/**
 * Transforms API response into separated car and seller data
 * Following Single Responsibility Principle and Separation of Concerns
 */
export class ListingTransformer {
  /**
   * Transform API response to separated car and seller information
   * @param apiResponse - Raw API response
   * @returns Separated car and seller data
   */
  static transformApiResponse(apiResponse: ListingDetailResponse): ListingInfo {
    // Extract car-specific data
    const car: CarInfo = {
      id: apiResponse.id,
      title: apiResponse.title,
      price: apiResponse.price,
      make: apiResponse.make,
      model: apiResponse.model,
      year: apiResponse.year,
      mileage: apiResponse.mileage,
      location: apiResponse.location,
      listing_status: apiResponse.listing_status,
      created_at: apiResponse.created_at,
      car_type: apiResponse.car_type,
      color: apiResponse.color,
      description: apiResponse.description,
      transmission: apiResponse.transmission,
      fuel: apiResponse.fuel,
      currency: apiResponse.currency,
      status: apiResponse.status,
      seller_id: apiResponse.seller_id,
      image_urls: apiResponse.image_urls,
      favorites_count: apiResponse.favorites_count,
      is_favorited: apiResponse.is_favorited,
      hp: apiResponse.hp,
      specs: apiResponse.specs,
      engine_cylinders: apiResponse.engine_cylinders,
      engine_liters: apiResponse.engine_liters,
      views: apiResponse.views,
      products: apiResponse.products,
      highlight: apiResponse.highlight,
      _placement: apiResponse._placement,
    };

    // Extract seller-specific data
    const seller: Seller = {
      id: apiResponse.seller_id,
      auth_id: "", // #TODO: Add auth_id to API response
      name: apiResponse.first_name,
      first_name: apiResponse.first_name,
      username: apiResponse.username,
      phone: apiResponse.phone,
      phone_num: apiResponse.phone,
      location: apiResponse.location, // #TODO: Consider separate seller location
      picture: undefined, // #TODO: Add seller picture to API response
      is_company: apiResponse.is_company,
    };

    return {
      id: apiResponse.id,
      car,
      seller,
    };
  }

  /**
   * Create backward-compatible car info with seller data
   * @param listingInfo - Separated listing info
   * @returns Car info with seller data for backward compatibility
   */
  static createBackwardCompatibleCarInfo(
    listingInfo: ListingInfo
  ): CarInfo & { first_name: string; username: string } {
    return {
      ...listingInfo.car,
      first_name: listingInfo.seller.first_name,
      username: listingInfo.seller.username,
    };
  }
}

/**
 * Error class for listing-specific errors
 */
export class ListingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "ListingError";
  }

  static notFound(id: string): ListingError {
    return new ListingError(
      `Listing with ID ${id} not found`,
      "LISTING_NOT_FOUND",
      404
    );
  }

  static fetchFailed(id: string, cause?: string): ListingError {
    return new ListingError(
      `Failed to fetch listing ${id}${cause ? `: ${cause}` : ""}`,
      "FETCH_FAILED",
      500
    );
  }
}
