import React from "react";
import SEOHelmet from "./SEOHelmet";

interface RouteSEOProps {
  title: string;
  description: string;
  canonicalPath: string;
  noIndex?: boolean;
  noFollow?: boolean;
  children: React.ReactNode;
}

export const RouteSEO: React.FC<RouteSEOProps> = ({
  title,
  description,
  canonicalPath,
  noIndex = false,
  noFollow = false,
  children,
}) => {
  const canonicalUrl = `${window.location.origin}${canonicalPath}`;

  return (
    <>
      <SEOHelmet
        title={title}
        description={description}
        canonicalUrl={canonicalUrl}
        ogTitle={title}
        ogDescription={description}
        noIndex={noIndex}
        noFollow={noFollow}
      />
      {children}
    </>
  );
};

export const NoIndexSEO: React.FC<
  Omit<RouteSEOProps, "noIndex" | "noFollow">
> = ({ title, description, canonicalPath, children }) => {
  return (
    <RouteSEO
      title={title}
      description={description}
      canonicalPath={canonicalPath}
      noIndex={true}
      noFollow={true}
    >
      {children}
    </RouteSEO>
  );
};
