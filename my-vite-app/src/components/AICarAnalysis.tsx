import React, { useState } from "react";
import {
  Button,
  Upload,
  message,
  Card,
  Typography,
  Spin,
  Alert,
  InputNumber,
  Space,
  Divider,
} from "antd";
import {
  CameraOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import type { FormInstance, UploadFile } from "antd";
import type { RcFile } from "antd/es/upload/interface";
import {
  analyzeCarImage,
  validateImageFile,
  type CarAnalysisResult,
} from "../services/aiCarAnalysis";
import { useSubscription } from "../hooks/useSubscription";
import SubscriptionModal from "./SubscriptionModal";

const { Text, Title } = Typography;

interface AICarAnalysisProps {
  form: FormInstance;
  onAnalysisComplete?: (data: CarAnalysisResult) => void;
  setImageList?: (imageList: UploadFile[]) => void;
}

const AICarAnalysis: React.FC<AICarAnalysisProps> = ({
  form,
  onAnalysisComplete,
  setImageList,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<CarAnalysisResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [mileage, setMileage] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const { canAccessAI, isPremium, isCompany, refresh } = useSubscription();

  // Generate seller-focused title based on car details
  const generateSellerTitle = (data: CarAnalysisResult): string => {
    const parts = [];

    if (data.make) parts.push(data.make);
    if (data.model) parts.push(data.model);
    if (data.year) parts.push(data.year);

    // Add condition descriptor for seller appeal
    if (data.condition) {
      const conditionMap: Record<string, string> = {
        excellent: "ممتازة",
        good: "جيدة",
        fair: "مقبولة",
        poor: "تحتاج صيانة",
      };
      const conditionText =
        conditionMap[data.condition.toLowerCase()] || data.condition;
      parts.push(`- حالة ${conditionText}`);
    }

    // Add attractive selling points
    const sellingPoints = [];
    if (data.transmission === "اوتوماتيك") sellingPoints.push("أوتوماتيك");
    if (data.fuelType === "هايبرد") sellingPoints.push("هايبرد اقتصادية");
    if (data.bodyType === "جبلية") sellingPoints.push("SUV");

    if (sellingPoints.length > 0) {
      parts.push(`(${sellingPoints.join(", ")})`);
    }

    return parts.length > 0 ? parts.join(" ") : "سيارة للبيع";
  };
  // Generate seller-focused description
  const generateSellerDescription = (data: CarAnalysisResult): string => {
    let description = "";

    // Opening with car identification
    if (data.make && data.model && data.year) {
      description += `للبيع ${data.make} ${data.model} موديل ${data.year}.\n\n`;
    }

    // Highlight key selling points from AI analysis
    if (data.sellingPoints && data.sellingPoints.length > 0) {
      description += `المميزات الرئيسية:\n${data.sellingPoints
        .map((point) => `• ${point}`)
        .join("\n")}\n\n`;
    } // Highlight key features
    const features = [];
    if (data.color) features.push(`اللون: ${data.color}`);
    if (data.transmission) features.push(`ناقل الحركة: ${data.transmission}`);
    if (data.fuelType) features.push(`نوع الوقود: ${data.fuelType}`);
    if (data.bodyType) features.push(`نوع الهيكل: ${data.bodyType}`);

    // Engine specifications
    if (data.hp) features.push(`قوة المحرك: ${data.hp} حصان`);
    if (data.engine_cylinders)
      features.push(`عدد الاسطوانات: ${data.engine_cylinders}`);
    if (data.engine_liters)
      features.push(`سعة المحرك: ${data.engine_liters} لتر`);

    if (features.length > 0) {
      description += `المواصفات التقنية:\n${features
        .map((f) => `• ${f}`)
        .join("\n")}\n\n`;
    }

    // Add condition and selling points
    if (data.condition) {
      const conditionDescriptions: Record<string, string> = {
        excellent:
          "السيارة في حالة ممتازة، تم الاعتناء بها جيداً وصيانتها بانتظام",
        good: "السيارة في حالة جيدة جداً، صيانة منتظمة وجاهزة للاستخدام",
        fair: "السيارة في حالة مقبولة، قد تحتاج بعض أعمال الصيانة البسيطة",
        poor: "السيارة تحتاج إلى أعمال صيانة، مناسبة للاستثمار أو قطع الغيار",
      };

      const conditionText =
        conditionDescriptions[data.condition.toLowerCase()] ||
        `الحالة العامة: ${data.condition}`;
      description += `حالة السيارة:\n${conditionText}\n\n`;
    }

    // Add mileage if provided
    if (data.mileageConsidered) {
      description += `المسافة المقطوعة: ${data.mileageConsidered.toLocaleString(
        "ar-SA"
      )} كيلومتر\n\n`;
    }

    // Pricing information with negotiation appeal
    if (data.estimatedPrice) {
      description += `السعر المطلوب: ${data.estimatedPrice.toLocaleString(
        "ar-SA"
      )} دولار\n`;
      description += `💰 السعر قابل للتفاوض للجادين!\n\n`;
    }

    // Add original AI description if available
    if (data.description) {
      description += `وصف مفصل:\n${data.description}\n\n`;
    }

    // Enhanced seller call to action
    description += `🚗 السيارة متاحة للمعاينة والفحص في أي وقت\n`;
    description += `📞 للاستفسار والتواصل، يرجى الاتصال أو إرسال رسالة\n`;
    description += `✅ جميع الأوراق سليمة ومتوفرة\n`;
    description += `🔄 إمكانية التبديل حسب الاتفاق\n\n`;

    // Hashtags for better visibility
    const hashtags = ["#تحليل_ذكي", `#${data.make || "سيارة"}_للبيع`];
    if (data.bodyType === "جبلية") hashtags.push("#SUV_للبيع");
    if (data.transmission === "اوتوماتيك") hashtags.push("#اوتوماتيك");
    if (data.fuelType === "هايبرد") hashtags.push("#هايبرد_اقتصادية");

    description += hashtags.join(" ");

    return description.trim();
  };
  const handleImageUpload = async (file: File) => {
    // Check if user has access to AI features
    if (!canAccessAI()) {
      setShowSubscriptionModal(true);
      return false;
    }

    try {
      // Validate the image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        message.error(validation.error);
        return false;
      }

      // Store the uploaded image file for later use in form
      setUploadedImageFile(file);

      setAnalyzing(true);
      setShowResult(false);

      // Analyze the image with mileage if provided
      const result = await analyzeCarImage(file, mileage || undefined);

      if (result.success && result.data) {
        // Generate enhanced title and description
        const enhancedData = {
          ...result.data,
          generatedTitle: generateSellerTitle(result.data),
          enhancedDescription: generateSellerDescription(result.data),
        };

        setAnalysisResult(enhancedData);
        setShowResult(true);
        setWarnings(result.warnings || []);
        message.success("تم تحليل الصورة بنجاح!");

        // Call the completion callback with enhanced data
        onAnalysisComplete?.(enhancedData);
      } else {
        message.error(result.error || "فشل في تحليل الصورة");
      }
    } catch (error) {
      console.error("Error in image analysis:", error);
      message.error("حدث خطأ أثناء تحليل الصورة");
    } finally {
      setAnalyzing(false);
    }

    return false; // Prevent default upload behavior
  };
  const handleSubscriptionSuccess = () => {
    refresh(); // Refresh subscription status
    message.success(
      "تم تفعيل الاشتراك بنجاح! يمكنك الآن استخدام خدمة التحليل الذكي."
    );
  };
  const fillFormWithAIData = () => {
    if (!analysisResult) return;

    console.log("Filling form with AI data:", {
      hasUploadedImage: !!uploadedImageFile,
      imageName: uploadedImageFile?.name,
      imageSize: uploadedImageFile?.size,
    });

    // Map AI results to form fields
    const formValues: Record<string, string | number | File[]> = {}; // Basic car information
    if (analysisResult.make) formValues.make = analysisResult.make;
    if (analysisResult.model) formValues.model = analysisResult.model;
    if (analysisResult.year) formValues.year = parseInt(analysisResult.year);
    if (analysisResult.color) formValues.color = analysisResult.color;
    if (analysisResult.bodyType) formValues.car_type = analysisResult.bodyType;
    if (analysisResult.fuelType) formValues.fuel = analysisResult.fuelType;
    if (analysisResult.transmission)
      formValues.transmission = analysisResult.transmission;
    if (analysisResult.condition)
      formValues.condition = analysisResult.condition;
    if (analysisResult.estimatedPrice)
      formValues.price = analysisResult.estimatedPrice;

    // Engine specifications
    if (analysisResult.hp) formValues.hp = analysisResult.hp;
    if (analysisResult.engine_cylinders)
      formValues.engine_cylinders = analysisResult.engine_cylinders;
    if (analysisResult.engine_liters)
      formValues.engine_liters = analysisResult.engine_liters;

    // Enhanced content generated by AI
    if (analysisResult.generatedTitle) {
      formValues.title = analysisResult.generatedTitle;
    }
    if (analysisResult.enhancedDescription) {
      formValues.description = analysisResult.enhancedDescription;
    }

    // Add mileage if it was considered in analysis
    if (analysisResult.mileageConsidered) {
      formValues.mileage = analysisResult.mileageConsidered;
    }

    // Set form values
    form.setFieldsValue(formValues); // Add the uploaded image to the form if it exists
    if (uploadedImageFile) {
      console.log("Adding image to form:", uploadedImageFile.name);

      // Create a file list for the image upload component with proper UploadFile type
      const fileList: UploadFile[] = [
        {
          uid: "-1",
          name: uploadedImageFile.name,
          status: "done",
          originFileObj: uploadedImageFile as RcFile, // Type assertion for RcFile compatibility
          url: URL.createObjectURL(uploadedImageFile),
        },
      ];

      // Set the images field with the correct structure expected by the form
      form.setFieldValue("image_urls", { fileList });
      console.log("Set image_urls field value:", { fileList });

      // Also update the imageList state if setImageList is provided
      if (setImageList) {
        setImageList(fileList);
        console.log("Updated imageList state with uploaded image");
      }

      // #TODO: Consider revoke object URL after form submission to prevent memory leaks
    }

    message.success("تم تعبئة النموذج بالبيانات المستخرجة والصورة!");
    setShowResult(false);
  };
  return (
    <>
      <Card className="mb-6 border-2 border-dashed border-yellow-500">
        {" "}
        <div className="text-center">
          <RobotOutlined className="text-3xl text-blue-600 mb-2" />{" "}
          <Title level={4} className="mb-2">
            🤖 المساعد الذكي لتحليل المركبات
            <span className="premium-badge ml-2" data-premium="true">
              <CrownOutlined className="text-yellow-500" />
              <span className="text-xs text-yellow-600">Premium</span>
            </span>
            {isPremium() && <CrownOutlined className="text-yellow-500 ml-1" />}
            {isCompany() && (
              <span className="text-purple-600 ml-2">(معرض)</span>
            )}
          </Title>
          {!canAccessAI() ? (
            <>
              {" "}
              <Alert
                message="خدمة مميزة"
                description="هذه الخدمة متوفرة للأعضاء المميزين ومعارض السيارات فقط. اشترك الآن للاستفادة من خدمة التحليل الذكي."
                type="warning"
                icon={<CrownOutlined />}
                className="mb-4"
              />{" "}
              <Button
                type="primary"
                size="large"
                icon={<CrownOutlined />}
                onClick={() => setShowSubscriptionModal(true)}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 border-0"
              >
                الترقية للعضوية المميزة
              </Button>
            </>
          ) : (
            <>
              {" "}
              <Text type="secondary" className="mb-4 block">
                ارفع صورة للمركبة مع إدخال عدد الكيلومترات وسيقوم النظام الذكي
                بتعبئة البيانات تلقائياً
              </Text>
              {/* Mileage Input */}
              <div className="mb-4">
                <Space direction="vertical" className="w-full">
                  {" "}
                  <Text>
                    عدد الكيلومترات المقطوعة - اختياري لتقدير أدق للسعر:
                  </Text>
                  <InputNumber
                    placeholder="مثال: 50000"
                    value={mileage}
                    onChange={(value) => setMileage(value)}
                    min={0}
                    max={500000}
                    step={1000}
                    className="w-full sm:w-48"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) =>
                      Number(value!.replace(/\$\s?|(,*)/g, ""))
                    }
                  />
                </Space>
              </div>
              {!analyzing && !showResult && (
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={handleImageUpload}
                  className="w-full"
                >
                  <Button
                    type="primary"
                    icon={<CameraOutlined />}
                    size="large"
                    className="w-full sm:w-auto"
                  >
                    رفع صورة المركبة للتحليل
                  </Button>
                </Upload>
              )}
              {analyzing && (
                <div className="py-8">
                  <Spin size="large" />
                  <div className="mt-4">
                    <Text>جاري تحليل الصورة بالنظام الذكي...</Text>
                  </div>
                </div>
              )}
              {showResult && analysisResult && (
                <div className="mt-4">
                  {/* Warnings */}
                  {warnings.length > 0 && (
                    <Alert
                      message="تحذيرات"
                      description={
                        <ul className="text-right">
                          {warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      }
                      type="warning"
                      icon={<WarningOutlined />}
                      className="mb-4"
                    />
                  )}
                  <Alert
                    message="تم التحليل بنجاح!"
                    description={
                      <div className="text-right mt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                          {" "}
                          {analysisResult.make && (
                            <div>
                              <strong>الماركة:</strong> {analysisResult.make}
                            </div>
                          )}
                          {analysisResult.model && (
                            <div>
                              <strong>الطراز:</strong> {analysisResult.model}
                            </div>
                          )}
                          {analysisResult.year && (
                            <div>
                              <strong>موديل:</strong> {analysisResult.year}
                            </div>
                          )}
                          {analysisResult.color && (
                            <div>
                              <strong>اللون:</strong> {analysisResult.color}
                            </div>
                          )}
                          {analysisResult.bodyType && (
                            <div>
                              <strong>نوع الهيكل:</strong>{" "}
                              {analysisResult.bodyType}
                            </div>
                          )}
                          {analysisResult.fuelType && (
                            <div>
                              <strong>نوع الوقود:</strong>{" "}
                              {analysisResult.fuelType}
                            </div>
                          )}{" "}
                          {analysisResult.transmission && (
                            <div>
                              <strong>ناقل الحركة:</strong>{" "}
                              {analysisResult.transmission}
                            </div>
                          )}
                          {analysisResult.hp && (
                            <div>
                              <strong>قوة المحرك:</strong> {analysisResult.hp}{" "}
                              حصان
                            </div>
                          )}
                          {analysisResult.engine_cylinders && (
                            <div>
                              <strong>عدد الاسطوانات:</strong>{" "}
                              {analysisResult.engine_cylinders}
                            </div>
                          )}
                          {analysisResult.engine_liters && (
                            <div>
                              <strong>سعة المحرك:</strong>{" "}
                              {analysisResult.engine_liters} لتر
                            </div>
                          )}
                          {analysisResult.condition && (
                            <div>
                              <strong>حالة المركبة:</strong>{" "}
                              {analysisResult.condition}
                            </div>
                          )}
                        </div>
                        {/* Selling Points Section */}
                        {analysisResult.sellingPoints &&
                          analysisResult.sellingPoints.length > 0 && (
                            <>
                              <Divider />
                              <div className="bg-transparent/20 p-3 rounded border-2 border-blue-200/50">
                                <strong className="text-blue-800">
                                  نقاط البيع الرئيسية:
                                </strong>
                                <ul className="mt-2 text-sm">
                                  {analysisResult.sellingPoints.map(
                                    (point, index) => (
                                      <li
                                        key={index}
                                        className="flex items-start mr-2"
                                      >
                                        <span className="text-blue-600 ml-1">
                                          •
                                        </span>
                                        {point}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            </>
                          )}
                        {/* Generated Title Preview */}
                        {analysisResult.generatedTitle && (
                          <>
                            <Divider />
                            <div className="bg-transparent/20 border border-yellow-50/20 p-3 rounded">
                              <strong className="text-yellow-800">
                                العنوان المقترح:
                              </strong>
                              <div className="mt-1 text-sm font-medium">
                                {analysisResult.generatedTitle}
                              </div>
                            </div>
                          </>
                        )}
                        {/* Price Information */}
                        {analysisResult.estimatedPrice && <Divider />}
                        {analysisResult.estimatedPrice && (
                          <div className="text-center bg-transparent/20 p-3 rounded">
                            <DollarOutlined className="text-green-600 mr-2" />{" "}
                            <strong>
                              السعر التقديري: $
                              {analysisResult.estimatedPrice?.toLocaleString()}
                            </strong>
                            {analysisResult.mileageConsidered && (
                              <div className="text-xs mt-1">
                                (مع احتساب الكيلومترات:{" "}
                                {analysisResult.mileageConsidered?.toLocaleString()}{" "}
                                كم)
                              </div>
                            )}
                            {analysisResult.originalEstimatedPrice &&
                              analysisResult.originalEstimatedPrice !==
                                analysisResult.estimatedPrice && (
                                <div className="text-xs">
                                  السعر الأساسي: $
                                  {analysisResult.originalEstimatedPrice?.toLocaleString()}
                                </div>
                              )}
                          </div>
                        )}{" "}
                        {/* Database Validation Status */}
                        {analysisResult.databaseValidation && (
                          <div className="mt-3 text-xs">
                            <div
                              className={
                                analysisResult.databaseValidation.makeExists
                                  ? "text-green-600"
                                  : "text-orange-600"
                              }
                            >
                              {analysisResult.databaseValidation.makeExists
                                ? "✓"
                                : "⚠"}{" "}
                              الماركة مسجلة في النظام
                            </div>
                            <div
                              className={
                                analysisResult.databaseValidation.modelExists
                                  ? "text-green-600"
                                  : "text-orange-600"
                              }
                            >
                              {analysisResult.databaseValidation.modelExists
                                ? "✓"
                                : "⚠"}{" "}
                              الطراز مسجل في النظام
                            </div>
                          </div>
                        )}{" "}
                        <div className="mt-3 text-center">
                          <Text type="secondary">
                            دقة التحليل: {analysisResult.confidence}%
                          </Text>
                        </div>
                      </div>
                    }
                    type="success"
                    icon={<CheckCircleOutlined />}
                    className="text-right"
                  />{" "}
                  <div className="mt-4 space-y-3">
                    {/* Enhanced Description Preview */}
                    {analysisResult.enhancedDescription && (
                      <div className="p-4 rounded border">
                        <strong className="block mb-2">
                          معاينة الوصف المحسن:
                        </strong>
                        <div className="text-sm whitespace-pre-line max-h-40 overflow-y-auto">
                          {analysisResult.enhancedDescription}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button
                        type="primary"
                        size="large"
                        onClick={fillFormWithAIData}
                        icon={<CheckCircleOutlined />}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        تعبئة النموذج + الصورة
                      </Button>{" "}
                      <Button
                        size="large"
                        onClick={() => {
                          setShowResult(false);
                          setUploadedImageFile(null); // Clear uploaded image for new analysis
                        }}
                      >
                        تحليل صورة أخرى
                      </Button>
                    </div>

                    {/* #TODO: Add functionality to save analysis results for later use */}
                    <div className="text-center">
                      <Text type="secondary" className="text-xs">
                        💡 سيتم ملء جميع الحقول تلقائياً مع الصورة والعنوان
                        والوصف المحسن
                      </Text>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>{" "}
      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        requiredFeature="خدمة التحليل الذكي للمركبات"
      />
    </>
  );
};

export default AICarAnalysis;
