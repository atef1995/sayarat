---
applyTo: "**/*.tsx"
---

## TSX Component Development Guidelines

These guidelines are designed to ensure consistency, maintainability, and performance in the development of TSX components within our codebase. Please adhere to these practices when creating or modifying components.

### Important Note

dark mode is handled by Ant Design theming in the root, and Tailwind CSS is used for utility-first styling. Ensure that all components are compatible with these frameworks. do not hardcode dark mode colors or styles; instead, use Ant Design's theming capabilities and Tailwind CSS classes for styling.

### Fixing Issues

- **Identify the Issue**: Clearly define the problem you are addressing. Document any related issues or bugs in the codebase.
- **Fix the Code**: Implement the necessary changes to resolve the issue. Ensure that the fix is well-tested and does not introduce new bugs.
- **Systematically fix the code**: Follow a systematic approach to fix the code, ensuring that all related components and utilities are updated accordingly.

### Planning and Structure

- **Component Planning**: Before starting development, think of and write a plan for the component. Outline its purpose, props, state management, and how it fits into the overall application architecture.

- **Search for Existing Components**: Before creating a new component, search the codebase to see if a similar component already exists. Reuse components where possible to reduce duplication.

- **Component Purpose**: Clearly define the purpose of each component. Each component should encapsulate a specific piece of functionality or UI.

- **Component Naming**: Use descriptive names for components that reflect their purpose. Component names should be in PascalCase (e.g., `UserProfile`, `ProductCard`).

- **Directory Structure**: Organize components in a logical directory structure. Group related components together, and consider using feature-based organization for larger applications.

- **Component Hierarchy**: Plan the component hierarchy before implementation. Use a flat structure where possible to avoid deep nesting.

- **Props and State Management**: Clearly define the props and state for each component. Use TypeScript interfaces or types to enforce prop types and ensure type safety.

- **Component Reusability**: Design components to be reusable. Avoid hardcoding values; instead, use props to pass data and configuration.

- **Hooks**: Use React hooks for managing state and side effects. Custom hooks can be created for shared logic across components.

- **Context API**: Utilize the React Context API for global state management where necessary, especially for user authentication and settings.

### Component Design

- **Single Responsibility**: Each component should have a single responsibility and should not be overly complex.
- **Reusability**: Components should be designed to be reusable across different parts of the application.

### General Guidelines

- **File Naming**: Use PascalCase for component file names (e.g., `MyComponent.tsx`).
- **Component Structure**: Each component should be in its own file, with the file name matching the component name.
- **Imports**: Organize imports in the following order:
  1. React imports
  2. Third-party library imports
  3. Local imports (components, utilities, styles)
- **Export**: Use named exports for components to allow for better tree-shaking and easier refactoring.
- **JSX Syntax**: Use self-closing tags for components that do not have children. Use consistent indentation (2 spaces) for JSX.
- **Comments**: Use JSDoc comments for component props and methods to improve documentation and type inference.
- **Prop Types**: Define prop types using TypeScript interfaces or types. Use `React.FC` for functional components to ensure type safety.

## Instructions for TSX Components

- **Modular Architecture**: Ensure components are modular and reusable.
- **DRY Principles**: Avoid code duplication by creating reusable components and utilities.
- **Error Boundaries**: Implement error boundaries to handle errors gracefully.
- **Type Safety**: Use TypeScript interfaces and types for props and state.
- **Loading States**: Manage loading states effectively, especially for data fetching.
- **User Context**: Utilize the existing `AuthProvider` context for user data instead of making separate API calls.
- **TODO Comments**: Add `#TODO` comments for areas that need further work or refactoring.
- **Decoupling**: Keep components decoupled from specific data fetching logic; use hooks or context for data access.
- **Server-Side Rendering (SSR)**: If applicable, ensure components are compatible with SSR for better performance and SEO.
- **SEO Considerations**: Use appropriate meta tags and structured data for SEO optimization.
- **Accessibility**: Ensure components are accessible, following best practices for ARIA roles and keyboard navigation.
- **Testing**: Write unit tests for components and utilities to ensure reliability.
- **Documentation**: Document components and utilities clearly, including usage examples and prop types.
- **Performance Optimization**: Use React.memo and useCallback to optimize performance where necessary.
- **State Management**: Use React's built-in state management or context API for local state; consider libraries like Redux or Zustand for global state if needed.
- **Code Reviews**: Regularly review code for adherence to these guidelines and best practices.
- **Version Control**: Use meaningful commit messages and follow branching strategies for version control.
- **Linting and Formatting**: Use ESLint and Prettier for consistent code style and formatting.
- **Dependency Management**: Keep dependencies up to date and remove unused ones to reduce bundle size.
- **Error Handling**: Implement try-catch blocks for async operations and provide user feedback on errors.
- **Internationalization (i18n)**: If applicable, ensure components support internationalization for multi-language support.
- **Security Best Practices**: Follow security best practices, such as sanitizing inputs and avoiding inline styles.
- **Code Splitting**: Use dynamic imports for large components to improve initial load time.
- **Max File Size**: Keep component files under 300 lines of code to maintain readability and manageability.

## Styling Guidelines

- **Responsive Design**: Ensure components are responsive and work well on different screen sizes.
- **AntDesign Integration**: use Ant Design, follow its guidelines for theming and component usage.
- **Tailwind CSS**: use Tailwind CSS, ensure classes are applied correctly and follow best practices for utility-first CSS.
- **Dark Mode Support**: Ant Design theming is used for dark mode support.
