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
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      direction="rtl"
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <AntdApp>
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
                path="/privacy"
                element={
                  <MyLayout>
                    <PrivacyPolicy />
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
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>
);
