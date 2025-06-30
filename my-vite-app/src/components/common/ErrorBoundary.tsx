import React from "react";
import { Alert, Button } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 max-w-md mx-auto mt-10">
          <Alert
            message="حدث خطأ غير متوقع"
            description={
              <div>
                <p>
                  نأسف، حدث خطأ في التطبيق. يرجى تحديث الصفحة أو المحاولة مرة
                  أخرى لاحقاً.
                </p>
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600">
                      تفاصيل الخطأ (للمطورين)
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            }
            type="error"
            icon={<ExclamationCircleOutlined />}
            showIcon
            action={
              <Button size="small" danger onClick={this.handleReload}>
                تحديث الصفحة
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
