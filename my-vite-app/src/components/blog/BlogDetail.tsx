import React, { useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Card,
  Typography,
  Tag,
  Avatar,
  Button,
  Divider,
  Image,
  Spin,
  message,
  BackTop,
} from "antd";
import {
  EyeOutlined,
  ShareAltOutlined,
  CalendarOutlined,
  UserOutlined,
  TagOutlined,
  ArrowLeftOutlined,
  HeartOutlined,
  HeartFilled,
} from "@ant-design/icons";
import { BlogPost } from "../../types/blogTypes";
import {
  useBlogPost,
  useTogglePostLike,
  useTrackPostView,
} from "../../hooks/useBlogQueries";
import BlogComments from "./BlogComments";
import RelatedBlogs from "./RelatedBlogs";
import "./BlogDetail.css";
import { formatToSyrianDate } from "../../helper/timeFormat";
import { useAuth } from "../../hooks/useAuth";

const { Title, Paragraph, Text } = Typography;

const BlogDetail: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug: BlogPost["slug"] }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const hasTrackedView = useRef(false);

  // React Query hooks for data fetching and mutations
  const {
    data: blog,
    isLoading,
    error,
  } = useBlogPost(slug || "", {
    enabled: !!slug, // Only fetch if slug exists
  });

  // Handle blog post errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching blog post:", error);
      message.error("فشل في تحميل المنشور");
      navigate("/blog");
    }
  }, [error, navigate]);

  const toggleLikeMutation = useTogglePostLike();

  const trackViewMutation = useTrackPostView();

  // Memoized view tracking function
  const trackView = useCallback(() => {
    if (blog?.id && id && !hasTrackedView.current) {
      trackViewMutation.mutate({
        postId: blog.id,
        postSlug: blog.slug,
      });
      hasTrackedView.current = true;
    }
  }, [blog?.id, blog?.slug, id, trackViewMutation]);

  // Track view when blog loads (only once)
  useEffect(() => {
    trackView();
  }, [trackView]);

  // Reset tracking flag when blog post changes
  useEffect(() => {
    hasTrackedView.current = false;
  }, [blog?.id]);

  const handleLikeToggle = () => {
    if (!blog || !isAuthenticated) {
      message.warning("يجب تسجيل الدخول للإعجاب بالمنشور");
      return;
    }

    toggleLikeMutation.mutate({
      postId: blog.id,
      postSlug: blog.slug,
      currentLiked: blog.is_liked || false,
      currentCount: blog.likes_count || 0,
    });
  };

  const handleShare = async () => {
    if (!blog) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt || blog.title,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        message.success("تم نسخ الرابط!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        message.error("فشل في نسخ الرابط");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spin size="large" />
          <div className="text-lg text-gray-600 dark:text-gray-400">
            جاري تحميل المنشور...
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="text-center shadow-lg rounded-xl">
            <div className="space-y-4 py-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                المنشور غير موجود
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                لم يتم العثور على المنشور المطلوب
              </p>
              <Button
                type="primary"
                onClick={() => navigate("/blog")}
                className="rounded-lg px-6 py-2 h-auto min-h-[40px] flex items-center gap-2 mx-auto"
              >
                <ArrowLeftOutlined /> العودة إلى المدونة
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <BackTop />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="space-y-4 sm:space-y-6">
                  {/* Back button */}
                  <Button
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 p-0 h-auto border-none shadow-none"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate("/blog")}
                  >
                    العودة إلى المدونة
                  </Button>

                  {/* Title */}
                  <Title
                    level={1}
                    className="!text-2xl sm:!text-3xl lg:!text-4xl !font-bold !text-gray-900 dark:!text-white !leading-tight !mb-4"
                  >
                    {blog.title}
                  </Title>

                  {/* Meta information */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <UserOutlined className="text-blue-500" />
                      <Text className="text-gray-700 dark:text-gray-300">
                        {blog.author_name || "مجهول"}
                      </Text>
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarOutlined className="text-blue-500" />
                      <Text className="text-gray-700 dark:text-gray-300">
                        {formatToSyrianDate(blog.created_at)}
                      </Text>
                    </div>

                    <div className="flex items-center gap-2">
                      <EyeOutlined className="text-blue-500" />
                      <Text className="text-gray-700 dark:text-gray-300">
                        {blog.views_count || 0} مشاهدة
                      </Text>
                    </div>
                  </div>

                  {/* Tags */}
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <TagOutlined className="text-blue-500" />
                      {blog.tags.map((tag) => (
                        <Tag
                          key={tag.id}
                          color="blue"
                          className="rounded-full px-3 py-1"
                        >
                          {tag.name}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Divider className="my-0" />

              {/* Featured Image */}
              {blog.featured_image && (
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                  <div className="rounded-lg overflow-hidden">
                    <Image
                      src={blog.featured_image}
                      alt={blog.title}
                      className="w-full h-auto object-cover"
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="px-4 sm:px-6 lg:px-8 py-6" dir="rtl">
                {blog.excerpt && (
                  <Paragraph className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6 font-medium bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-r-4 border-blue-500">
                    {blog.excerpt}
                  </Paragraph>
                )}

                <div
                  className="prose prose-lg max-w-none text-gray-800 dark:text-gray-200 leading-relaxed [&>*]:mb-4 [&>h1]:text-2xl [&>h2]:text-xl [&>h3]:text-lg [&>h1]:font-bold [&>h2]:font-semibold [&>h3]:font-medium [&>p]:leading-relaxed [&>ul]:pr-6 [&>ol]:pr-6 [&>blockquote]:border-r-4 [&>blockquote]:border-blue-500 [&>blockquote]:pr-4 [&>blockquote]:py-2 [&>blockquote]:bg-blue-50 [&>blockquote]:dark:bg-blue-900/20"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              </div>

              <Divider className="my-0" />

              {/* Action buttons */}
              <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type={blog.is_liked ? "primary" : "default"}
                    icon={blog.is_liked ? <HeartFilled /> : <HeartOutlined />}
                    loading={toggleLikeMutation.isPending}
                    onClick={handleLikeToggle}
                    disabled={!isAuthenticated}
                    className="rounded-lg px-4 py-2 h-auto min-h-[40px] flex items-center gap-2"
                  >
                    {blog.likes_count || 0} إعجاب
                  </Button>

                  <Button
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                    className="rounded-lg px-4 py-2 h-auto min-h-[40px] flex items-center gap-2"
                  >
                    مشاركة
                  </Button>
                </div>
              </div>

              <Divider className="my-0" />

              {/* Comments Section */}
              <div className="px-4 sm:px-6 lg:px-8 py-6">
                <BlogComments blogId={blog.id} />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Author Info */}
              {blog.author_name && (
                <Card
                  title="عن الكاتب"
                  size="small"
                  className="shadow-md rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      icon={<UserOutlined />}
                      size={48}
                      className="bg-blue-500"
                    />
                    <div>
                      <div className="font-semibold text-blue-600 text-base">
                        {blog.author_name}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Related Posts */}
              <div className="w-full">
                <RelatedBlogs
                  currentBlogId={blog.id.toString()}
                  categoryId={blog.category_id}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
