import { message } from "antd";
import { useNavigate } from "react-router";
import SubscriptionModal from "../SubscriptionModal";

/**
 * Subscription Modal Manager Component
 *
 * RESPONSIBILITIES:
 * - Handle subscription modal display logic
 * - Manage subscription success/failure callbacks
 * - Handle navigation after subscription events
 *
 * #TODO: Add subscription plan recommendation logic
 * #TODO: Implement subscription analytics tracking
 * #TODO: Add subscription retry mechanism
 */
interface SubscriptionModalManagerProps {
  companyName: string;
  showModal: boolean;
  companyCreated: boolean;
  onModalClose: () => void;
}

const SubscriptionModalManager: React.FC<SubscriptionModalManagerProps> = ({
  companyName,
  showModal,
  companyCreated,
  onModalClose,
}) => {
  const navigate = useNavigate();

  /**
   * Handle successful subscription completion
   */
  const handleSubscriptionSuccess = () => {
    onModalClose();
    message.success(
      "تم تفعيل اشتراك الشركة بنجاح! مرحباً بك في منصة Cars Bids"
    );
    navigate("/dashboard");
  };

  /**
   * Handle subscription modal close
   */
  const handleSubscriptionModalClose = () => {
    if (companyCreated) {
      // Company was created but subscription might be incomplete
      message.warning(
        "تم إنشاء حساب الشركة ولكن لم يتم تفعيل الاشتراك. يمكنك تفعيله لاحقاً من إعدادات الحساب"
      );
      navigate("/dashboard");
    } else {
      onModalClose();
    }
  };

  return (
    <SubscriptionModal
      open={showModal}
      onClose={handleSubscriptionModalClose}
      onSubscriptionSuccess={handleSubscriptionSuccess}
      requiredFeature={`اشتراك الشركة - ${companyName || "شركتك"}`}
    />
  );
};

export default SubscriptionModalManager;
