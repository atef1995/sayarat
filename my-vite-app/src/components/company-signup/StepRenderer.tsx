import { FormInstance } from "antd";
import CompanyInfoStep from "./CompanyInfoStep";
import AdminInfoStep from "./AdminInfoStep";
import CompletionStep from "./CompletionStep";

/**
 * Step Content Renderer Component
 *
 * RESPONSIBILITIES:
 * - Render appropriate step component based on current step
 * - Pass necessary props to step components
 * - Handle step component switching logic
 *
 * #TODO: Add step transition animations
 * #TODO: Implement step loading states
 * #TODO: Add step validation indicators
 */
interface StepRendererProps {
  currentStep: number;
  form: FormInstance;
}

const StepRenderer: React.FC<StepRendererProps> = ({ currentStep, form }) => {
  switch (currentStep) {
    case 0:
      return <CompanyInfoStep />;
    case 1:
      return <AdminInfoStep form={form} />;
    case 2:
      return <CompletionStep />;
    default:
      return null;
  }
};

export default StepRenderer;
