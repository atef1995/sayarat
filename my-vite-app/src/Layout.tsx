import { ReactNode, useCallback, useEffect, useState, Suspense } from "react";
import { Layout, Menu, theme, Spin, Row, Col, Space, Tooltip } from "antd";
import { Content, Header, Footer } from "antd/es/layout/layout";
import {
  BookOutlined,
  CarFilled,
  HeartFilled,
  HomeFilled,
  LoginOutlined,
  LogoutOutlined,
  MessageFilled,
  SettingFilled,
  UserOutlined,
  PlusOutlined,
  StarFilled,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "./hooks/useAuth";
import { fetchUnreadMessagesCount } from "./api/fetchMessages";
import MessageIcon from "./components/icons/message";
import { useSubscription } from "./hooks/useSubscription";
import { StatusIndicator } from "./components/StatusBadge";
import GuestCTABanner from "./components/GuestCTABanner";
import FloatingJoinButton from "./components/FloatingJoinButton";
import "./styles/status-effects.css";

function MyLayout({ children }: { children: ReactNode }) {
  const {
    token: { borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const windowQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const [darkMode, setDarkMode] = useState(windowQuery.matches);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { isPremium, isCompany } = useSubscription();

  useEffect(() => {
    if (isAuthenticated) {
      try {
        fetchUnreadMessagesCount().then((data) => {
          console.log("Unread messages count:", data);

          setUnreadMessages(data);
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [isAuthenticated]);

  const darkModeChange = useCallback((e: MediaQueryListEvent) => {
    setDarkMode(e.matches);
  }, []);

  useEffect(() => {
    windowQuery.addEventListener("change", darkModeChange);
    return () => {
      windowQuery.removeEventListener("change", darkModeChange);
    };
  }, [windowQuery, darkModeChange]);
  const headerMenuItems = [
    {
      key: "home",
      icon: <HomeFilled />,
      label: "الرئيسية",
      onClick: () => navigate("/"),
    },
    {
      key: "blog",
      icon: <BookOutlined />,
      label: "الاخبار والمقالات",
      onClick: () => navigate("/blog"),
    },

    // Show prominent "بيع سيارتك" for non-authenticated users to encourage signup
    !isAuthenticated
      ? {
          key: "sell-car-guest",
          icon: <CarFilled className="text-green-500" />,
          label: (
            <Tooltip title="سجل دخولك لتتمكن من بيع سيارتك بسهولة">
              <span className="text-green-600 hover:text-white transition-colors duration-300 font-medium">
                بيع سيارتك
              </span>
            </Tooltip>
          ),
          onClick: () => navigate("/signup"),
          className: "hover:bg-green-50 transition-colors duration-200",
        }
      : {
          className: isPremium()
            ? "before:absolute before:w-full before:h-10 before:rounded-full before:bg-yellow-500/15 before:transition-all before:duration-300 hover:before:scale-110 before:blur-xl before:animate-pulse before:duration-[10000ms] before:ease-in-out"
            : undefined,
          key: "sell-car",
          icon: <CarFilled className={isPremium() ? "text-yellow-500" : ""} />,
          label: isPremium() ? (
            <StatusIndicator type="premium" position="top-left" size="xs">
              <span className="premium-text">بيع سيارتك</span>
            </StatusIndicator>
          ) : (
            "بيع سيارتك"
          ),
          onClick: () => navigate("/create-listing"),
        },

    isAuthenticated
      ? {
          key: "messages",
          icon: (
            <>
              {unreadMessages < 1 ? (
                <MessageFilled />
              ) : (
                <>
                  <MessageFilled className="mx-2" />
                  <MessageIcon count={unreadMessages} />
                </>
              )}
            </>
          ),
          label: "الرسائل",
          onClick: () => navigate("/messages"),
        }
      : null,
    isAuthenticated
      ? {
          key: "favorites",
          icon: <HeartFilled />,
          label: "المفضلة",
          onClick: () => navigate("/favorites"),
        }
      : null,
    isAuthenticated && user?.accountType === "company"
      ? {
          key: "company-dashboard",
          icon: !isCompany && <SettingFilled className="text-blue-600" />,
          label: (
            <StatusIndicator type="company" position="above" size="xs">
              <span className="company-text font-medium">لوحة الشركة</span>
            </StatusIndicator>
          ),
          onClick: () => navigate("/company-dashboard"),
        }
      : null,

    // Enhanced authentication menu for non-authenticated users
    !isAuthenticated
      ? {
          key: "join-now",
          icon: <PlusOutlined className="text-blue-500" />,
          label: (
            <Space>
              <span className="text-blue-600 hover:text-white transition-colors duration-300 font-semibold">
                انضم الآن
              </span>
              <StarFilled className="text-yellow-500 text-xs" />
            </Space>
          ),
          onClick: () => navigate("/signup"),
          className:
            "bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 transition-all duration-300 rounded-lg",
        }
      : null,

    isAuthenticated
      ? {
          key: "user-menu",
          icon:
            isPremium() || isCompany() ? null : (
              <UserOutlined className="text-blue-600" />
            ),
          label: isPremium() ? (
            <StatusIndicator type="premium" position="top-left" size="xs">
              <span className="premium-text">مرحبا بك, {user?.username}</span>
            </StatusIndicator>
          ) : isCompany() ? (
            <StatusIndicator type="company" position="above" size="xs">
              <span className="company-text font-semibold">
                {user?.username}
              </span>
            </StatusIndicator>
          ) : (
            user?.username
          ),
          children: [
            {
              key: "profile",
              icon: <UserOutlined />,
              label: "إعدادات الحساب",
              onClick: () => navigate("/profile"),
            },
            {
              key: "my-listings",
              icon: <CarFilled />,
              label: "إدارة إعلاناتي",
              onClick: () => navigate("/my-listings"),
            },
            {
              key: "settings",
              icon: <SettingFilled />,
              label: "الإعدادات",
              children: [
                {
                  key: "account",
                  label: "حساب المستخدم",
                  onClick: () => navigate("/profile"),
                },
                {
                  key: "privacy",
                  label: "الخصوصية",
                  onClick: () => navigate("/privacy"),
                },
                {
                  // #TODO: Implement these settings
                  key: "notifications-settings",
                  label: "إعدادات الإشعارات",
                },
              ],
            },
            {
              type: "divider",
            },
            {
              key: "logout",
              icon: <LogoutOutlined />,
              label: "تسجيل الخروج",
              onClick: () => {
                logout();
                navigate("/");
                navigate(0);
              },
            },
          ],
        }
      : {
          key: "auth-menu",
          icon: <LoginOutlined className="text-gray-600" />,
          label: "تسجيل الدخول",
          onClick: () => navigate("/login"),
          className: "hover:bg-gray-50 transition-colors duration-200",
        },
  ].filter(Boolean);
  return (
    <Layout className="min-h-screen w-dvw">
      <Header
        className={`
          ${isPremium() ? "premium-header premium-glow" : ""}
          ${isCompany() ? "company-glow" : ""}
          transition-all duration-300 px-4 flex items-center
        `}
        style={{ height: "64px", lineHeight: "64px" }}
      >
        <Menu
          theme={`${darkMode ? "dark" : "light"}`}
          mode="horizontal"
          items={headerMenuItems}
          style={{
            flex: 1,
            minWidth: 0,
            borderBottom: "none",
            lineHeight: "64px",
            height: "64px",
            display: "flex",
            alignItems: "center",
          }}
          className={`
            ${isPremium() ? "premium-menu" : ""}
            ${isCompany() ? "company-menu" : ""}
            header-menu
          `}
          overflowedIndicator={
            <div className="flex items-center h-full">
              <span className="text-xs">المزيد</span>
            </div>
          }
        />
      </Header>
      <Layout>
        <Content
          className="flex flex-col items-center"
          style={{
            marginTop: 20,
            marginBottom: 20,
            minHeight: 280,
            borderRadius: borderRadiusLG,
          }}
        >
          {/* Show CTA banner for non-authenticated users on homepage and car listings */}
          {!isAuthenticated &&
            (location.pathname === "/" ||
              location.pathname.startsWith("/cars")) && <GuestCTABanner />}

          <Suspense fallback={<Spin size="large" />}>{children}</Suspense>
        </Content>
        {location.pathname.startsWith("/messages") ? null : (
          <Footer>
            <Row
              gutter={{ xs: 8, sm: 16, md: 24, lg: 32, xl: 40, xxl: 48 }}
              align="middle"
              justify="center"
            >
              <Col span={24} className="text-center mb-4">
                <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()}</p>
              </Col>
              <Col>
                <p>
                  <Link
                    to={"/privacy"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    سياسة الخصوصية
                  </Link>
                </p>
              </Col>
              <Col>
                <p>
                  <Link
                    to={"/terms"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    شروط الاستخدام
                  </Link>
                </p>
              </Col>
              <Col>
                <p>
                  <Link
                    to={"/contact"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline ml-2"
                  >
                    اتصل بنا
                  </Link>
                </p>
              </Col>
              <Col>
                <p>
                  <Link
                    to={"/help"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline ml-2"
                  >
                    المساعدة والدعم
                  </Link>
                </p>
              </Col>
              <Col>
                <p>
                  <Link
                    to={"/create-ad"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline ml-2"
                  >
                    للإعلانات
                  </Link>
                </p>
              </Col>
            </Row>
          </Footer>
        )}
      </Layout>

      {/* Floating Join Button for non-authenticated users */}
      {!isAuthenticated && <FloatingJoinButton />}
    </Layout>
  );
}

export default MyLayout;
