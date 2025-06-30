import { useState } from "react";
import { message, UploadFile, UploadProps } from "antd";
import type { UploadChangeParam } from "antd/es/upload";
import { CarInfo } from "../types";
import { loadApiConfig } from "../config/apiConfig";

interface UseImageHandlerProps {
  initialValues?: CarInfo;
  setInitialImagesUrls: (
    urls: string[] | ((prev: string[]) => string[])
  ) => void;
}

export const useImageHandler = ({
  initialValues,
  setInitialImagesUrls,
}: UseImageHandlerProps) => {
  const [imageUploading, setImageUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const beforeUpload = (file: UploadFile) => {
    setImageUploading(true);
    const allowedImgTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/bmp",
    ];
    const isImage = allowedImgTypes.indexOf(file.type as string) >= 0;

    if (!isImage) {
      message.error(`(.jpeg .jpg .png .gif .bmp) يمكنك رفع ملفات الصور فقط!`);
    }
    const isLt2M = file.size && file.size / 1024 / 1024 < 3;
    if (!isLt2M) {
      message.error("يجب أن يكون حجم الصورة أقل من 2 ميجابايت!");
    }
    setImageUploading(false);
    return isImage && isLt2M ? true : false;
  };

  const handleImageChange: UploadProps["onChange"] = ({
    fileList: newFileList,
  }: UploadChangeParam) => {
    if (newFileList.length > 5) {
      message.error("لا يمكن رفع أكثر من 5 صور");
      return;
    }
    // This function now properly handles the onChange event
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as Blob);
        reader.onload = () => resolve(reader.result as string);
      });
    }

    setImageUrl(file.url || file.preview || "");
    setPreviewOpen(true);
  };

  const handleCancel = () => setPreviewOpen(false);

  const deleteImage = async (file: UploadFile) => {
    if (initialValues) {
      const { apiUrl } = loadApiConfig();
      try {
        const response = await fetch(
          `${apiUrl}/api/delete-image/${initialValues.id}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl: file.url }),
          }
        );

        if (!response.ok) {
          throw new Error("error deleting");
        }

        setInitialImagesUrls((prev) => prev.filter((url) => url !== file.url));
        message.success("حذفت بنجاح");
      } catch (error) {
        console.error("Error deleting image:", error);
        message.error("فشل في حذف الصورة");
      }
    }
  };
  const customRequest: UploadProps["customRequest"] = ({
    file,
    onSuccess,
    onError,
  }) => {
    setImageUploading(true);

    try {
      // Create a preview URL for the file
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const result = fileReader.result as string;
        const fileObj = file as File & { uid?: string };

        // Create a file object with preview URL
        const fileWithPreview = {
          uid: fileObj.uid || Date.now().toString(),
          name: fileObj.name || "image",
          url: result, // Set the data URL for preview
          status: "done" as const,
          originFileObj: file as File,
          thumbUrl: result, // Add thumbnail for better preview
        };

        setTimeout(() => {
          if (onSuccess) {
            onSuccess(fileWithPreview);
          }
          setImageUploading(false);
        }, 100);
      };

      fileReader.onerror = () => {
        if (onError) {
          onError(new Error("Failed to read file"));
        }
        setImageUploading(false);
      };

      fileReader.readAsDataURL(file as Blob);
    } catch (error) {
      console.error("Error in customRequest:", error);
      if (onError) {
        onError(new Error("Failed to process file"));
      }
      setImageUploading(false);
    }
  };

  return {
    imageUploading,
    previewOpen,
    imageUrl,
    beforeUpload,
    handleImageChange,
    handlePreview,
    handleCancel,
    deleteImage,
    customRequest,
  };
};
