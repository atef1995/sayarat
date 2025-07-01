import { Card, Carousel, Spin } from "antd";
import { CarCardProps } from "../types";
import FavBtn from "./FavBtn";
import { useNavigate } from "react-router";
import { formatMessageTime } from "../helper/time";
import React from "react";
import { StarFilled, ShopOutlined } from "@ant-design/icons";
import {
  shouldDisplayCompanyInfo,
  getEnhancedCompanyBadgeConfig,
  shouldShowSubscriptionBadge,
} from "../utils/companyUtils";
import StatusBadge from "./StatusBadge";
import { loadApiConfig } from "../config/apiConfig";
import { priceFormat } from "../helper/priceFormat";

const { apiUrl } = loadApiConfig();

const CarCard = ({ carData }: { carData: CarCardProps }) => {
  const navigate = useNavigate();

  const redirectToCarPage = async (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
    await fetch(`${apiUrl}/listings/${carData.id}/view`, {
      method: "PUT",
    });
    navigate(`/car-listing/${carData.id}`);
  };

  const handleCarouselClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!carData) {
    return <Spin className="w-full h-full" />;
  }
  const getHighlightStyle = () => {
    // Check both old products field and new highlight field
    const isHighlighted =
      carData.highlight || carData.products === "تمييز الإعلان";

    if (!isHighlighted) return "";

    // Different styles based on placement strategy
    const placement = carData._placement;

    const baseHighlightStyle =
      "border-b-2 border-yellow-500/40 bg-yellow-500/50 hover:bg-yellow-500/60 before:absolute before:top-16 before:-right-0 before:animate-pulse before:w-56 before:h-24 before:bg-yellow-500/50 before:blur-3xl before:rounded-lg before:z-0 before:shadow-2xl before:shadow-yellow-500/50 shadow-lg shadow-yellow-500/30 drop-shadow-xl transition-all ease-in-out duration-1000";

    // Add subtle placement indicators for different strategies
    if (placement?.includes("golden")) {
      return `${baseHighlightStyle} before:bg-amber-500/50 border-amber-500/40 bg-amber-500/50 hover:bg-amber-500/60`;
    } else if (placement?.includes("weighted")) {
      return `${baseHighlightStyle} before:bg-orange-500/50 border-orange-500/40 bg-orange-500/50 hover:bg-orange-500/60`;
    } else if (placement?.includes("alt")) {
      return `${baseHighlightStyle} before:bg-lime-500/50 border-lime-500/40 bg-lime-500/50 hover:bg-lime-500/60`;
    }

    return baseHighlightStyle;
  };

  /**
   * Renders company information with subscription badges
   * Uses modular utilities and StatusBadge component for consistent design
   */
  const renderCompanyInfo = () => {
    if (!shouldDisplayCompanyInfo(carData)) return null;

    const enhancedConfig = getEnhancedCompanyBadgeConfig(carData);
    if (!enhancedConfig) return null;

    return (
      <div className="flex items-center justify-start gap-1.5 mb-2 px-1">
        {/* Company Name Badge */}
        <div className={enhancedConfig.className}>
          <ShopOutlined className="text-xs" />
          <span className="font-medium">{enhancedConfig.name}</span>
        </div>

        {/* Subscription Status Badge */}
        {shouldShowSubscriptionBadge(carData) &&
          enhancedConfig.subscriptionBadgeType && (
            <StatusBadge
              type={enhancedConfig.subscriptionBadgeType}
              size="mini"
              showIcon={true}
              showLabel={false}
              animated={enhancedConfig.hasActiveSubscription}
              className="ml-1"
            />
          )}

        {/* Verification Badge (if verified but no active subscription) */}
        {enhancedConfig.isVerified && !enhancedConfig.hasActiveSubscription && (
          <div className="flex items-center">
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full border border-green-200 dark:border-green-700">
              موثق
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card
      actions={[
        <FavBtn
          className="z-20"
          listingId={carData.id}
          initialFavorited={carData.is_favorited}
          favoritedCount={carData.favorites_count as number}
        />,
      ]}
      hoverable
      className={`min-h-max w-56 z-10 space-y-2 ${getHighlightStyle()}`}
      onClick={(e) => redirectToCarPage(e)}
      cover={
        <div onClick={handleCarouselClick}>
          <Carousel
            draggable
            focusOnSelect
            autoplay
            autoplaySpeed={5000}
            adaptiveHeight
            className="mb-2 m-0 p-0"
          >
            {carData.image_urls instanceof Array &&
            carData.image_urls.length > 0 ? (
              carData.image_urls?.map((data, index) => (
                <img
                  key={index}
                  className="object-cover h-52 m-0"
                  alt={carData.model}
                  src={data}
                />
              ))
            ) : (
              <img
                className="object-cover h-52 m-0"
                alt={carData.model}
                src={
                  carData.image_urls[0] ??
                  "https://i.ibb.co/8DBBMGPw/car-silhouette-vector-sport-car-silhouette-vector-png-113088.jpg"
                }
              />
            )}
          </Carousel>
        </div>
      }
    >
      <div
        className={`flex flex-col font-thin space-y-1 min-h-36 max-h-40 relative`}
      >
        {/* Company Information */}

        <div className="flex justify-start items-baseline">
          {carData.title ? (
            <p
              className={`max-w-40 max-h-10 overflow-clip text-sm font-semibold ${
                carData.products === "تمييز الإعلان"
                  ? "text-yellow-100/70 border-r-4 shadow-inner shadow-yellow-500/40 px-2 border-r-yellow-500"
                  : "text-gray-200"
              }`}
            >
              {carData.products === "تمييز الإعلان" && (
                <StarFilled className="text-yellow-500 ml-1" />
              )}
              {carData.title ?? ""}
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold">{carData.model ?? ""}</p>
              <span className="w-1"></span>
              <p className="text-sm font-semibold">{carData.make ?? ""}</p>
            </>
          )}
        </div>
        <div className="flex text-start text-xs space-x-0.5">
          <p>{carData.year ?? ""}</p>
          <span>/</span>
          <p>{carData.mileage?.toLocaleString("ar-sy")} كم</p>
          <span>/</span>
          <p>{carData.fuel ?? ""}</p>
        </div>
        <div className="text-start text-sm">
          <p>{priceFormat(carData.price, carData.currency)}</p>
        </div>
        <div className="flex justify-between h-24 items-end m-1">
          <p className="font-semibold p-2">
            {formatMessageTime(carData.created_at)}
          </p>
          {renderCompanyInfo()}
        </div>
      </div>
    </Card>
  );
};

export default CarCard;
