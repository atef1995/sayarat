import {
  Card,
  Tabs,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Flex,
  Button,
  Image,
} from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import React, { useState } from "react";
import { CarInfo } from "../types";
import { useNavigate } from "react-router";
import { formatToSyrianDate } from "../helper/timeFormat";

const { TabPane } = Tabs;
const { Text } = Typography;
const { Search } = Input;

interface MobileEditListing {
  loading: boolean;
  getFilteredListings: (status: string) => CarInfo[];
  handleDelete: (id: CarInfo["id"]) => void;
}

const MobileEditListing = ({
  loading,
  getFilteredListings,
  handleDelete,
}: MobileEditListing) => {
  const [searchText, setSearchText] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const navigate = useNavigate();

  type SortOption = "newest" | "oldest" | "make" | "price-high" | "price-low";

  const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: "newest", label: "الأحدث" },
    { value: "oldest", label: "الأقدم" },
    { value: "make", label: "الماركة" },
    { value: "price-high", label: "السعر: من الأعلى" },
    { value: "price-low", label: "السعر: من الأقل" },
  ];

  const filterListings = (listings: CarInfo[]) => {
    if (!listings) return [];

    const filtered = listings.filter((listing) =>
      `${listing.make} ${listing.model} ${listing.year}`
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );

    switch (sortBy) {
      case "newest":
        return filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "make":
        return filtered.sort((a, b) => a.make.localeCompare(b.make));
      case "price-high":
        return filtered.sort((a, b) => b.price - a.price);
      case "price-low":
        return filtered.sort((a, b) => a.price - b.price);
      default:
        return filtered;
    }
  };

  const Images: React.FC<{ images: string[] | string }> = ({ images }) => {
    if (Array.isArray(images)) {
      return images.map((url, index) => (
        <Image
          key={index}
          src={url}
          alt="car"
          height={150}
          style={{ objectFit: "cover" }}
        />
      ));
    }
    return (
      <Image
        src={images}
        alt="car"
        height={150}
        style={{ objectFit: "cover" }}
      />
    );
  };

  const ListingCard = ({ listing }: { listing: CarInfo }) => (
    <Card
      actions={[
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => (window.location.href = `/car-listing/${listing.id}`)}
        >
          عرض
        </Button>,
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => navigate(`/edit-listing/${listing.id}`)}
        >
          تعديل
        </Button>,
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(listing.id)}
        >
          حذف
        </Button>,
      ]}
      cover={<Images images={listing.image_urls} />}
      className="mb-4 shadow-sm"
      style={{ padding: "12px" }}
    >
      <Flex vertical wrap gap={20}>
        <Flex justify="center" align="center" gap={20} wrap>
          <Text>{listing.title}</Text>
          <Text strong className="text-lg">
            {listing.model}
          </Text>
          <Text strong className="text-lg">
            {listing.make}
          </Text>
        </Flex>
        <Flex justify="center">
          <Tag
            className="w-12 text-center"
            color={
              listing.status === "active"
                ? "green"
                : listing.status === "pending"
                ? "orange"
                : "red"
            }
          >
            {listing.status === "active"
              ? "نشط"
              : listing.status == "pending"
              ? "قيد المراجعة"
              : " غير نشط"}
          </Tag>
        </Flex>
        <Flex justify="center" align="center" gap={20}>
          <Text type="secondary">{listing.year}</Text>
          <Text type="success" strong>
            {listing.price.toLocaleString("ar-sy") +
              " " +
              (listing.currency === "usd" ? "$" : "ل.س")}
          </Text>
          <Text>{formatToSyrianDate(listing.created_at)}</Text>
        </Flex>

        <Space className="w-full justify-end mt-2"></Space>
      </Flex>
    </Card>
  );

  return (
    <div className="p-4">
      <Space direction="vertical" className="w-full mb-4">
        <Search
          placeholder="ابحث عن سيارة..."
          allowClear
          loading={loading}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select
          className="w-full"
          placeholder="ترتيب حسب"
          options={sortOptions}
          onChange={setSortBy}
          defaultValue="newest"
        />
      </Space>

      <Tabs defaultActiveKey="active">
        <TabPane
          tab={`نشط (${getFilteredListings("active")?.length || 0})`}
          key="active"
        >
          {filterListings(getFilteredListings("active")).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </TabPane>
        <TabPane
          tab={`قيد المراجعة (${getFilteredListings("pending")?.length || 0})`}
          key="pending"
        >
          {filterListings(getFilteredListings("pending")).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </TabPane>
        <TabPane
          tab={`غير نشط (${getFilteredListings("expired")?.length || 0})`}
          key="expired"
        >
          {filterListings(getFilteredListings("expired")).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default MobileEditListing;
