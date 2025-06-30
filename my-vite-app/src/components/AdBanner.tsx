import { Button } from "antd";

interface AdBannerProps {
  adImage: string;
  adUrl: string;
  altText?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({
  adImage,
  adUrl,
  altText = "Advertisement",
}) => {
  return (
    <a
      href={adUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="h-40 max-h-40 w-full mx-auto my-4 p-6 shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      <img src={adImage} alt={altText} className="w-full h-full object-cover" />
      <Button className="relative w-20 -top-20 right-4 bg-black/70  backdrop-blur-lg">
        قراءة المزيد
      </Button>
    </a>
  );
};

export default AdBanner;
