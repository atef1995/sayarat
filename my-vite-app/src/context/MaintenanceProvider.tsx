import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { loadApiConfig } from "../config/apiConfig";

const { apiUrl } = loadApiConfig();

interface MaintenanceState {
  isMaintenanceMode: boolean;
  maintenanceMessage?: string;
  estimatedReturnTime?: Date;
  isLoading: boolean;
  error?: string;
}

interface MaintenanceContextType extends MaintenanceState {
  checkMaintenanceStatus: () => Promise<void>;
  enableMaintenanceMode: (message?: string, returnTime?: Date) => Promise<void>;
  disableMaintenanceMode: () => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(
  undefined
);

/**
 * Maintenance Provider Component
 *
 * Manages maintenance mode state and provides methods to check/control maintenance status
 */
export const MaintenanceProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<MaintenanceState>({
    isMaintenanceMode: false,
    isLoading: true,
    error: undefined,
  });

  // Check maintenance status from backend
  const checkMaintenanceStatus = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

      const response = await fetch(`${apiUrl}/maintenance/status`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          isMaintenanceMode: data.isMaintenanceMode || false,
          maintenanceMessage: data.message,
          estimatedReturnTime: data.estimatedReturnTime
            ? new Date(data.estimatedReturnTime)
            : undefined,
          isLoading: false,
        }));
      } else {
        // If maintenance endpoint doesn't exist, assume no maintenance
        setState((prev) => ({
          ...prev,
          isMaintenanceMode: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.warn("Failed to check maintenance status:", error);
      // On error, assume no maintenance to prevent blocking users
      setState((prev) => ({
        ...prev,
        isMaintenanceMode: false,
        isLoading: false,
        error: "Failed to check maintenance status",
      }));
    }
  };

  // Enable maintenance mode (admin function)
  const enableMaintenanceMode = async (message?: string, returnTime?: Date) => {
    try {
      const response = await fetch(`${apiUrl}/admin/maintenance/enable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message,
          estimatedReturnTime: returnTime?.toISOString(),
        }),
      });

      if (response.ok) {
        await checkMaintenanceStatus();
      } else {
        throw new Error("Failed to enable maintenance mode");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to enable maintenance mode",
      }));
    }
  };

  // Disable maintenance mode (admin function)
  const disableMaintenanceMode = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/maintenance/disable`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        await checkMaintenanceStatus();
      } else {
        throw new Error("Failed to disable maintenance mode");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to disable maintenance mode",
      }));
    }
  };

  // Check maintenance status on mount and periodically
  useEffect(() => {
    checkMaintenanceStatus();

    // Check every 5 minutes
    const interval = setInterval(checkMaintenanceStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const value: MaintenanceContextType = {
    ...state,
    checkMaintenanceStatus,
    enableMaintenanceMode,
    disableMaintenanceMode,
  };

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
};

/**
 * Hook to access maintenance context
 */
export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return context;
};
