interface MessageIconProps {
  count: number;
}

const MessageIcon = ({ count }: MessageIconProps) => {
  return (
    <span className="border border-t-0 border-b-0 border-red-600 rounded-full px-1 bg-red-600 text-center text-white text-xs absolute top-0 right-0">
      {count}
    </span>
  );
};

export default MessageIcon;
