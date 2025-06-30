import React, { useState } from "react";
import { Card, Select, Badge, Slider, Typography } from "antd";
import { StarOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Text } = Typography;

interface HighlightedListingsManagerProps {
  onStrategyChange: (strategy: HighlightStrategy) => void;
  currentStrategy: HighlightStrategy;
}

interface HighlightStrategy {
  highlightRatio: number;
  highlightPositions: "mixed" | "distributed" | "top-bottom";
  maxHighlightedPerPage?: number;
}

const HighlightedListingsManager: React.FC<HighlightedListingsManagerProps> = ({
  onStrategyChange,
  currentStrategy,
}) => {
  const [strategy, setStrategy] = useState<HighlightStrategy>(currentStrategy);

  const strategies = [
    {
      value: "mixed" as const,
      name: "Mixed Strategy",
      description: "Randomly distributes highlighted listings throughout the results"
    },
    {
      value: "distributed" as const,
      name: "Evenly Distributed",
      description: "Spreads highlighted listings evenly across all pages"
    },
    {
      value: "top-bottom" as const,
      name: "Top & Bottom",
      description: "Places highlights at the beginning and end of result sets"
    }
  ];

  const handleStrategyUpdate = (updates: Partial<HighlightStrategy>) => {
    const newStrategy = { ...strategy, ...updates };
    setStrategy(newStrategy);
    onStrategyChange(newStrategy);
  };

  const generatePreview = () => {
    const totalItems = 12;
    const highlightCount = Math.ceil(totalItems * strategy.highlightRatio);
    const preview = Array(totalItems).fill("normal");
    
    let positions: number[] = [];
    
    switch (strategy.highlightPositions) {
      case "mixed": {
        positions = Array.from({ length: highlightCount }, () =>
          Math.floor(Math.random() * totalItems)
        );
        break;
      }
      case "distributed": {
        const step = Math.floor(totalItems / highlightCount);
        positions = Array.from({ length: highlightCount }, (_, i) => i * step);
        break;
      }
      case "top-bottom": {
        const topCount = Math.ceil(highlightCount / 2);
        const bottomCount = highlightCount - topCount;
        positions = [
          ...Array.from({ length: topCount }, (_, i) => i),
          ...Array.from({ length: bottomCount }, (_, i) => totalItems - bottomCount + i)
        ];
        break;
      }
    }

    for (let i = 0; i < Math.min(positions.length, highlightCount); i++) {
      if (positions[i] < totalItems) {
        preview[positions[i]] = "highlighted";
      }
    }

    return preview;
  };

  const previewItems = generatePreview();

  return (
    <Card 
      className="w-full max-w-2xl"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StarOutlined style={{ color: '#faad14' }} />
          <span>Highlighted Listings Strategy</span>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Strategy Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Text strong>Placement Strategy</Text>
          <Select
            value={strategy.highlightPositions}
            onChange={(value: "mixed" | "distributed" | "top-bottom") =>
              handleStrategyUpdate({ highlightPositions: value })
            }
            style={{ width: '100%' }}
          >
            {strategies.map((strat) => (
              <Option key={strat.value} value={strat.value}>
                <div>
                  <div style={{ fontWeight: 500 }}>{strat.name}</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {strat.description}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        {/* Highlight Ratio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Highlight Ratio</Text>
            <Badge count={`${Math.round(strategy.highlightRatio * 100)}%`} showZero />
          </div>
          <Slider
            value={strategy.highlightRatio}
            onChange={(value: number) =>
              handleStrategyUpdate({ highlightRatio: value })
            }
            max={1}
            min={0.1}
            step={0.05}
          />
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Text strong>Preview</Text>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '8px',
            padding: '16px',
            backgroundColor: '#fafafa',
            borderRadius: '8px'
          }}>
            {previewItems.map((type, index) => (
              <div
                key={index}
                style={{
                  width: '60px',
                  height: '40px',
                  borderRadius: '4px',
                  backgroundColor: type === 'highlighted' ? '#faad14' : '#d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: type === 'highlighted' ? 'white' : '#666'
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Golden items represent highlighted listings in the preview
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default HighlightedListingsManager;
