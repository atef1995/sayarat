import { Spin, Typography } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface LoadingStateProps {
  message?: string;
  size?: "small" | "default" | "large";
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "جاري التحميل...",
  size = "default",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 min-h-[200px]">
      <Spin
        indicator={
          <LoadingOutlined
            style={{
              fontSize: size === "large" ? 48 : size === "small" ? 16 : 24,
            }}
            spin
          />
        }
        size={size}
      />
      <Text className="mt-4 text-gray-600">{message}</Text>
    </div>
  );
};

export default LoadingState;
