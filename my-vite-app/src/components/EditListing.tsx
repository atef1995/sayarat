import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Spin, message } from "antd";
import {
  CarInfo,
  ListingInfo,
  CreateListing as CreateListingType,
} from "../types";
import CreateListing from "./CreateListing";
import { fetchListingById } from "../api/fetchCars";

interface EditListingProps {
  initialValues?: CarInfo;
}

// Convert CarInfo to CreateListing format
const convertCarInfoToCreateListing = (carInfo: CarInfo): CreateListingType => {
  return {
    ...carInfo,
    // Convert image_urls array to the expected format for CreateListing
    image_urls: carInfo.image_urls || [],
  } as CreateListingType;
};

interface EditListingProps {
  initialValues?: CarInfo;
}

/**
 * EditListing Component
 *
 * Fetches an existing listing by ID and renders the CreateListing component
 * with the fetched data as initial values for editing.
 */
const EditListing: React.FC<EditListingProps> = () => {
  const { id } = useParams<{ id: CarInfo["id"] }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listingData, setListingData] = useState<CarInfo | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        if (!id) {
          message.error("No listing ID provided");
          navigate("/listings");
          return;
        }

        setLoading(true);
        const data: ListingInfo = await fetchListingById(id);

        // Extract the car information from the listing response
        setListingData(data.car);
      } catch (error) {
        console.error("Error fetching listing:", error);

        // Provide more specific error messages
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch listing";

        message.error(errorMessage);
        navigate("/listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <CreateListing
      initialValues={
        listingData ? convertCarInfoToCreateListing(listingData) : undefined
      }
    />
  );
};

export default EditListing;
