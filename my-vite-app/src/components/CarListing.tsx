import { useParams } from "react-router";
import {
  Card,
  Carousel,
  Col,
  Collapse,
  CollapseProps,
  Divider,
  Flex,
  Row,
  Typography,
  Alert,
  Button,
} from "antd";
import { WarningOutlined, ReloadOutlined } from "@ant-design/icons";
import { formatToSyrianDate } from "../helper/timeFormat";
import { useAuth } from "../hooks/useAuth";
import FavBtn from "./FavBtn";
import CarListingSEO from "./seo/CarListingSEO";
import { useListing } from "../hooks/useListing";
import { ListingErrorBoundary } from "./common/ListingErrorBoundary";
import FormattedText from "./common/FormattedText";
import SellerProfile from "./common/SellerProfile";
import CompanyCard from "./common/CompanyCard";

const { Text, Title, Link } = Typography;

/**
 * CarListing Component
 *
 * Displays detailed car listing information with separated car and seller data.
 * Implements proper error handling, loading states, and follows SOLID principles.
 *
 * Features:
 * - Separated car and seller data presentation
 * - Error boundary integration
 * - Proper loading states
 * - SEO optimization
 * - Responsive design
 */
const CarListing = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  // Use custom hook for listing data management
  const { listing, loading, error, refetch } = useListing(id);

  // Extract car and seller data for easier access
  const car = listing?.car;
  const seller = listing?.seller;

  /**
   * Renders car images carousel with proper error handling
   * @returns JSX element containing images carousel or placeholder
   */
  const carImages = (): JSX.Element => {
    if (car?.image_urls instanceof Array && car.image_urls.length > 0) {
      return (
        <Carousel
          fade
          easing="linear"
          draggable
          focusOnSelect
          autoplay
          autoplaySpeed={5000}
          dots={car.image_urls.length > 1}
          arrows={car.image_urls.length > 1}
        >
          {car.image_urls.map((url: string, index: number) => (
            <img
              key={index}
              src={url}
              width={500}
              height={300}
              // zoom out the image to fit the card
              className="object-contain h-72 w-full min-w-72 rounded-lg
              transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer"
              alt={`Car image ${index + 1}`}
              onError={(e) => {
                e.currentTarget.src = "/images/car-placeholder.png"; // Fallback image
              }}
              onClick={(e) => {
                e.stopPropagation();
                // preview the image in a modal
                const modal = document.createElement("div");
                modal.className =
                  "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
                const container = document.createElement("div");
                container.className = "relative max-w-3xl max-h-full";
                modal.appendChild(container);
                const closeButton = document.createElement("button");
                closeButton.className =
                  "fixed justify-start text-white bg-red-500 hover:bg-red-700 rounded-full p-2 m-2";
                closeButton.innerText = "x";
                closeButton.onclick = () => {
                  document.body.removeChild(modal); // Close modal on click
                };
                const img = document.createElement("img");
                img.src = url;
                img.className = "max-w-full max-h-full";
                img.style.cursor = "pointer"; // Change cursor to pointer
                container.appendChild(closeButton);
                container.appendChild(img);
                document.body.appendChild(modal);
                e.preventDefault(); // Prevent click from propagating to the card
                e.stopPropagation(); // Prevent click from propagating to the card
              }} // Prevent click from propagating to the card
              loading="lazy"
              draggable={false} // Prevent dragging of the image
              onDragStart={(e) => e.preventDefault()} // Prevent default drag behavior
              onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
            />
          ))}
        </Carousel>
      );
    } else {
      return (
        <img
          src="https://i.ibb.co/8DBBMGPw/car-silhouette-vector-sport-car-silhouette-vector-png-113088.jpg"
          width={500}
          height={300}
          className="object-contain h-72 w-full min-w-72 rounded-lg"
          alt="Car placeholder"
        />
      );
    }
  };

  // Render error state
  if (error) {
    return (
      <Card className="w-full max-w-6xl sm:max-w-screen-lg my-4">
        <Alert
          message="خطأ في تحميل الإعلان"
          description={error}
          type="error"
          showIcon
          action={
            <Button
              size="small"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={refetch}
            >
              إعادة المحاولة
            </Button>
          }
        />
      </Card>
    );
  }

  // Render loading or not found state
  if (loading || !car || !seller) {
    return (
      <Card
        loading={loading}
        className="w-full max-w-6xl sm:max-w-screen-lg my-4"
      >
        {!loading && (!car || !seller) && (
          <Alert
            message="الإعلان غير موجود"
            description="لم يتم العثور على الإعلان المطلوب."
            type="warning"
            showIcon
          />
        )}
      </Card>
    );
  }

  const items: CollapseProps["items"] = [
    {
      key: "1",
      label: "تفاصيل السيارة",
      children: (
        <Row
          wrap
          justify="center"
          gutter={{ xs: 10, sm: 16, md: 24, lg: 13 }}
          className="dark:bg-gray-500/10 shadow-inner rounded-lg h-full w-full p-4"
        >
          {[
            { label: "الشركة المصنعة", value: car.make ?? "-" },
            { label: "الموديل", value: car.model ?? "-" },
            { label: "سنة الصنع", value: car.year ?? "-" },
            { label: "عدد الاحصنة", value: car.hp ?? "-" },
            { label: "كيلومتراج", value: `${car.mileage ?? "-"} كم` },
            { label: "اللون", value: car.color ?? "-" },
            { label: "ناقل الحركة", value: car.transmission ?? "-" },
            { label: "الوقود", value: car.fuel ?? "-" },
            { label: "نوع السيارة", value: car.car_type ?? "-" },
          ].map((item, index) => (
            <Col
              key={index}
              span={10}
              xs={12}
              sm={33}
              md={12}
              lg={4}
              xl={4}
              className="mb-4"
            >
              <div className="flex flex-col items-center justify-center border border-t-1 border-b-1 border-gray-300/50 border-s-4 border-e-2 p-3 rounded-lg h-full min-h-28 max-h-28 w-24 shadow-inner antialiased text-wrap">
                <Text className="text-xs sm:text-[0.9rem]  text-center h-full">
                  {item.label}
                </Text>
                <Text className="flex flex-col justify-center text-xs sm:text-xs font-bold h-full">
                  {item.value}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      ),
    },
  ];
  return (
    <ListingErrorBoundary>
      <CarListingSEO car={car} seller={seller} />
      <Card
        loading={loading}
        cover={carImages()}
        className="w-full max-w-6xl sm:max-w-screen-lg my-4"
      >
        <Flex className="mb-2" justify="space-evenly" align="center">
          <Flex vertical align="start" gap="4px" className="w-full">
            <Text className="text-sm sm:text-base text-start block">
              {formatToSyrianDate(car.created_at)}
            </Text>

            <Link
              href={`https://www.google.com/maps/search/${encodeURIComponent(
                car.location
              )}`}
              className="text-sm sm:text-base text-start block mb-2"
            >
              {car.location}
            </Link>
          </Flex>
          {user?.username !== seller.username && (
            <Flex vertical align="center">
              <FavBtn
                listingId={id || ""}
                initialFavorited={car.is_favorited}
                favoritedCount={car.favorites_count}
              />
            </Flex>
          )}
        </Flex>

        <Title className="text-xl sm:text-2xl text-start">
          {car.title ?? `${car.make} ${car.model}`}
        </Title>

        <Title level={2} className="text-lg sm:text-xl font-bold text-start">
          {car.price.toLocaleString("ar-SY")}
          {car.currency === "usd" ? "$" : "ل.س"}
        </Title>

        {/* Seller Profile Section */}
        <div className="my-6">
          <SellerProfile
            seller={seller}
            // companyInfo={companyInfo} // #TODO: Add company info when available
            currentUserUsername={user?.username}
            listingId={id}
          />
        </div>

        <Divider />

        <Collapse items={items} bordered={false} className="w-full" />

        <Divider />

        <div className="flex flex-col gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-start">الوصف</h2>
          <FormattedText
            content={car.description}
            className="text-sm sm:text-base text-balance text-start"
          />
        </div>

        <Link
          className="flex items-center gap-2 mt-4 text-sm sm:text-base"
          href={`/report/${id}`}
        >
          <p>تبليغ</p>
          <WarningOutlined />
        </Link>
      </Card>

      {/* Company Card Section - Only show for company sellers */}
      {seller.is_company && (
        <div className="m-6">
          <CompanyCard
            companyInfo={{
              id: seller.company_id || 0,
              name: seller.name || seller.first_name,
              description: "شركة متخصصة في بيع السيارات", // #TODO: Get from API
              address: seller.location,
              phone: seller.phone,
              totalListings: 25, // #TODO: Get from API
              memberSince: "2023", // #TODO: Get from API
              verificationStatus: "verified", // #TODO: Get from API
              username: seller.username,
            }}
            onContact={(companyId) => {
              // #TODO: Implement company contact functionality
              console.log("Contact company:", companyId);
            }}
          />
        </div>
      )}
    </ListingErrorBoundary>
  );
};

export default CarListing;
