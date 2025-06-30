import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { SubscriptionFeatures } from "../../types/subscription.types";

interface FeatureItemProps {
  isEnabled: boolean;
  label: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ isEnabled, label }) => (
  <div className="flex items-center gap-2">
    {isEnabled ? (
      <CheckCircleOutlined className="text-green-500" />
    ) : (
      <CloseCircleOutlined className="text-red-500" />
    )}
    <span className="text-sm">{label}</span>
  </div>
);

interface FeaturesListProps {
  features: SubscriptionFeatures;
}

const FeaturesList: React.FC<FeaturesListProps> = ({ features }) => {
  const featureList = [
    { key: "aiCarAnalysis", label: "تحليل السيارات بالذكاء الاصطناعي" },
    { key: "listingHighlights", label: "تمييز الإعلانات" },
    { key: "prioritySupport", label: "دعم فني مميز" },
    { key: "unlimitedListings", label: "إعلانات غير محدودة" },
    { key: "advancedAnalytics", label: "إحصائيات متقدمة" },
  ];

  return (
    <div className="space-y-2">
      {featureList.map(({ key, label }) => (
        <FeatureItem
          key={key}
          isEnabled={features[key as keyof SubscriptionFeatures] as boolean}
          label={label}
        />
      ))}
      {features.customBranding && (
        <FeatureItem isEnabled={true} label="علامة تجارية مخصصة" />
      )}
      {features.teamMembers && features.teamMembers > 0 && (
        <FeatureItem
          isEnabled={true}
          label={`أعضاء الفريق: ${features.teamMembers}`}
        />
      )}
    </div>
  );
};

export default FeaturesList;
