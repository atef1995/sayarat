import React, { useState, useCallback } from "react";
import { Modal, Slider } from "antd";
import Cropper, { Area, Point } from "react-easy-crop";
import "./CropModal.css";

interface CropModalProps {
  open: boolean;
  imageUrl: string;
  aspect?: number;
  onCancel: () => void;
  onCrop: (croppedBlob: Blob, croppedUrl: string) => void;
}

const getCroppedImg = (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg");
    };
    image.onerror = (error) => reject(error);
  });
};

const CropModal: React.FC<CropModalProps> = ({
  open,
  imageUrl,
  aspect = 4 / 1,
  onCancel,
  onCrop,
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleOk = async () => {
    if (croppedAreaPixels && imageUrl) {
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
      const croppedUrl = URL.createObjectURL(croppedBlob);
      onCrop(croppedBlob, croppedUrl);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="قص"
      cancelText="إلغاء"
      width={600}
      destroyOnClose
    >
      <div className="cropper-container">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="cropper-zoom-slider">
        <span>تكبير:</span>
        <Slider min={1} max={3} step={0.01} value={zoom} onChange={setZoom} />
      </div>
    </Modal>
  );
};

export default CropModal;
