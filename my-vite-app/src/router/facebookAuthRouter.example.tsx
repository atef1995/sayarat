// Router setup for Facebook authentication
// Add this to your main router configuration (App.tsx or router.tsx)

import { createBrowserRouter } from "react-router";
import FacebookCallback from "../components/FacebookCallback";
import Login from "../components/Login";
// ... other imports

// Example router configuration
export const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Layout</div>, // Your main layout component
    children: [
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "auth/facebook/callback",
        element: <FacebookCallback />,
      },
      {
        path: "profile",
        element: <div>Profile Page</div>, // Your profile page component
      },
      // Add other routes here
    ],
  },
]);

export default router;
