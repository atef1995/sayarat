import React from "react";
import { Helmet } from "react-helmet-async";

const HelmetComponent = Helmet as unknown as React.ComponentType<
  React.PropsWithChildren
>;

interface AlternateUrl {
  hreflang: string;
  href: string;
}

interface SEOHelmetProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product" | "business.business";
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  lang?: "ar" | "en";
  noIndex?: boolean;
  noFollow?: boolean;
  alternateUrls?: AlternateUrl[];
  structuredData?: Record<string, unknown>;
}

const SEOHelmet: React.FC<SEOHelmetProps> = ({
  title,
  description,
  canonicalUrl,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  lang = "ar",
  noIndex = false,
  noFollow = false,
  alternateUrls = [],
  structuredData,
}) => {
  const robotsValue = [
    noIndex ? "noindex" : "index",
    noFollow ? "nofollow" : "follow",
  ].join(", ");

  return (
    <HelmetComponent>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsValue} />
      <meta name="language" content={lang} />
      <meta name="content-language" content={lang} />

      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="مزادات السيارات" />
      <meta property="og:locale" content={lang === "ar" ? "ar_SY" : "en_US"} />
      <meta property="og:url" content={canonicalUrl || window.location.href} />

      {ogImage && (
        <>
          <meta property="og:image" content={ogImage} />
          <meta property="og:image:alt" content={ogTitle || title} />
        </>
      )}

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle || title} />
      <meta name="twitter:description" content={ogDescription || description} />

      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {alternateUrls.map((alternate) => (
        <link
          key={`${alternate.hreflang}-${alternate.href}`}
          rel="alternate"
          hrefLang={alternate.hreflang}
          href={alternate.href}
        />
      ))}

      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </HelmetComponent>
  );
};

export default SEOHelmet;
