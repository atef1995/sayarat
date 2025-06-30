import { useState } from "react";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import { Flex, message } from "antd";
import { CarInfo } from "../types";
import { ApiResponse } from "../types/api.types";
import { useAuth } from "../hooks/useAuth";
import { loadApiConfig } from "../config/apiConfig";
import { useNavigate } from "react-router";
import useDebounce from "../hooks/useDebounce";

const { apiUrl } = loadApiConfig();

interface FavBtnProps {
  listingId: CarInfo["id"];
  className?: string;
  initialFavorited?: boolean;
  favoritedCount?: number;
}

/**
 * FavBtn - Favorite button for car listings.
 * Handles add/remove favorite logic with debounce and authentication check.
 */
export const FavBtn: React.FC<FavBtnProps> = ({
  listingId,
  className,
  initialFavorited = false,
  favoritedCount = 0,
}) => {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(favoritedCount);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Handles the favorite/unfavorite logic
  const addOrRemoveFavorite = async () => {
    if (!isAuthenticated) {
      message.error("يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }
    const newFavoritedState = !isFavorited;
    try {
      if (newFavoritedState) {
        const response = await fetch(`${apiUrl}/api/favorites/${listingId}`, {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          message.error("حدث خطأ ما");
        }

        const data: ApiResponse = await response.json();

        if (data.success) {
          message.success("تمت اضافة السيارة بنجاح الى المفضلة");
        } else {
          message.error(data.error);
          throw data.error;
        }
      } else {
        const response = await fetch(`${apiUrl}/api/favorites/${listingId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          message.error("حدث خطأ ما");
        }

        const data: ApiResponse = await response.json();

        if (data.success) {
          message.success("تمت ازالة السيارة بنجاح الى المفضلة");
        } else {
          message.error(data.error);
          throw data.error;
        }
      }
    } catch {
      setIsFavorited(!initialFavorited);
    }
  };

  // Debounced handler for the button click
  const debouncedAddOrRemoveFavorite = useDebounce(addOrRemoveFavorite, 500);

  return (
    <Flex vertical align="center" gap="4px">
      <button
        onClick={(e) => {
          setIsFavorited(!isFavorited);
          setCount(isFavorited ? count - 1 : count + 1);
          e.preventDefault();
          e.stopPropagation();
          debouncedAddOrRemoveFavorite();
        }}
        className={`w-14 ${className} p-2 rounded-full border-none hover:bg-red-500/5
        active:bg-red-500/20 active:scale-95 transition-colors`}
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavorited ? (
          <HeartFilled className="text-red-500 hover:text-red-700 active:scale-95" />
        ) : (
          <HeartOutlined className="text-gray-500 hover:text-red-500 active:scale-95" />
        )}
      </button>
      <span className="text-black dark:text-white">{count}</span>
    </Flex>
  );
};

export default FavBtn;
