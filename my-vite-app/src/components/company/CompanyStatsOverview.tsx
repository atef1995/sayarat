import React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Progress,
  List,
  Tag,
  Space,
  Empty,
} from "antd";
import {
  CarOutlined,
  EyeOutlined,
  MessageOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { CompanyStats } from "../../types/company.types";

const { Text } = Typography;

interface CompanyStatsOverviewProps {
  stats: CompanyStats | null;
}

const CompanyStatsOverview: React.FC<CompanyStatsOverviewProps> = ({
  stats,
}) => {
  const calculateSuccessRate = () => {
    if (!stats || stats.totalListings === 0) return 0;
    if (stats.soldListings !== undefined) {
      return Math.round((stats.soldListings / stats.totalListings) * 100);
    }
    return stats.conversionRate ? Math.round(stats.conversionRate) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="إجمالي الإعلانات"
                  value={stats.totalListings}
                  prefix={<CarOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="الإعلانات النشطة"
                  value={stats.activeListings}
                  prefix={<CarOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="المبيعات"
                  value={stats.soldListings || 0}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="معدل النجاح"
                  value={calculateSuccessRate()}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="إجمالي المشاهدات"
                  value={stats.totalViews}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: "#13c2c2" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="إجمالي الاستفسارات"
                  value={stats.totalInquiries || stats.totalMessages || 0}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: "#eb2f96" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Performance Progress */}
          <Row gutter={[16, 16]} justify="center" align="middle">
            <Card title="الأداء" className="w-full">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <div className="flex flex-col items-center">
                    <Text type="secondary">معدل البيع</Text>
                    <Progress
                      type="circle"
                      percent={calculateSuccessRate()}
                      format={(percent) => `${percent}%`}
                      strokeColor="#52c41a"
                    />
                  </div>
                </Col>

                <Col xs={24} md={8}>
                  <div className="flex flex-col items-center">
                    <Text type="secondary">الإعلانات النشطة</Text>
                    <Progress
                      type="circle"
                      percent={
                        stats.totalListings > 0
                          ? Math.round(
                              (stats.activeListings / stats.totalListings) * 100
                            )
                          : 0
                      }
                      format={(percent) => `${percent}%`}
                      strokeColor="#1890ff"
                    />
                  </div>
                </Col>

                <Col xs={24} md={8}>
                  <div className="flex flex-col items-center">
                    <Text type="secondary">معدل الاستفسارات</Text>
                    <Progress
                      type="circle"
                      percent={
                        stats.totalViews > 0
                          ? Math.min(
                              Math.round(
                                ((stats.totalInquiries ||
                                  stats.totalMessages ||
                                  0) /
                                  stats.totalViews) *
                                  100
                              ),
                              100
                            )
                          : 0
                      }
                      format={(percent) => `${percent}%`}
                      strokeColor="#722ed1"
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </Row>

          {/* Monthly Stats */}
          {stats.monthlyStats && stats.monthlyStats.length > 0 && (
            <Card title="الإحصائيات الشهرية" className="w-full">
              <List
                dataSource={stats.monthlyStats.slice(0, 6)}
                renderItem={(item) => (
                  <List.Item>
                    <Row className="w-full" gutter={[16, 16]} align="middle">
                      <Col flex="auto">
                        <Text strong>{item.month}</Text>
                      </Col>
                      <Col>
                        <Space>
                          <Tag color="blue">{item.listings} إعلان</Tag>
                          <Tag color="green">{item.views} مشاهدة</Tag>
                          <Tag color="orange">{item.inquiries} استفسار</Tag>
                        </Space>
                      </Col>
                    </Row>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </>
      ) : (
        <Card>
          <Empty
            description="لا توجد إحصائيات متاحة"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
};

export default CompanyStatsOverview;
