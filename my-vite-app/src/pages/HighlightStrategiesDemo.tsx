import React, { useState } from "react";
import { Button, Card, Typography, Space, Alert } from "antd";
import PaginatedCards from "../components/PaginatedCards";
import StrategyTest from "../components/StrategyTest";

const { Title, Text } = Typography;

const HighlightStrategiesDemo: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState<"live" | "test">("live");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("auto");

  const strategies = [
    {
      value: "auto",
      label: "Smart Auto",
      description: "Automatically selects best strategy",
    },
    {
      value: "distributed",
      label: "Distributed",
      description: "Even spacing throughout page",
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <Title level={1}>🌟 Highlighted Listings Strategy Demo</Title>
        <Text className="text-lg text-gray-600">
          Experience how different highlighting strategies affect listing
          display and user experience.
        </Text>
      </div>

      <Alert
        message="Strategy System Benefits"
        description="This system ensures highlighted listings appear on every page without always being at the top, creating better user experience while maintaining visibility for promoted content."
        type="info"
        showIcon
        className="mb-6"
      />

      <div className="mb-6">
        <Space size="large">
          <Button
            type={currentDemo === "live" ? "primary" : "default"}
            onClick={() => setCurrentDemo("live")}
          >
            Live Demo
          </Button>
          <Button
            type={currentDemo === "test" ? "primary" : "default"}
            onClick={() => setCurrentDemo("test")}
          >
            Strategy Testing
          </Button>
        </Space>
      </div>

      {currentDemo === "live" && (
        <div>
          <Card className="mb-6">
            <Title level={3}>Live Listings with Smart Strategies</Title>{" "}
            <div className="mb-4">
              <label htmlFor="strategy-select" className="font-medium mr-2">
                Current Strategy:
              </label>
              <select
                id="strategy-select"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="ml-2 border rounded px-3 py-1"
                title="Select highlighting strategy"
              >
                {strategies.map((strategy) => (
                  <option key={strategy.value} value={strategy.value}>
                    {strategy.label} - {strategy.description}
                  </option>
                ))}
              </select>
            </div>
            <Alert
              message={`Using ${
                strategies.find((s) => s.value === selectedStrategy)?.label
              } Strategy`}
              description={
                strategies.find((s) => s.value === selectedStrategy)
                  ?.description
              }
              type="success"
              className="mb-4"
            />
          </Card>{" "}
          <PaginatedCards
            useSmartStrategy={true}
            highlightStrategy={
              selectedStrategy as
                | "auto"
                | "distributed"
                | "golden-ratio"
                | "alternating"
                | "weighted"
                | "top-bottom"
                | "mixed"
            }
            showStrategyControls={true}
          />
        </div>
      )}

      {currentDemo === "test" && (
        <div>
          <Card>
            <Title level={3}>Strategy Testing & Analysis</Title>
            <Text className="text-gray-600 mb-4 block">
              This tool allows you to test different strategies with sample data
              and see visual previews of how highlighted listings would be
              distributed.
            </Text>
          </Card>

          <StrategyTest />
        </div>
      )}

      <Card className="mt-8">
        <Title level={3}>🎯 Strategy Explanations</Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.value}
              className={`p-4 rounded border-2 cursor-pointer transition-all ${
                selectedStrategy === strategy.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedStrategy(strategy.value)}
            >
              <div className="font-semibold text-lg">{strategy.label}</div>
              <div className="text-gray-600 text-sm mt-1">
                {strategy.description}
              </div>

              {strategy.value === "auto" && (
                <div className="mt-2 text-xs text-blue-600">
                  ⭐ Recommended for production use
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <Title level={4}>📈 Key Benefits</Title>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">👥</div>
            <div className="font-medium">Better User Experience</div>
            <div className="text-sm text-gray-600">
              Varied content placement feels more natural and less intrusive
            </div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">💰</div>
            <div className="font-medium">Revenue Optimization</div>
            <div className="text-sm text-gray-600">
              Highlighted listings get visibility on every page without
              overwhelming users
            </div>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🧠</div>
            <div className="font-medium">Smart Adaptation</div>
            <div className="text-sm text-gray-600">
              Automatically adapts to content density and page context
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HighlightStrategiesDemo;
