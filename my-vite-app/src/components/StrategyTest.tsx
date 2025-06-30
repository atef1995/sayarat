import React, { useState, useEffect, useCallback } from "react";
import { Button, Select, Slider, Card, Typography, Space } from "antd";
import { fetchListings } from "../api/fetchCars";
import { CarInfo } from "../types";

const { Title, Text } = Typography;
const { Option } = Select;

interface StrategyStats {
  total: number;
  highlightedCount: number;
  strategy: string;
  smart: boolean;
}

interface StrategyTestProps {
  onClose?: () => void;
}

const StrategyTest: React.FC<StrategyTestProps> = ({ onClose }) => {
  const [strategy, setStrategy] = useState<string>("auto");
  const [highlightRatio, setHighlightRatio] = useState<number>(0.25);
  const [listings, setListings] = useState<CarInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StrategyStats | null>(null);

  const strategies = [
    {
      value: "auto",
      label: "Smart Auto",
      description: "Automatically selects best strategy",
    },
    {
      value: "distributed",
      label: "Distributed",
      description: "Even distribution throughout page",
    },
    {
      value: "golden-ratio",
      label: "Golden Ratio",
      description: "Aesthetically pleasing 1:1.618 ratio",
    },
    {
      value: "alternating",
      label: "Alternating",
      description: "Regular pattern (2 regular, 1 highlighted)",
    },
    {
      value: "weighted",
      label: "Weighted",
      description: "Strategic positions (2nd, 5th, 8th...)",
    },
    {
      value: "top-bottom",
      label: "Top & Bottom",
      description: "Highlighted at top and bottom",
    },
    { value: "mixed", label: "Random Mix", description: "Random distribution" },
  ];

  const fetchTestListings = useCallback(async () => {
    setLoading(true);
    try {
      const strategyParam = strategy !== "auto" ? `&strategy=${strategy}` : "";
      const endpoint = `/api/listings/smart?page=1&limit=12&highlightRatio=${highlightRatio}${strategyParam}`;

      const response = await fetchListings(endpoint);
      setListings(response.rows);
      setStats({
        total: response.total,
        highlightedCount: response.highlightedCount || 0,
        strategy: response.strategy || "unknown",
        smart: response.smart || false,
      });
    } catch (error) {
      console.error("Error fetching test listings:", error);
    } finally {
      setLoading(false);
    }
  }, [strategy, highlightRatio]);

  useEffect(() => {
    fetchTestListings();
  }, [fetchTestListings]);

  const getItemStyle = (listing: CarInfo) => {
    const isHighlighted =
      listing.highlight || listing.products === "تمييز الإعلان";
    const placement = listing._placement;

    if (!isHighlighted) {
      return "bg-gray-100 border-gray-300 text-gray-700";
    }

    // Different colors for different placement strategies
    if (placement?.includes("golden")) {
      return "bg-amber-100 border-amber-400 text-amber-800";
    } else if (placement?.includes("weighted")) {
      return "bg-orange-100 border-orange-400 text-orange-800";
    } else if (placement?.includes("alt")) {
      return "bg-lime-100 border-lime-400 text-lime-800";
    } else if (placement?.includes("top") || placement?.includes("bottom")) {
      return "bg-blue-100 border-blue-400 text-blue-800";
    }

    return "bg-yellow-100 border-yellow-400 text-yellow-800";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Highlight Strategy Testing</Title>
        {onClose && (
          <Button onClick={onClose} type="primary">
            Close
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <Space direction="vertical" size="large" className="w-full">
          <div>
            <Text strong>Strategy:</Text>
            <Select
              value={strategy}
              onChange={setStrategy}
              className="w-full mt-2"
              placeholder="Select strategy"
            >
              {strategies.map((s) => (
                <Option key={s.value} value={s.value}>
                  <div>
                    <div className="font-medium">{s.label}</div>
                    <div className="text-xs text-gray-500">{s.description}</div>
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong>
              Highlight Ratio: {Math.round(highlightRatio * 100)}%
            </Text>
            <Slider
              value={highlightRatio}
              onChange={setHighlightRatio}
              min={0.1}
              max={0.5}
              step={0.05}
              className="mt-2"
            />
          </div>

          <Button
            type="primary"
            onClick={fetchTestListings}
            loading={loading}
            className="w-full"
          >
            Test Strategy
          </Button>
        </Space>
      </Card>

      {stats && (
        <Card className="mb-6" title="Strategy Results">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Text type="secondary">Applied Strategy:</Text>
              <div className="font-medium text-lg">{stats.strategy}</div>
            </div>
            <div>
              <Text type="secondary">Total Listings:</Text>
              <div className="font-medium text-lg">{stats.total}</div>
            </div>
            <div>
              <Text type="secondary">Highlighted:</Text>
              <div className="font-medium text-lg">
                {stats.highlightedCount}
              </div>
            </div>
            <div>
              <Text type="secondary">Smart Mode:</Text>
              <div className="font-medium text-lg">
                {stats.smart ? "Yes" : "No"}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card title="Visual Preview" loading={loading}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {listings.map((listing, index) => {
            const isHighlighted =
              listing.highlight || listing.products === "تمييز الإعلان";
            return (
              <div
                key={listing.id}
                className={`p-3 rounded border-2 text-center ${getItemStyle(
                  listing
                )}`}
              >
                <div className="text-xs font-medium">#{index + 1}</div>
                <div className="text-sm mt-1">
                  {listing.make} {listing.model}
                </div>
                <div className="text-xs mt-1">
                  {isHighlighted ? "⭐ Highlighted" : "📄 Regular"}
                </div>
                {listing._placement && (
                  <div className="text-xs mt-1 opacity-75">
                    {listing._placement}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-6" title="Strategy Explanations">
        <div className="space-y-4">
          {strategies.map((s) => (
            <div
              key={s.value}
              className={`p-3 rounded ${
                s.value === stats?.strategy
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-gray-50"
              }`}
            >
              <div className="font-medium">{s.label}</div>
              <div className="text-sm text-gray-600">{s.description}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default StrategyTest;
