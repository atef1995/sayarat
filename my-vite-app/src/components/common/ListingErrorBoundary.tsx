import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, Button, Card } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for handling listing-related errors
 * Implements graceful error handling following React best practices
 */
export class ListingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Listing Error Boundary caught an error:", error, errorInfo);

    // #TODO: Send error to logging service
    // Example: errorReportingService.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Card className="w-full max-w-6xl sm:max-w-screen-lg my-4">
          <Alert
            message="خطأ في تحميل الإعلان"
            description="حدث خطأ أثناء تحميل تفاصيل الإعلان. يرجى المحاولة مرة أخرى."
            type="error"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
              >
                إعادة المحاولة
              </Button>
            }
          />
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-4 p-4 rounded">
              <summary className="font-bold cursor-pointer">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 text-sm overflow-auto">
                {this.state.error.toString()}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with error boundary
 * @param Component - Component to wrap
 * @returns Wrapped component with error boundary
 */
export const withListingErrorBoundary = <P extends Record<string, unknown>>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = (props: P) => (
    <ListingErrorBoundary>
      <Component {...props} />
    </ListingErrorBoundary>
  );

  WrappedComponent.displayName = `withListingErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};
