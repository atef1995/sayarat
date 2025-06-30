import { useEffect, useState } from "react";
import {
  Card,
  List,
  Image,
  Button,
  Spin,
  Empty,
  message,
  Pagination,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { CarInfo } from "../types";
import { useNavigate } from "react-router";
import { loadApiConfig } from "../config/apiConfig";

const Favorites = () => {
  const [favorites, setFavorites] = useState<CarInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const { apiUrl } = loadApiConfig();

  const handlePageChange = async (page: number, size: number = pageSize) => {
    // Update state immediately for better UX
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }

    // Fetch new data
    await fetchFavorites(page, size);
  };

  const fetchFavorites = async (
    page: number = currentPage,
    size: number = pageSize
  ) => {
    try {
      setLoading(true);

      // Build query parameters for pagination
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: size.toString(),
      });

      const response = await fetch(`${apiUrl}/api/favorites/?${queryParams}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          message.error("يجب تسجيل الدخول أولاً");
          return;
        }
        throw new Error("Failed to fetch favorites");
      }

      const data = await response.json();
      console.log("Favorites data:", data);

      // Handle different response structures
      if (data.favorites && data.pagination) {
        // Backend returns paginated response
        setFavorites(data.favorites);
        setTotalCount(data.pagination.totalItems);
        setCurrentPage(data.pagination.currentPage);
        setPageSize(data.pagination.itemsPerPage);
      } else if (Array.isArray(data)) {
        // Backend returns simple array (fallback)
        setFavorites(data);
        setTotalCount(data.length);
      } else {
        // Handle other potential response structures
        setFavorites(data.data || []);
        setTotalCount(data.total || data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      message.error("فشل في تحميل المفضلة");
      setFavorites([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (listingId: CarInfo["id"]) => {
    try {
      const response = await fetch(`${apiUrl}/api/favorites/${listingId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to remove from favorites");

      // Update the favorites list and total count
      const newFavorites = favorites.filter((fav) => fav.id !== listingId);
      setFavorites(newFavorites);
      setTotalCount((prev) => prev - 1);

      // If current page becomes empty and it's not the first page, go to previous page
      if (newFavorites.length === 0 && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        await fetchFavorites(newPage, pageSize);
      }

      message.success("تمت إزالة السيارة من المفضلة");
    } catch (error) {
      console.log(error);
      message.error("فشل في إزالة السيارة من المفضلة");
    }
  };

  useEffect(() => {
    fetchFavorites(1, 10); // Initial load with default pagination
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Spin
        size="large"
        className="flex justify-center items-center min-h-screen"
      />
    );
  }

  if (!favorites?.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="لا توجد سيارات في المفضلة"
      />
    );
  }

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6 text-right">السيارات المفضلة</h1>
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 3,
            lg: 3,
            xl: 4,
            xxl: 4,
          }}
          dataSource={favorites}
          renderItem={(item: CarInfo) => (
            <List.Item className="min-w-40">
              <Card
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/car-listing/${item.id}`);
                }}
                hoverable
                cover={
                  <div className="min-h-48 h-48 overflow-hidden">
                    <Image
                      alt={item.make}
                      src={item.image_urls[0]}
                      className="w-full h-full object-cover"
                    />
                  </div>
                }
                actions={[
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      removeFavorite(item.id);
                    }}
                  >
                    إزالة من المفضلة
                  </Button>,
                ]}
              >
                <Card.Meta
                  title={`${item.title ?? "- "}`}
                  description={
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">
                        {item.make} {item.model}
                        <span className="text-sm text-gray-400">
                          {" "}
                          ({item.year})
                        </span>
                      </p>
                      <p>
                        السعر: {item.price.toLocaleString("ar")}{" "}
                        {item.currency === "usd" ? "$" : "ل.س"}
                      </p>
                      <p>الكيلومترات: {item.mileage ?? ""} كم</p>
                      <p>اللون: {item.color ?? ""}</p>
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
        {totalCount > pageSize && (
          <Pagination
            className="mb-4 mt-6 text-center"
            current={currentPage}
            total={totalCount}
            pageSize={pageSize}
            showSizeChanger={true}
            showQuickJumper={true}
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} من ${total} سيارة`
            }
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            pageSizeOptions={["5", "10", "20", "50"]}
          />
        )}
      </div>
    </>
  );
};

export default Favorites;
