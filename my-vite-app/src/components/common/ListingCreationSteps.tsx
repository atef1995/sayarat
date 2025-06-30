import React from "react";
import { Steps } from "antd";
import {
  FormOutlined,
  SafetyOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { ListingCreationStep } from "../../types/listingTypes";

const { Step } = Steps;

interface ListingCreationStepsProps {
  currentStep: ListingCreationStep;
  isLoading: boolean;
  hasPayment: boolean;
  className?: string;
}

const stepConfig = {
  [ListingCreationStep.FORM_VALIDATION]: {
    title: "التحقق من النموذج",
    icon: <FormOutlined />,
    description: "التحقق من صحة البيانات المدخلة",
  },
  [ListingCreationStep.BACKEND_VALIDATION]: {
    title: "التحقق من الخادم",
    icon: <SafetyOutlined />,
    description: "التحقق من صحة البيانات مع الخادم",
  },
  [ListingCreationStep.PAYMENT_PROCESSING]: {
    title: "معالجة الدفع",
    icon: <CreditCardOutlined />,
    description: "معالجة عملية الدفع",
  },
  [ListingCreationStep.SUBMISSION]: {
    title: "إنشاء الإعلان",
    icon: <CheckCircleOutlined />,
    description: "إنشاء الإعلان النهائي",
  },
  [ListingCreationStep.SUCCESS]: {
    title: "تم بنجاح",
    icon: <CheckCircleOutlined />,
    description: "تم إنشاء الإعلان بنجاح",
  },
};

export const ListingCreationSteps: React.FC<ListingCreationStepsProps> = ({
  currentStep,
  isLoading,
  hasPayment,
  className = "",
}) => {
  const steps = [
    ListingCreationStep.FORM_VALIDATION,
    ListingCreationStep.BACKEND_VALIDATION,
    ...(hasPayment ? [ListingCreationStep.PAYMENT_PROCESSING] : []),
    ListingCreationStep.SUBMISSION,
  ];

  const getCurrentStepIndex = () => {
    if (currentStep === ListingCreationStep.SUCCESS) {
      return steps.length;
    }
    return steps.indexOf(currentStep);
  };

  const getStepStatus = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();

    if (currentStep === ListingCreationStep.SUCCESS) {
      return "finish";
    }

    if (stepIndex < currentIndex) {
      return "finish";
    }

    if (stepIndex === currentIndex) {
      return isLoading ? "process" : "process";
    }

    return "wait";
  };

  const getStepIcon = (step: ListingCreationStep, stepIndex: number) => {
    const config = stepConfig[step];
    const currentIndex = getCurrentStepIndex();

    if (stepIndex === currentIndex && isLoading) {
      return <LoadingOutlined />;
    }

    return config.icon;
  };

  return (
    <div className={`w-full ${className}`}>
      <Steps
        current={getCurrentStepIndex()}
        size="small"
        direction="horizontal"
        className="mb-6"
      >
        {steps.map((step, index) => {
          const config = stepConfig[step];
          return (
            <Step
              key={step}
              title={config.title}
              description={config.description}
              status={getStepStatus(index)}
              icon={getStepIcon(step, index)}
            />
          );
        })}
      </Steps>

      {currentStep === ListingCreationStep.SUCCESS && (
        <div className="text-center py-4">
          <CheckCircleOutlined className="text-4xl text-green-500 mb-2" />
          <h3 className="text-lg font-semibold text-green-700">
            تم إنشاء الإعلان بنجاح!
          </h3>
        </div>
      )}
    </div>
  );
};
