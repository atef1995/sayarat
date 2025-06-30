import { useState, useEffect } from "react";
import { Form, message, UploadFile, SelectProps } from "antd";
import { CarInfo, CreateListing as cl } from "../types";
import { fetchCarMakes, fetchCarModels } from "../api/fetchCars";
import { getIpAddress } from "../api/fetchUserData";
import { createStandardDate } from "../helper/time";

interface UseListingFormProps {
  initialValues?: CarInfo;
}

export const useListingForm = ({ initialValues }: UseListingFormProps = {}) => {
  const [form] = Form.useForm();
  const values = Form.useWatch([], form);

  // State management
  const [loading, setLoading] = useState(false);
  const [imageList, setImageList] = useState<UploadFile[]>([]);
  const [carMakes, setCarMakes] = useState<SelectProps["options"]>([]);
  const [carModels, setCarModels] = useState<SelectProps["options"]>([]);
  const [currency, setCurrency] = useState("usd");
  const [userIp, setUserIp] = useState("");
  const [initialImagesUrls, setInitialImagesUrls] = useState<string[]>([]);
  // Initialize form with existing values
  useEffect(() => {
    console.log("Initial values for form:", initialValues);

    if (!initialValues) return;

    const initialImages = initialValues.image_urls?.map(
      (url) =>
        ({
          uid: url,
          name: url.split("/").pop() || "image",
          status: "done",
          url,
        } as UploadFile)
    );

    setInitialImagesUrls(initialValues.image_urls?.map((url) => url));
    setImageList(initialImages || []);

    form.setFieldsValue({
      ...initialValues,
      image_urls: { fileList: initialImages || [] },
    });
  }, [initialValues, form]);

  // Fetch car makes on component mount
  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const makes = await fetchCarMakes();
        if (!Array.isArray(makes)) {
          console.error("Invalid data format for car makes:", makes);
          message.error("فشل في تحميل ماركات السيارات");
          return;
        }
        setCarMakes(makes);
      } catch (error) {
        console.error("Error fetching car makes:", error);
        message.error("فشل في تحميل ماركات السيارات");
      }
    };

    const fetchUserIP = async () => {
      try {
        const data = await getIpAddress();
        setUserIp(data.ip);
      } catch (error) {
        console.error("Error fetching IP:", error);
      }
    };

    fetchMakes();
    fetchUserIP();
  }, []);

  // Fetch car models when make changes
  useEffect(() => {
    if (!values?.make) return;

    const fetchModels = async () => {
      try {
        const data = await fetchCarModels(values.make);
        if (!Array.isArray(data)) {
          console.error("Invalid data format for car models:", data);
          message.error("فشل في تحميل موديلات السيارة");
          return;
        }

        setCarModels(
          data.map((model) => ({
            label: model,
            value: model,
          }))
        );
      } catch (error) {
        console.error("Error fetching car models:", error);
        message.error("فشل في تحميل موديلات السيارة");
      }
    };

    fetchModels();
  }, [values?.make]);
  // Create form data for submission
  const createFormData = (formValues: cl, clientSecret?: string): FormData => {
    const { image_urls } = formValues;
    const { utc, timezone } = createStandardDate();

    const formData = new FormData();

    // Append form fields (excluding image_urls which is handled separately)
    for (const key in formValues) {
      if (
        Object.prototype.hasOwnProperty.call(formValues, key) &&
        key !== "image_urls"
      ) {
        const value = formValues[key as keyof typeof formValues];
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      }
    }

    // Append additional data
    formData.append("currency", currency);
    formData.append("userIp", userIp);
    formData.append("createdAt", utc);
    formData.append("timezone", timezone);
    formData.append("clientSecret", clientSecret || "");

    console.log("Image URLs in createFormData:", image_urls);

    // Handle image files - check both the form structure and current imageList
    const filesToProcess = image_urls?.fileList || imageList;

    filesToProcess?.forEach((file: UploadFile) => {
      if (file.originFileObj) {
        formData.append("images", file.originFileObj);
      } else if (file.url && !file.url.startsWith("data:")) {
        // Only append URL if it's not a data URL (preview)
        formData.append("existingImages", file.url);
      }
    });

    // Handle initial images for updates
    if (initialValues) {
      formData.append("initialImagesUrls", JSON.stringify(initialImagesUrls));
    }

    return formData;
  };
  const resetForm = () => {
    form.resetFields();
    setImageList([]);
    setInitialImagesUrls([]);
    // Also reset the form field specifically
    form.setFieldsValue({
      image_urls: { fileList: [] },
    });
  };

  return {
    form,
    values,
    loading,
    setLoading,
    imageList,
    setImageList,
    carMakes,
    carModels,
    setCarModels,
    currency,
    setCurrency,
    userIp,
    initialImagesUrls,
    setInitialImagesUrls,
    createFormData,
    resetForm,
  };
};
