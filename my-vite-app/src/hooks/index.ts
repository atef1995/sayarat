/**
 * Custom Hooks Index
 *
 * Central export point for all custom hooks in the application.
 * Implements modular architecture for better organization and reusability.
 */

export {
  default as useResponsive,
  useBreakpoint,
  useViewport,
} from "./useResponsive";

export {
  default as useAffixOffset,
  useSidebarAffixOffset,
} from "./useAffixOffset";

// #TODO: Add useLocalStorage hook
// #TODO: Add useDebounce hook
// #TODO: Add useTheme hook
// #TODO: Add useBlogData hook for centralized blog data management
