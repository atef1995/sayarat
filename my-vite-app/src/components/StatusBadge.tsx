import React from "react";
import { StarOutlined, DashboardOutlined } from "@ant-design/icons";

/**
 * Props for StatusBadge component
 */
interface StatusBadgeProps {
  type: "premium" | "company";
  size?: "mini" | "small" | "medium" | "large";
  showIcon?: boolean;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

/**
 * Props for StatusIndicator - a subtle overlay badge
 */
interface StatusIndicatorProps {
  type: "premium" | "company";
  children: React.ReactNode;
  position?: "top-right" | "top-left" | "above";
  size?: "xs" | "sm";
  className?: string;
}

/**
 * StatusBadge Component
 *
 * A reusable component for displaying premium or company status badges
 * with consistent styling and animations.
 *
 * @param type - The type of badge ('premium' or 'company')
 * @param size - The size of the badge
 * @param showIcon - Whether to show the icon
 * @param showLabel - Whether to show the text label
 * @param animated - Whether to show animations
 * @param className - Additional CSS classes
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  size = "medium",
  showIcon = true,
  showLabel = true,
  animated = true,
  className = "",
}) => {
  const isPremium = type === "premium";
  const isCompany = type === "company"; // Size configurations with modern, smaller styling
  const sizeConfig = {
    mini: {
      text: "text-xs",
      padding: "px-1 py-0.5",
      icon: "text-xs",
      dot: "w-0.5 h-0.5",
    },
    small: {
      text: "text-xs",
      padding: "px-1.5 py-0.5",
      icon: "text-xs",
      dot: "w-0.5 h-0.5",
    },
    medium: {
      text: "text-xs",
      padding: "px-2 py-0.5",
      icon: "text-sm",
      dot: "w-1 h-1",
    },
    large: {
      text: "text-sm",
      padding: "px-2.5 py-1",
      icon: "text-base",
      dot: "w-1.5 h-1.5",
    },
  };
  const config = sizeConfig[size];
  if (isPremium) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 status-badge ${className}`}
      >
        {showLabel && (
          <span
            className={`${config.text} bg-gradient-to-r from-amber-400 to-yellow-500 text-white ${config.padding} rounded-full font-semibold shadow-sm border border-amber-300/30 modern-premium-badge`}
          >
            Premium
          </span>
        )}
        {showIcon && (
          <span className="relative inline-flex">
            <StarOutlined
              className={`text-amber-500 ${config.icon} drop-shadow-sm`}
            />
            {animated && (
              <span
                className={`absolute -top-0.5 -right-0.5 ${config.dot} bg-amber-400 rounded-full modern-dot-pulse`}
              ></span>
            )}
          </span>
        )}
      </span>
    );
  }
  if (isCompany) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 status-badge ${className}`}
      >
        {showLabel && (
          <span
            className={`${config.text} bg-gradient-to-r from-blue-500 to-purple-600 text-white ${config.padding} rounded-full font-semibold shadow-sm modern-company-badge`}
          >
            شركة
          </span>
        )}
        {showIcon && (
          <span className="relative inline-flex">
            <DashboardOutlined
              className={`text-blue-500 ${config.icon} drop-shadow-sm`}
            />
            <span
              className={`absolute -top-1 -right-1 ${
                config.dot
              } bg-blue-400 rounded-full ${animated ? "modern-dot-pulse" : ""}`}
            ></span>
          </span>
        )}
      </span>
    );
  }

  return null;
};

/**
 * FeatureBadge Component
 *
 * A smaller badge for showing specific features like "unlimited listings"
 */
interface FeatureBadgeProps {
  feature: "unlimited" | "company";
  className?: string;
}

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({
  feature,
  className = "",
}) => {
  const configs = {
    unlimited: {
      text: "بلا حدود",
      bgColor: "bg-gradient-to-r from-amber-400 to-yellow-500",
      textColor: "text-white",
      borderColor: "border-amber-300/30",
    },
    company: {
      text: "شركة",
      bgColor: "bg-gradient-to-r from-blue-500 to-purple-600",
      textColor: "text-white",
      borderColor: "border-blue-300/30",
    },
  };

  const config = configs[feature];
  return (
    <span
      className={`text-xs ${config.bgColor} ${config.textColor} ${config.borderColor} px-1.5 py-0.5 rounded-full font-semibold border shadow-sm modern-feature-badge ${className}`}
    >
      {config.text}
    </span>
  );
};

/**
 * StatusIndicator Component
 *
 * A subtle status indicator that overlays or sits above text naturally
 * Perfect for user names and labels where badges shouldn't feel intrusive
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  type,
  children,
  position = "above",
  size = "xs",
  className = "",
}) => {
  const isPremium = type === "premium";
  const isCompany = type === "company";
  const sizeConfig = {
    xs: {
      badge: "w-3 h-3",
      icon: "text-xs",
      text: "text-xs",
      gap: "gap-0.5",
    },
    sm: {
      badge: "w-4 h-4",
      icon: "text-xs",
      text: "text-base",
      gap: "gap-1",
    },
  };

  const config = sizeConfig[size];
  const badgeElement = isPremium ? (
    <div
      className={`${config.badge} bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm status-indicator-badge group p-2
      `}
      title="Premium User"
    >
      <StarOutlined className={`${config.icon} text-white drop-shadow-sm`} />
    </div>
  ) : (
    <div
      className={`${config.badge} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm status-indicator-badge group`}
      title="Company Account"
    >
      <DashboardOutlined
        className={`${config.icon} text-white drop-shadow-sm`}
      />
    </div>
  );

  if (position === "above") {
    return (
      <div
        className={`inline-flex flex-col items-center ${config.gap} ${className}`}
      >
        {badgeElement}
        <div
          className={`${config.text} ${
            isPremium ? "premium-text" : isCompany ? "company-text" : ""
          }`}
        >
          {children}
        </div>
      </div>
    );
  }

  // For top-right or top-left positioning
  const positionClass =
    position === "top-right"
      ? "top-4 right-0 translate-x-1/2 -translate-y-1/2"
      : "top-4 left-0 -translate-x-1/2 -translate-y-1/2";

  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <div className={`absolute ${positionClass} z-10`}>{badgeElement}</div>
    </div>
  );
};

export default StatusBadge;
