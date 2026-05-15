import { createRoot } from "react-dom/client";
import { StrictMode, lazy } from "react";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import MyLayout from "./Layout.tsx";
import { ProtectedRoute } from "./components/common/guards";
import { AdminRoute } from "./components/common/guards";
import AuthProvider from "./context/AuthProvider.tsx";

import { App as AntdApp, ConfigProvider, theme } from "antd";
import { QueryProvider } from "./providers/QueryProvider.tsx";
import { bootstrapSEO } from "./utils/seoBootstrap.ts";
import { HelmetProvider } from "react-helmet-async";
import { NoIndexSEO, RouteSEO } from "./components/seo/RouteSEO.tsx";
import LazyRoute from "./components/common/LazyRoute.tsx";

const CreateListing = lazy(() => import("./components/CreateListing.tsx"));
const CompanyDashboard = lazy(
  () => import("./components/company/CompanyDashboard.tsx")
);
const UserListings = lazy(() => import("./components/UserListings.tsx"));
const CarListing = lazy(() => import("./components/CarListing.tsx"));
const MessagesPage = lazy(() => import("./components/MessagesPage.tsx"));
const ConversationDetail = lazy(
  () => import("./components/ConversationDetail.tsx")
);
const UserProfile = lazy(() => import("./components/UserProfile.tsx"));
const EditListing = lazy(() => import("./components/EditListing.tsx"));
const Favorites = lazy(() => import("./components/Favorites.tsx"));
const Payment = lazy(() => import("./components/Payment.tsx"));
const SignupForm = lazy(() => import("./components/signup-form.tsx"));
const CompanySignupForm = lazy(
  () => import("./components/CompanySignupForm.tsx")
);
const CompanyPayment = lazy(() => import("./components/CompanyPayment.tsx"));
const CompanyPaymentSuccess = lazy(
  () => import("./components/CompanyPaymentSuccess.tsx")
);
const CompanyPaymentCancel = lazy(
  () => import("./components/CompanyPaymentCancel.tsx")
);
const Login = lazy(() => import("./components/Login.tsx"));
const ResetPassword = lazy(() => import("./components/ResetPassoword.tsx"));
const ResetPasswordReq = lazy(
  () => import("./components/ResetPasswordReq.tsx")
);
const VerifyEmail = lazy(() => import("./components/VerifyEmail.tsx"));
const User = lazy(() => import("./components/User.tsx"));
const ReportListing = lazy(() => import("./components/ReportListing.tsx"));
const AdvertiserForm = lazy(() => import("./components/AdvertiserForm.tsx"));
const SubscriptionSuccess = lazy(
  () => import("./pages/SubscriptionSuccess.tsx")
);
const SubscriptionCancel = lazy(() => import("./pages/SubscriptionCancel.tsx"));
const SubscriptionTestPage = lazy(
  () => import("./pages/SubscriptionTestPage.tsx")
);
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy.tsx"));
const BlogPage = lazy(() => import("./pages/BlogPage.tsx"));
const BlogDetail = lazy(() => import("./components/blog/BlogDetail.tsx"));
const BlogEditorPage = lazy(() => import("./pages/BlogEditorPage.tsx"));
const BlogManagement = lazy(() => import("./pages/BlogManagement.tsx"));
const FacebookCallback = lazy(() => import("./components/FacebookCallback.tsx"));

const HelmetProviderComponent = HelmetProvider as unknown as React.ComponentType<
  React.PropsWithChildren
>;

bootstrapSEO({
  googleSiteVerification: import.meta.env.VITE_GOOGLE_SITE_VERIFICATION,
  bingSiteVerification: import.meta.env.VITE_BING_SITE_VERIFICATION,
  ga4MeasurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProviderComponent>
      <ConfigProvider
        direction="rtl"
        theme={{
          algorithm: theme.darkAlgorithm,
        }}
      >
        <AntdApp>
          <QueryProvider>
            <AuthProvider>
              <BrowserRouter>
                <Routes>
                <Route path="/" element={<App />} />
                <Route
                  path="/profile"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="الملف الشخصي | مزادات السيارات"
                        description="إدارة الملف الشخصي والإعدادات الخاصة بك."
                        canonicalPath="/profile"
                      >
                        <ProtectedRoute component={UserProfile}></ProtectedRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="تسجيل الدخول | مزادات السيارات"
                        description="تسجيل الدخول إلى حسابك في مزادات السيارات."
                        canonicalPath="/login"
                      >
                        <LazyRoute>
                          <Login />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="إنشاء حساب | مزادات السيارات"
                        description="أنشئ حسابًا جديدًا للشراء أو البيع على المنصة."
                        canonicalPath="/signup"
                      >
                        <LazyRoute>
                          <SignupForm />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/verify-email"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="تأكيد البريد الإلكتروني | مزادات السيارات"
                        description="أكمل تأكيد البريد الإلكتروني لحسابك."
                        canonicalPath="/verify-email"
                      >
                        <LazyRoute>
                          <VerifyEmail />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/reset-password/:token"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="إعادة تعيين كلمة المرور | مزادات السيارات"
                        description="أنشئ كلمة مرور جديدة لحسابك."
                        canonicalPath="/reset-password"
                      >
                        <LazyRoute>
                          <ResetPassword />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/reset-password-req"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="طلب إعادة تعيين كلمة المرور | مزادات السيارات"
                        description="اطلب رابط إعادة تعيين كلمة المرور."
                        canonicalPath="/reset-password-req"
                      >
                        <LazyRoute>
                          <ResetPasswordReq />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/my-listings"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="إعلاناتي | مزادات السيارات"
                        description="إدارة الإعلانات الخاصة بك."
                        canonicalPath="/my-listings"
                      >
                        <ProtectedRoute component={UserListings} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="المفضلة | مزادات السيارات"
                        description="قائمة السيارات المحفوظة في حسابك."
                        canonicalPath="/favorites"
                      >
                        <ProtectedRoute component={Favorites} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/create-listing"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="إضافة إعلان | مزادات السيارات"
                        description="إنشاء إعلان سيارة جديد."
                        canonicalPath="/create-listing"
                      >
                        <ProtectedRoute component={CreateListing} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/payment"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="الدفع | مزادات السيارات"
                        description="إتمام عمليات الدفع داخل المنصة."
                        canonicalPath="/payment"
                      >
                        <ProtectedRoute component={Payment} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/edit-listing/:id"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="تعديل الإعلان | مزادات السيارات"
                        description="تعديل بيانات إعلانك الحالي."
                        canonicalPath="/edit-listing"
                      >
                        <ProtectedRoute component={EditListing} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/create-account"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="إنشاء حساب | مزادات السيارات"
                        description="أنشئ حسابًا جديدًا للشراء أو البيع على المنصة."
                        canonicalPath="/create-account"
                      >
                        <LazyRoute>
                          <SignupForm />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/company-dashboard"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="لوحة تحكم الشركة | مزادات السيارات"
                        description="إدارة بيانات شركتك وإعلاناتها."
                        canonicalPath="/company-dashboard"
                      >
                        <ProtectedRoute component={CompanyDashboard} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/company-signup"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="تسجيل شركة | مزادات السيارات"
                        description="إكمال إجراءات تسجيل الشركة على المنصة."
                        canonicalPath="/company-signup"
                      >
                        <LazyRoute>
                          <CompanySignupForm />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/company-payment"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="دفع اشتراك الشركة | مزادات السيارات"
                        description="إتمام دفع اشتراك الشركة."
                        canonicalPath="/company-payment"
                      >
                        <LazyRoute>
                          <CompanyPayment />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/company-payment/success"
                  element={
                    <MyLayout>
                      <LazyRoute>
                        <CompanyPaymentSuccess />
                      </LazyRoute>
                    </MyLayout>
                  }
                />
                <Route
                  path="/company-payment/cancel"
                  element={
                    <MyLayout>
                      <LazyRoute>
                        <CompanyPaymentCancel />
                      </LazyRoute>
                    </MyLayout>
                  }
                />
                <Route
                  path="/car-listing/:id"
                  element={
                    <MyLayout>
                      <CarListing />
                    </MyLayout>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="الرسائل | مزادات السيارات"
                        description="المحادثات الخاصة بحسابك."
                        canonicalPath="/messages"
                      >
                        <ProtectedRoute component={MessagesPage} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/conversation/:conversationId/"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="تفاصيل المحادثة | مزادات السيارات"
                        description="عرض تفاصيل المحادثة داخل حسابك."
                        canonicalPath="/conversation"
                      >
                        <ProtectedRoute component={ConversationDetail} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/user/:username"
                  element={
                    <MyLayout>
                      <LazyRoute>
                        <User />
                      </LazyRoute>
                    </MyLayout>
                  }
                />
                <Route
                  path="/report/:id/:toReport"
                  element={
                    <MyLayout>
                      <LazyRoute>
                        <ReportListing />
                      </LazyRoute>
                    </MyLayout>
                  }
                />
                <Route
                  path="/search/:id"
                  element={
                    <MyLayout>
                      <LazyRoute>
                        <ReportListing />
                      </LazyRoute>
                    </MyLayout>
                  }
                />
                <Route
                  path="/create-ad"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="إنشاء إعلان ترويجي | مزادات السيارات"
                        description="نموذج إنشاء إعلان ترويجي."
                        canonicalPath="/create-ad"
                      >
                        <LazyRoute>
                          <AdvertiserForm />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/subscription/success"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="نجاح الاشتراك | مزادات السيارات"
                        description="تمت عملية الاشتراك بنجاح."
                        canonicalPath="/subscription/success"
                      >
                        <LazyRoute>
                          <SubscriptionSuccess />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/subscription/cancel"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="إلغاء الاشتراك | مزادات السيارات"
                        description="تم إلغاء عملية الاشتراك."
                        canonicalPath="/subscription/cancel"
                      >
                        <LazyRoute>
                          <SubscriptionCancel />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/subscription/test"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="اختبار الاشتراك | مزادات السيارات"
                        description="صفحة اختبار داخلية للاشتراكات."
                        canonicalPath="/subscription/test"
                      >
                        <LazyRoute>
                          <SubscriptionTestPage />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/privacy-policy"
                  element={
                    <MyLayout>
                      <RouteSEO
                        title="سياسة الخصوصية | مزادات السيارات"
                        description="اطلع على سياسة الخصوصية وشروط حماية البيانات في مزادات السيارات."
                        canonicalPath="/privacy-policy"
                      >
                        <LazyRoute>
                          <PrivacyPolicy />
                        </LazyRoute>
                      </RouteSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/auth/facebook/callback"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="استرجاع تسجيل الدخول | مزادات السيارات"
                        description="استكمال تسجيل الدخول عبر فيسبوك."
                        canonicalPath="/auth/facebook/callback"
                      >
                        <LazyRoute>
                          <FacebookCallback />
                        </LazyRoute>
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/sitemap"
                  element={
                    <MyLayout>
                      <RouteSEO
                        title="خريطة الموقع | مزادات السيارات"
                        description="استعرض روابط الصفحات الرئيسية في مزادات السيارات."
                        canonicalPath="/sitemap"
                      >
                        <div className="container mx-auto px-4 py-8">
                          <h1 className="text-3xl font-bold mb-6">
                            خريطة الموقع
                          </h1>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                              <h2 className="text-xl font-semibold mb-4">
                                الصفحات الرئيسية
                              </h2>
                              <ul className="space-y-2">
                                <li>
                                  <a
                                    href="/"
                                    className="text-blue-600 hover:underline"
                                  >
                                    الرئيسية
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="/search"
                                    className="text-blue-600 hover:underline"
                                  >
                                    البحث
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="/companies"
                                    className="text-blue-600 hover:underline"
                                  >
                                    الشركات
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="/blog"
                                    className="text-blue-600 hover:underline"
                                  >
                                    المدونة
                                  </a>
                                </li>
                              </ul>
                            </div>
                            <div>
                              <h2 className="text-xl font-semibold mb-4">
                                الحساب
                              </h2>
                              <ul className="space-y-2">
                                <li>
                                  <a
                                    href="/login"
                                    className="text-blue-600 hover:underline"
                                  >
                                    تسجيل الدخول
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="/signup"
                                    className="text-blue-600 hover:underline"
                                  >
                                    إنشاء حساب
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="/profile"
                                    className="text-blue-600 hover:underline"
                                  >
                                    الملف الشخصي
                                  </a>
                                </li>
                              </ul>
                            </div>
                            <div>
                              <h2 className="text-xl font-semibold mb-4">
                                معلومات
                              </h2>
                              <ul className="space-y-2">
                                <li>
                                  <a
                                    href="/privacy-policy"
                                    className="text-blue-600 hover:underline"
                                  >
                                    سياسة الخصوصية
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="/terms"
                                    className="text-blue-600 hover:underline"
                                  >
                                    شروط الاستخدام
                                  </a>
                                </li>
                                <li>
                                  <a
                                    href="/contact"
                                    className="text-blue-600 hover:underline"
                                  >
                                    اتصل بنا
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </RouteSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/blog"
                  element={
                    <MyLayout>
                      <LazyRoute>
                        <BlogPage />
                      </LazyRoute>
                    </MyLayout>
                  }
                />
                <Route
                  path="/blog/management"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="إدارة المدونة | مزادات السيارات"
                        description="لوحة إدارة داخلية للمدونة."
                        canonicalPath="/blog/management"
                      >
                        <AdminRoute component={BlogManagement} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/blog/create"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="إنشاء مقال | مزادات السيارات"
                        description="صفحة داخلية لإنشاء مقال جديد."
                        canonicalPath="/blog/create"
                      >
                        <AdminRoute component={BlogEditorPage} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/blog/edit/:id"
                  element={
                    <MyLayout>
                      <NoIndexSEO
                        title="تعديل مقال | مزادات السيارات"
                        description="صفحة داخلية لتعديل مقال."
                        canonicalPath="/blog/edit"
                      >
                        <AdminRoute component={BlogEditorPage} />
                      </NoIndexSEO>
                    </MyLayout>
                  }
                />
                <Route
                  path="/blog/:slug/:id"
                  element={
                    <MyLayout>
                      <LazyRoute>
                        <BlogDetail />
                      </LazyRoute>
                    </MyLayout>
                  }
                />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </QueryProvider>
        </AntdApp>
      </ConfigProvider>
    </HelmetProviderComponent>
  </StrictMode>
);
