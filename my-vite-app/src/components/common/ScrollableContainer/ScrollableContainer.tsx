/**
 * ScrollableContainer Component
 *
 * A reusable component that provides scrollable functionality with visual indicators
 * for overflow content. Implements scroll shadows and scroll hints for better UX.
 *
 * Features:
 * - Automatic scroll detection
 * - Visual scroll indicators (shadows/gradients)
 * - Customizable scroll behavior
 * - Responsive design
 * - Accessibility support
 */

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { Button } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import "./ScrollableContainer.css";

interface ScrollableContainerProps {
  children: ReactNode;
  maxHeight?: string | number;
  className?: string;
  showScrollButtons?: boolean;
  showScrollShadows?: boolean;
  scrollButtonPosition?: "inside" | "outside";
  direction?: "vertical" | "horizontal";
  smooth?: boolean;
}

/**
 * Get height class based on maxHeight prop
 */
const getHeightClass = (maxHeight: string | number): string => {
  if (typeof maxHeight === "number") {
    if (maxHeight <= 200) return "scrollable-container--height-small";
    if (maxHeight <= 400) return "scrollable-container--height-medium";
    if (maxHeight <= 600) return "scrollable-container--height-large";
    return "scrollable-container--height-full";
  }

  if (maxHeight === "100%" || maxHeight === "100vh") {
    return "scrollable-container--height-full";
  }

  return "scrollable-container--height-auto";
};

/**
 * ScrollableContainer Component
 */
const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  maxHeight = "100%",
  className = "",
  showScrollButtons = true,
  showScrollShadows = true,
  scrollButtonPosition = "inside",
  direction = "vertical",
  smooth = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  /**
   * Check scroll position and update button states
   */
  const checkScrollPosition = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    setCanScrollUp(scrollTop > 5);
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - 5);
  };

  /**
   * Handle scroll with throttling
   */
  const handleScroll = () => {
    if (!isScrolling) {
      setIsScrolling(true);
      requestAnimationFrame(() => {
        checkScrollPosition();
        setIsScrolling(false);
      });
    }
  };

  /**
   * Scroll to top
   */
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  /**
   * Scroll to bottom
   */
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Check scroll position on mount and when content changes
  useEffect(() => {
    checkScrollPosition();

    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [children]);

  const containerClasses = [
    "scrollable-container",
    `scrollable-container--${direction}`,
    getHeightClass(maxHeight),
    showScrollShadows && canScrollUp ? "scrollable-container--shadow-top" : "",
    showScrollShadows && canScrollDown
      ? "scrollable-container--shadow-bottom"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="scrollable-container-wrapper">
      {/* Top scroll button */}
      {showScrollButtons && canScrollUp && (
        <Button
          type="text"
          size="small"
          icon={<ArrowUpOutlined />}
          onClick={scrollToTop}
          className={`scrollable-container__scroll-btn scrollable-container__scroll-btn--top scrollable-container__scroll-btn--${scrollButtonPosition}`}
          title="Scroll to top"
        />
      )}

      {/* Scrollable content */}
      <div
        ref={containerRef}
        className={containerClasses}
        onScroll={handleScroll}
        role="region"
        aria-label="Scrollable content"
        tabIndex={0}
      >
        {children}
      </div>

      {/* Bottom scroll button */}
      {showScrollButtons && canScrollDown && (
        <Button
          type="text"
          size="small"
          icon={<ArrowDownOutlined />}
          onClick={scrollToBottom}
          className={`scrollable-container__scroll-btn scrollable-container__scroll-btn--bottom scrollable-container__scroll-btn--${scrollButtonPosition}`}
          title="Scroll to bottom"
        />
      )}
    </div>
  );
};

export default ScrollableContainer;
