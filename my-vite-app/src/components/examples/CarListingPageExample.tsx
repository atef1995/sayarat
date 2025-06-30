import React from "react";
import { CarInfo, Seller } from "../../types";
import CarListingSEO from "../seo/CarListingSEO";

interface CarListingPageProps {
  car: CarInfo;
  seller: Seller;
  companyName?: string;
}

/**
 * Example Car Listing Page with SEO Integration
 *
 * Demonstrates how to integrate SEO components with existing car listing pages
 * using the existing CarInfo and Seller types.
 *
 * Features:
 * - Comprehensive SEO optimization
 * - Structured data for rich search results
 * - Arabic keyword optimization
 * - Social media optimization
 * - Local SEO targeting
 *
 * #TODO: Add image gallery SEO optimization
 * #TODO: Implement related cars SEO
 * #TODO: Add user review structured data
 */
const CarListingPageExample: React.FC<CarListingPageProps> = ({
  car,
  seller,
  companyName = "مزادات السيارات",
}) => {
  return (
    <div className="car-listing-page">
      {/* SEO Component - This handles all SEO optimization automatically */}
      <CarListingSEO car={car} seller={seller} companyName={companyName} />

      {/* Your existing car listing content */}
      <div className="car-listing-content">
        <h1>{car.title}</h1>

        <div className="car-details">
          <h2>
            {car.make} {car.model} {car.year}
          </h2>
          <p className="price">
            {car.price.toLocaleString()} {car.currency}
          </p>
          <p className="location">{car.location}</p>

          <div className="car-specs">
            <p>المسافة المقطوعة: {car.mileage?.toLocaleString()} كم</p>
            <p>نوع الوقود: {car.fuel}</p>
            <p>ناقل الحركة: {car.transmission}</p>
            <p>نوع السيارة: {car.car_type}</p>
            <p>اللون: {car.color}</p>
          </div>

          <div className="car-description">
            <h3>وصف السيارة</h3>
            <p>{car.description}</p>
          </div>

          <div className="car-specifications">
            <h3>المواصفات</h3>
            <ul>
              {car.specs.map((spec, index) => (
                <li key={index}>{spec}</li>
              ))}
            </ul>
          </div>

          <div className="car-images">
            <h3>صور السيارة</h3>
            <div className="image-gallery">
              {car.image_urls.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${car.make} ${car.model} ${car.year} - صورة ${
                    index + 1
                  }`}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              ))}
            </div>
          </div>

          <div className="seller-info">
            <h3>معلومات البائع</h3>
            <p>الاسم: {seller.name}</p>
            <p>الموقع: {seller.location}</p>
            {seller.phone_num && <p>الهاتف: {seller.phone_num}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarListingPageExample;
