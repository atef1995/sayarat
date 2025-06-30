import React, { useEffect } from "react";
import { Form, Upload, Modal, Spin, UploadProps } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { UploadFile } from "antd";

interface ImageUploadFormProps {
  imageList: UploadFile[];
  setImageList: (files: UploadFile[]) => void;
  imageUploading: boolean;
  previewOpen: boolean;
  imageUrl: string;
  beforeUpload: (file: UploadFile) => boolean;
  handleImageChange: UploadProps["onChange"];
  handlePreview: (file: UploadFile) => Promise<void>;
  handleCancel: () => void;
  deleteImage: (file: UploadFile) => Promise<void>;
  customRequest: UploadProps["customRequest"];
}

const ImageUploadForm: React.FC<ImageUploadFormProps> = ({
  imageList,
  setImageList,
  imageUploading,
  previewOpen,
  imageUrl,
  beforeUpload,
  handleImageChange,
  handlePreview,
  handleCancel,
  deleteImage,
  customRequest,
}) => {
  const form = Form.useFormInstance();

  // Sync imageList changes with form field
  useEffect(() => {
    if (form && imageList) {
      form.setFieldsValue({
        image_urls: { fileList: imageList },
      });
    }
  }, [imageList, form]);

  const onChange: UploadProps["onChange"] = (info) => {
    console.log("Upload onChange:", info);

    if (info.fileList.length <= 5) {
      setImageList(info.fileList);
    } else {
      // Keep only the first 5 files
      const limitedList = info.fileList.slice(0, 5);
      setImageList(limitedList);
    }

    if (handleImageChange) {
      handleImageChange(info);
    }
  };
  return (
    <div className="w-full">
      {" "}
      <Form.Item
        name="image_urls"
        label="صور السيارة"
        rules={[{ required: true, message: "الرجاء رفع صور السيارة" }]}
        className="w-full"
        getValueFromEvent={(e) => {
          // Return the file list for the form field
          if (Array.isArray(e)) {
            return { fileList: e };
          }
          return { fileList: e?.fileList || [] };
        }}
      >
        {" "}
        <Upload
          listType="picture-card"
          fileList={imageList}
          onPreview={handlePreview}
          beforeUpload={beforeUpload}
          accept="image/*"
          onChange={onChange}
          onRemove={deleteImage}
          maxCount={5}
          multiple
          customRequest={customRequest}
          className="w-full upload-responsive"
          showUploadList={{
            showPreviewIcon: true,
            showRemoveIcon: true,
            showDownloadIcon: false,
          }}
        >
          <div className="flex flex-col items-center justify-center p-2 sm:p-4">
            {imageUploading ? <Spin size="small" /> : <UploadOutlined />}
            <div className="mt-1 sm:mt-2 text-xs sm:text-sm">رفع صورة</div>
          </div>
        </Upload>
      </Form.Item>{" "}
      <Modal
        open={previewOpen}
        onCancel={handleCancel}
        onOk={handleCancel}
        width="90%"
        style={{ maxWidth: "600px" }}
        centered
        footer={null}
      >
        <img
          alt="preview"
          src={imageUrl}
          className="w-full h-auto max-h-[70vh] object-contain"
        />
      </Modal>
    </div>
  );
};

export default ImageUploadForm;
