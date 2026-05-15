import React, { Suspense } from "react";
import { Spin } from "antd";

const RouteLoadingFallback: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-96 p-8">
      <Spin size="large" />
    </div>
  );
};

interface LazyRouteProps {
  children: React.ReactNode;
}

const LazyRoute: React.FC<LazyRouteProps> = ({ children }) => {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>;
};

export default LazyRoute;
