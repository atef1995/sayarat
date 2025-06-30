/**
 * PaginatedCards Component
 *
 * A reusable component for displaying paginated car listings with various strategies.
 * Supports both URL-based search parameters and prop-based search parameters.
 *
 * Features:
 * - Server-side pagination with configurable page sizes
 * - Smart highlighting strategies for featured listings
 * - Flexible search parameter handling (URL + props)
 * - Initial data support to bypass API calls when data is already available
 * - Username-based filtering for user-specific listings
 *
 * Usage:
 * - General listings: <PaginatedCards />
 * - User listings: <PaginatedCards searchParams={new URLSearchParams({username: 'john'})} />
 * - With initial data: <PaginatedCards carsData={preloadedData} />
 *
 * #TODO: Add error boundary for failed API calls
 * #TODO: Implement retry mechanism for failed requests
 * #TODO: Add skeleton loading states
 * #TODO: Consider adding infinite scroll option
 */

import { useEffect, useState } from "react";
import { Pagination, Spin } from "antd";
import { CarInfo } from "../types";
import CarCard from "./CarCard";
import { fetchListings } from "../api/fetchCars";
import { useSearchParams } from "react-router";

interface PaginatedCardsProps {
  searchParams?: URLSearchParams;
  useSmartStrategy?: boolean; // New prop to enable smart highlighting
  highlightStrategy?:
    | "auto"
    | "distributed"
    | "golden-ratio"
    | "alternating"
    | "weighted"
    | "top-bottom"
    | "mixed";
  showStrategyControls?: boolean; // New prop to show strategy testing controls
  carsData?: CarInfo[] | null; // Optional initial data prop
}

const PaginatedCards = ({
  searchParams,
  useSmartStrategy = true,
  highlightStrategy = "auto",
  showStrategyControls = false,
  carsData: initialCarsData,
}: PaginatedCardsProps) => {
  const [carsData, setCarsData] = useState<CarInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [urlSearchParams] = useSearchParams();
  const [cardsPerPage, setCardsPerPage] = useState(6);
  const [currentStrategy, setCurrentStrategy] = useState(highlightStrategy);
  const [strategyStats, setStrategyStats] = useState<{
    appliedStrategy?: string;
    highlightedCount?: number;
    smart?: boolean;
  } | null>(null);
  useEffect(() => {
    // if initialCarsData is provided, use it directly
    if (initialCarsData) {
      console.log("Using initial cars data:", initialCarsData.length);

      setCarsData(initialCarsData);
      setTotalCount(initialCarsData.length);
      return; // Skip fetching if initial data is available
    }

    const fetchFilteredListings = async () => {
      setLoading(true);
      try {
        // Combine URL search params with passed searchParams prop
        const urlQueryString = urlSearchParams.toString();
        const propQueryString = searchParams?.toString() || "";

        // Combine both query strings
        let combinedQueryString = "";
        if (urlQueryString && propQueryString) {
          // if they are the same, avoid duplication
          if (urlQueryString === propQueryString) {
            combinedQueryString = urlQueryString;
          } else {
            combinedQueryString = `${urlQueryString}&${propQueryString}`;
          }
        } else if (urlQueryString) {
          combinedQueryString = urlQueryString;
        } else if (propQueryString) {
          combinedQueryString = propQueryString;
        }

        const paginationParams = `page=${currentPage}&limit=${cardsPerPage}`;
        let endpoint;

        if (useSmartStrategy) {
          // Use smart strategy endpoint
          const strategyParams =
            currentStrategy !== "auto" ? `&strategy=${currentStrategy}` : "";
          endpoint = combinedQueryString
            ? `/api/listings/smart?${combinedQueryString}&${paginationParams}${strategyParams}`
            : `/api/listings/smart?${paginationParams}${strategyParams}`;
        } else {
          // Use regular search endpoint for all cases (including username filtering)
          endpoint = combinedQueryString
            ? `/api/listings/search?${combinedQueryString}&${paginationParams}`
            : `/api/listings/search?${paginationParams}`;
        }

        console.log("Fetching listings with endpoint:", endpoint);
        console.log("Combined query string:", combinedQueryString);

        const response = await fetchListings(endpoint);
        const { rows, total } = response;
        console.log("Fetched listings:", rows, "Total count:", total);

        // Log smart strategy info if available and save stats
        if (response.smart && response.strategy) {
          console.log("Smart strategy applied:", response.strategy);
          setStrategyStats({
            appliedStrategy: response.strategy,
            highlightedCount: response.highlightedCount,
            smart: response.smart,
          });
        } else {
          setStrategyStats(null);
        }

        setCarsData(rows);
        setTotalCount(total);
      } catch (error) {
        console.error("Error fetching listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredListings();
  }, [
    searchParams,
    urlSearchParams,
    currentPage,
    cardsPerPage,
    useSmartStrategy,
    currentStrategy,
    initialCarsData,
  ]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Strategy Controls - for testing and admin use */}
      {showStrategyControls && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-medium mb-3">
            Highlight Strategy Controls
          </h3>
          <div className="flex flex-wrap gap-4 items-center">
            {" "}
            <div>
              <label
                htmlFor="strategy-selector"
                className="block text-sm font-medium mb-1"
              >
                Strategy:
              </label>
              <select
                id="strategy-selector"
                value={currentStrategy}
                onChange={(e) =>
                  setCurrentStrategy(e.target.value as typeof currentStrategy)
                }
                className="border rounded px-3 py-1 text-sm"
                title="Select highlight strategy"
              >
                <option value="auto">Smart Auto</option>
                <option value="distributed">Distributed</option>
                <option value="golden-ratio">Golden Ratio</option>
                <option value="alternating">Alternating</option>
                <option value="weighted">Weighted</option>
                <option value="top-bottom">Top & Bottom</option>
                <option value="mixed">Random Mix</option>
              </select>
            </div>
            {strategyStats && (
              <div className="text-sm">
                <span className="font-medium">Applied:</span>{" "}
                {strategyStats.appliedStrategy} |{" "}
                <span className="font-medium">Highlighted:</span>{" "}
                {strategyStats.highlightedCount} |{" "}
                <span className="font-medium">Smart:</span>{" "}
                {strategyStats.smart ? "Yes" : "No"}
              </div>
            )}
          </div>
        </div>
      )}

      {carsData.length === 0 ? (
        <div className="text-center text-gray-500 my-8">
          لا توجد نتائج لبحثك
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-center justify-items-center">
            {carsData.map((carData) => (
              <CarCard key={carData.id} carData={carData} />
            ))}
          </div>

          <div className="flex justify-center mt-6 text-black dark:text-white">
            <Pagination
              current={currentPage}
              onChange={(page) => handlePageChange(page)}
              total={totalCount}
              pageSize={cardsPerPage}
              onShowSizeChange={(current, size) => {
                console.log(
                  "Page size changed:",
                  size,
                  "Current page:",
                  current
                );
                setCardsPerPage(size);
                setCurrentPage(1); // Reset to first page when page size changes
              }}
              showSizeChanger={true}
              showTotal={(total, range) =>
                `عرض ${range[0]} إلى ${range[1]} من ${total} نتيجة`
              }
              pageSizeOptions={["6", "12", "18", "24"]}
              showQuickJumper
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PaginatedCards;
