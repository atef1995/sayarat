/**
 * useResponsive Hook
 *
 * A custom hook for handling responsive behavior across the application.
 * Provides consistent breakpoint management and responsive utilities.
 *
 * #TODO: Add more granular breakpoint support
 * #TODO: Add orientation detection
 * #TODO: Add touch device detection
 */

import { useState, useEffect } from "react";

interface ResponsiveBreakpoints {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  xxl: boolean;
}

interface ResponsiveUtils extends ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Ant Design breakpoints
 */
const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;

/**
 * Custom hook for responsive behavior
 */
export const useResponsive = (): ResponsiveUtils => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Initial call to set the size
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const { width, height } = screenSize;

  // Calculate breakpoints
  const breakpoints: ResponsiveBreakpoints = {
    xs: width >= BREAKPOINTS.xs,
    sm: width >= BREAKPOINTS.sm,
    md: width >= BREAKPOINTS.md,
    lg: width >= BREAKPOINTS.lg,
    xl: width >= BREAKPOINTS.xl,
    xxl: width >= BREAKPOINTS.xxl,
  };

  // Utility flags
  const isMobile = width < BREAKPOINTS.md;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isDesktop = width >= BREAKPOINTS.lg;

  return {
    ...breakpoints,
    isMobile,
    isTablet,
    isDesktop,
    screenWidth: width,
    screenHeight: height,
  };
};

/**
 * Hook for checking if current screen size matches a specific breakpoint
 */
export const useBreakpoint = (
  breakpoint: keyof typeof BREAKPOINTS
): boolean => {
  const responsive = useResponsive();
  return responsive[breakpoint];
};

/**
 * Hook for getting viewport dimensions with debouncing
 */
export const useViewport = (debounceMs = 100) => {
  const [viewport, setViewport] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    window.addEventListener("resize", handleResize);

    // Initial call
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return viewport;
};

export default useResponsive;
