/**
 * useAffixOffset Hook
 *
 * Custom hook for calculating the proper Affix offset based on sticky elements
 * and responsive design. Provides dynamic offset calculation for better UX.
 *
 * Features:
 * - Dynamic offset calculation
 * - Sticky element detection
 * - Responsive offset adjustments
 * - Performance optimized with memoization
 */

import { useState, useEffect, useCallback } from "react";
import { useResponsive } from "./useResponsive";

interface AffixOffsetConfig {
  baseOffset?: number;
  additionalOffset?: number;
  stickyElementSelector?: string;
}

/**
 * Custom hook for calculating Affix offset
 */
export const useAffixOffset = (config: AffixOffsetConfig = {}) => {
  const {
    baseOffset = 20,
    additionalOffset = 0,
    stickyElementSelector = ".blog-page-filters",
  } = config;

  const { isDesktop, isMobile } = useResponsive();
  const [calculatedOffset, setCalculatedOffset] = useState(baseOffset);

  /**
   * Calculate the offset based on sticky elements
   */
  const calculateOffset = useCallback(() => {
    if (!isDesktop) {
      setCalculatedOffset(baseOffset);
      return;
    }

    try {
      const stickyElement = document.querySelector(stickyElementSelector);
      if (stickyElement) {
        // Get the actual height including any margins/padding
        const stickyRect = stickyElement.getBoundingClientRect();
        const stickyHeight = stickyRect.height;

        // Always account for the sticky element's height since it will be sticky at top
        // Add some extra padding to ensure sidebar doesn't overlap
        const totalOffset = stickyHeight + baseOffset + additionalOffset;

        // Debug logging (can be removed in production)
        console.log("Affix offset calculation:", {
          stickyHeight,
          baseOffset,
          additionalOffset,
          totalOffset,
        });

        setCalculatedOffset(totalOffset);
      } else {
        setCalculatedOffset(baseOffset + additionalOffset);
      }
    } catch (error) {
      console.warn("Error calculating affix offset:", error);
      setCalculatedOffset(baseOffset + additionalOffset);
    }
  }, [baseOffset, additionalOffset, stickyElementSelector, isDesktop]);

  /**
   * Recalculate offset on window resize and element changes
   */
  useEffect(() => {
    calculateOffset();

    const handleResize = () => {
      setTimeout(calculateOffset, 100); // Debounce resize events
    };

    const handleScroll = () => {
      // Recalculate on scroll to handle sticky positioning changes
      setTimeout(calculateOffset, 50);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Watch for DOM changes that might affect sticky element height
    const observer = new MutationObserver(() => {
      setTimeout(calculateOffset, 50);
    });

    const stickyElement = document.querySelector(stickyElementSelector);
    if (stickyElement) {
      observer.observe(stickyElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [calculateOffset, stickyElementSelector]);

  return {
    offsetTop: calculatedOffset,
    offsetBottom: 20,
    isDesktop,
    isMobile,
  };
};

/**
 * Hook for sidebar affix offset specifically
 * Accounts for the sticky search bar and provides additional margin
 */
export const useSidebarAffixOffset = () => {
  return useAffixOffset({
    baseOffset: 15, // Base margin from top
    additionalOffset: 20, // Additional spacing to prevent overlap
    stickyElementSelector: ".blog-page-filters",
  });
};

export default useAffixOffset;
