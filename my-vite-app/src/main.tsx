import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import CreateListing from "./components/CreateListing.tsx";
import SignupForm from "./components/signup-form.tsx";
import CompanySignupForm from "./components/CompanySignupForm.tsx";
import CompanyPayment from "./components/CompanyPayment.tsx";
import CompanyPaymentSuccess from "./components/CompanyPaymentSuccess.tsx";
import CompanyPaymentCancel from "./components/CompanyPaymentCancel.tsx";
import CompanyDashboard from "./components/company/CompanyDashboard.tsx";
import MyLayout from "./Layout.tsx";
import { ProtectedRoute } from "./components/common/guards";
import { AdminRoute } from "./components/common/guards";
import UserListings from "./components/UserListings.tsx";
import CarListing from "./components/CarListing.tsx";
import MessagesPage from "./components/MessagesPage.tsx";
import ConversationDetail from "./components/ConversationDetail.tsx";
import AuthProvider from "./context/AuthProvider.tsx";
import Login from "./components/Login.tsx";
import UserProfile from "./components/UserProfile.tsx";
import ResetPassword from "./components/ResetPassoword.tsx";
import ResetPasswordReq from "./components/ResetPasswordReq.tsx";
import EditListing from "./components/EditListing.tsx";
import Favorites from "./components/Favorites.tsx";
import VerifyEmail from "./components/VerifyEmail.tsx";
import User from "./components/User.tsx";
import ReportListing from "./components/ReportListing.tsx";
import AdvertiserForm from "./components/AdvertiserForm.tsx";
import SubscriptionSuccess from "./pages/SubscriptionSuccess.tsx";
import SubscriptionCancel from "./pages/SubscriptionCancel.tsx";
import SubscriptionTestPage from "./pages/SubscriptionTestPage.tsx";
import PrivacyPolicy from "./components/PrivacyPolicy.tsx";

import { App as AntdApp, ConfigProvider, theme } from "antd";
import Payment from "./components/Payment.tsx";
import BlogPage from "./pages/BlogPage.tsx";
import BlogDetail from "./components/blog/BlogDetail.tsx";
import BlogEditorPage from "./pages/BlogEditorPage.tsx";
import { QueryProvider } from "./providers/QueryProvider.tsx";
import BlogManagement from "./pages/BlogManagement.tsx";
import FacebookCallback from "./components/FacebookCallback.tsx";
import FacebookRedirect from "./components/FacebookRedirect.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
                      <ProtectedRoute component={UserProfile}></ProtectedRoute>
                    </MyLayout>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <MyLayout>
                      <Login />
                    </MyLayout>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <MyLayout>
                      <SignupForm />
                    </MyLayout>
                  }
                />
                <Route
                  path="/verify-email"
                  element={
                    <MyLayout>
                      <VerifyEmail />
                    </MyLayout>
                  }
                />
                <Route
                  path="/reset-password/:token"
                  element={
                    <MyLayout>
                      <ResetPassword />
                    </MyLayout>
                  }
                />
                <Route
                  path="/reset-password-req"
                  element={
                    <MyLayout>
                      <ResetPasswordReq />
                    </MyLayout>
                  }
                />
                <Route
                  path="/my-listings"
                  element={
                    <MyLayout>
                      <ProtectedRoute component={UserListings} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <MyLayout>
                      <ProtectedRoute component={Favorites} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/create-listing"
                  element={
                    <MyLayout>
                      <ProtectedRoute component={CreateListing} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/payment"
                  element={
                    <MyLayout>
                      <ProtectedRoute component={Payment} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/edit-listing/:id"
                  element={
                    <MyLayout>
                      <ProtectedRoute component={EditListing} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/create-account"
                  element={
                    <MyLayout>
                      <SignupForm />
                    </MyLayout>
                  }
                />
                <Route
                  path="/company-dashboard"
                  element={
                    <MyLayout>
                      <ProtectedRoute component={CompanyDashboard} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/company-signup"
                  element={
                    <MyLayout>
                      <CompanySignupForm />
                    </MyLayout>
                  }
                />
                <Route
                  path="/company-payment"
                  element={
                    <MyLayout>
                      <CompanyPayment />
                    </MyLayout>
                  }
                />
                <Route
                  path="/company-payment/success"
                  element={
                    <MyLayout>
                      <CompanyPaymentSuccess />
                    </MyLayout>
                  }
                />
                <Route
                  path="/company-payment/cancel"
                  element={
                    <MyLayout>
                      <CompanyPaymentCancel />
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
                      <ProtectedRoute component={MessagesPage} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/conversation/:conversationId/"
                  element={
                    <MyLayout>
                      <ProtectedRoute component={ConversationDetail} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/user/:username"
                  element={
                    <MyLayout>
                      <User />
                    </MyLayout>
                  }
                />
                <Route
                  path="/report/:id/:toReport"
                  element={
                    <MyLayout>
                      <ReportListing />
                    </MyLayout>
                  }
                />
                <Route
                  path="/search/:id"
                  element={
                    <MyLayout>
                      <ReportListing />
                    </MyLayout>
                  }
                />
                <Route
                  path="/create-ad"
                  element={
                    <MyLayout>
                      <AdvertiserForm />
                    </MyLayout>
                  }
                />
                <Route
                  path="/subscription/success"
                  element={
                    <MyLayout>
                      <SubscriptionSuccess />
                    </MyLayout>
                  }
                />
                <Route
                  path="/subscription/cancel"
                  element={
                    <MyLayout>
                      <SubscriptionCancel />
                    </MyLayout>
                  }
                />
                <Route
                  path="/subscription/test"
                  element={
                    <MyLayout>
                      <SubscriptionTestPage />
                    </MyLayout>
                  }
                />
                <Route
                  path="/privacy-policy"
                  element={
                    <MyLayout>
                      <PrivacyPolicy />
                    </MyLayout>
                  }
                />
                <Route path="/auth/facebook" element={<FacebookRedirect />} />
                <Route
                  path="/auth/facebook/callback"
                  element={
                    <MyLayout>
                      <FacebookCallback />
                    </MyLayout>
                  }
                />
                <Route
                  path="/sitemap"
                  element={
                    <MyLayout>
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
                    </MyLayout>
                  }
                />
                <Route
                  path="/blog"
                  element={
                    <MyLayout>
                      <BlogPage />
                    </MyLayout>
                  }
                />
                <Route
                  path="/blog/management"
                  element={
                    <MyLayout>
                      <AdminRoute component={BlogManagement} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/blog/create"
                  element={
                    <MyLayout>
                      <AdminRoute component={BlogEditorPage} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/blog/edit/:id"
                  element={
                    <MyLayout>
                      <AdminRoute component={BlogEditorPage} />
                    </MyLayout>
                  }
                />
                <Route
                  path="/blog/:slug/:id"
                  element={
                    <MyLayout>
                      <BlogDetail />
                    </MyLayout>
                  }
                />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </QueryProvider>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>
);
