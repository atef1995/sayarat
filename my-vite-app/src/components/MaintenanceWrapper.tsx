import React from "react";
import { useMaintenance } from "../context/MaintenanceProvider";
import MaintenancePage from "./MaintenancePage";
import { Spin } from "antd";

interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

/**
 * Maintenance Wrapper Component
 *
 * Wraps the entire application and shows maintenance page when maintenance mode is active
 * Should be placed high in the component tree, ideally wrapping the main app content
 */
const MaintenanceWrapper: React.FC<MaintenanceWrapperProps> = ({
  children,
}) => {
  const {
    isMaintenanceMode,
    isLoading,
    maintenanceMessage,
    estimatedReturnTime,
  } = useMaintenance();

  // Show loading spinner while checking maintenance status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Show maintenance page if maintenance mode is active
  if (isMaintenanceMode) {
    return (
      <MaintenancePage
        message={maintenanceMessage}
        estimatedReturnTime={estimatedReturnTime}
        contactEmail="support@sayarat.autos"
        autoRefresh={true}
        refreshInterval={30000} // 30 seconds
      />
    );
  }

  // Show normal app content
  return <>{children}</>;
};

export default MaintenanceWrapper;
