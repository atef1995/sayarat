interface GtagFunction {
  (
    command: "event",
    eventName: string,
    parameters?: Record<string, unknown>
  ): void;
  (
    command: "config" | "js",
    targetId: string | Date,
    config?: Record<string, unknown>
  ): void;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
  }
}

interface SEOBootstrapOptions {
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  ga4MeasurementId?: string;
}

const addMetaTag = (name: string, content: string): void => {
  if (!content || content.trim().length === 0) {
    return;
  }

  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }

  meta.content = content;
};

const loadGoogleAnalytics = (measurementId: string): void => {
  if (!measurementId || !measurementId.startsWith("G-")) {
    return;
  }

  const existingScript = document.getElementById("ga4-loader");
  if (!existingScript) {
    const script = document.createElement("script");
    script.id = "ga4-loader";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId);
};

export const bootstrapSEO = (options: SEOBootstrapOptions): void => {
  addMetaTag("google-site-verification", options.googleSiteVerification || "");
  addMetaTag("msvalidate.01", options.bingSiteVerification || "");

  if (options.ga4MeasurementId) {
    loadGoogleAnalytics(options.ga4MeasurementId);
  }

  // #TODO: Add support for additional verification providers if needed (Yandex/Baidu).
};
