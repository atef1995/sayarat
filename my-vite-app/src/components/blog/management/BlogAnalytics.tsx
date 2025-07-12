import React from "react";
import { Card, Row, Col, Statistic, Typography, List, Tag, Avatar } from "antd";
import {
  LineChartOutlined,
  BarChartOutlined,
  EyeOutlined,
  HeartOutlined,
  MessageOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

/**
 * BlogAnalytics Component
 *
 * Analytics dashboard for blog performance metrics
 */
const BlogAnalytics: React.FC = () => {
  // Mock data - replace with actual analytics hooks
  const analytics = {
    totalViews: 12543,
    totalLikes: 892,
    totalComments: 245,
    totalShares: 156,
    growthRate: 15.2,
    popularPosts: [
      { id: 1, title: "أفضل السيارات لعام 2024", views: 1234, likes: 89 },
      { id: 2, title: "نصائح لشراء سيارة مستعملة", views: 987, likes: 76 },
      { id: 3, title: "مراجعة تويوتا كامري الجديدة", views: 765, likes: 54 },
    ],
    topCategories: [
      { name: "مراجعات السيارات", count: 45 },
      { name: "نصائح القيادة", count: 32 },
      { name: "أخبار السوق", count: 28 },
    ],
    recentActivity: [
      {
        type: "comment",
        user: "أحمد محمد",
        action: "علق على",
        post: "أفضل السيارات لعام 2024",
        time: "منذ 5 دقائق",
      },
      {
        type: "like",
        user: "فاطمة أحمد",
        action: "أعجب بـ",
        post: "نصائح لشراء سيارة مستعملة",
        time: "منذ 10 دقائق",
      },
      {
        type: "view",
        user: "محمد علي",
        action: "شاهد",
        post: "مراجعة تويوتا كامري الجديدة",
        time: "منذ 15 دقيقة",
      },
    ],
  };

  return (
    <div className="space-y-6">
      <Title level={3} className="!mb-6">
        إحصائيات المدونة
      </Title>

      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm rounded-lg">
            <Statistic
              title="إجمالي المشاهدات"
              value={analytics.totalViews}
              prefix={<EyeOutlined className="text-blue-500" />}
              valueStyle={{ color: "#1890ff" }}
              suffix={
                <span className="text-xs text-green-500">
                  +{analytics.growthRate}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm rounded-lg">
            <Statistic
              title="إجمالي الإعجابات"
              value={analytics.totalLikes}
              prefix={<HeartOutlined className="text-red-500" />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm rounded-lg">
            <Statistic
              title="إجمالي التعليقات"
              value={analytics.totalComments}
              prefix={<MessageOutlined className="text-green-500" />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card className="text-center shadow-sm rounded-lg">
            <Statistic
              title="إجمالي المشاركات"
              value={analytics.totalShares}
              prefix={<BarChartOutlined className="text-purple-500" />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Popular Posts */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <LineChartOutlined className="text-blue-500" />
                <span>المنشورات الأكثر شعبية</span>
              </div>
            }
            className="shadow-sm rounded-lg h-full"
          >
            <List
              dataSource={analytics.popularPosts}
              renderItem={(post, index) => (
                <List.Item>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {post.title}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <EyeOutlined /> {post.views}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <HeartOutlined /> {post.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Top Categories */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <BarChartOutlined className="text-green-500" />
                <span>أشهر الفئات</span>
              </div>
            }
            className="shadow-sm rounded-lg h-full"
          >
            <List
              dataSource={analytics.topCategories}
              renderItem={(category) => (
                <List.Item>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-gray-900 dark:text-white">
                      {category.name}
                    </span>
                    <Tag color="blue">{category.count} منشور</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <UserOutlined className="text-purple-500" />
            <span>النشاط الأخير</span>
          </div>
        }
        className="shadow-sm rounded-lg"
      >
        <List
          dataSource={analytics.recentActivity}
          renderItem={(activity) => (
            <List.Item>
              <div className="flex items-center gap-3 w-full">
                <Avatar
                  icon={<UserOutlined />}
                  className="bg-blue-500"
                  size="small"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {activity.user}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 mx-2">
                    {activity.action}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {activity.post}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default BlogAnalytics;
