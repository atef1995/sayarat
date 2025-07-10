import { ComponentType } from "react";

/**
 * Route Guard Types
 *
 * Type definitions for route guard components to ensure type safety
 * and consistent interfaces across all guard implementations.
 */

export interface BaseRouteGuardProps {
  /** The component to render if access is granted */
  component: ComponentType;
}

export interface ProtectedRouteProps extends BaseRouteGuardProps {
  // #TODO: Add additional props as needed (e.g., customLoadingComponent, onAccessDenied callback)
  // Currently extends base props for consistency and future extensibility
}

export interface AdminRouteProps extends BaseRouteGuardProps {
  /** Route to redirect to if user is not admin (default: "/") */
  fallbackRoute?: string;
}

/**
 * Role-based access control types
 * For future extension to support more granular role-based routing
 */
export type UserRole = "user" | "admin" | "moderator" | "owner";

export interface RoleBasedRouteProps extends BaseRouteGuardProps {
  /** Required roles to access the route */
  requiredRoles: UserRole[];
  /** Route to redirect to if user doesn't have required roles */
  fallbackRoute?: string;
  /** Whether to require ALL roles or just ANY of the roles (default: "any") */
  roleMatchType?: "all" | "any";
}

/**
 * Permission-based access control types
 * For future extension to support permission-based routing
 */
export type Permission =
  | "read:users"
  | "write:users"
  | "delete:users"
  | "read:posts"
  | "write:posts"
  | "delete:posts"
  | "admin:settings"
  | "moderate:content";

export interface PermissionBasedRouteProps extends BaseRouteGuardProps {
  /** Required permissions to access the route */
  requiredPermissions: Permission[];
  /** Route to redirect to if user doesn't have required permissions */
  fallbackRoute?: string;
  /** Whether to require ALL permissions or just ANY of the permissions (default: "any") */
  permissionMatchType?: "all" | "any";
}
