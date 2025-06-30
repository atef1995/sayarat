---
applyTo: "**/*.ts"
---

## apply modular architecture to the code files you are working on.

## use dry principles to create reusable code.

## use error boundaries to handle errors gracefully.

## Add `#TODO` comments for any areas that need further work or refactoring.

- **Type Safety**: Use TypeScript interfaces and types for props and state.
- **Loading States**: Manage loading states effectively, especially for data fetching.
- **User Context**: Utilize the existing `AuthProvider` context for user data instead of making separate API calls.
- **Decoupling**: Keep components decoupled from specific data fetching logic; use hooks or context for data access.
- **Documentation**: Document components and utilities clearly, including usage examples and prop types.
- **Code Reviews**: Regularly review code for adherence to these guidelines and best practices.
- **Open Closed Principle**: Ensure components are open for extension but closed for modification.
- **Single Responsibility Principle**: Each component should have a single responsibility and not be overloaded with multiple functionalities.
- **Separation of Concerns**: Keep business logic separate from UI components.
- **Consistent Naming Conventions**: Use clear and consistent naming conventions for variables, functions, and components.
- **Avoid Global State**: Minimize the use of global state; prefer local state or context providers for managing state.
- **Use OOP design patterns**: Implement object-oriented design patterns where applicable, such as Factory, Singleton, Strategy, or Observer patterns etc.
- **Dependency Injection**: Use dependency injection for better testability and flexibility.
- **Security Best Practices**: Follow security best practices, such as sanitizing inputs and avoiding inline styles.
- **Code Modularity**: Break down large files into smaller, manageable modules.
- **Type Definitions**: Define types and interfaces for complex objects to ensure type safety.
- **TypeScript Generics**: Use TypeScript generics to create reusable components and functions that can work with different types.
- ** TypeScript Enums**: Use TypeScript enums for fixed sets of values to improve code readability and maintainability.
- **Code Comments**: Use comments to explain complex logic or important decisions in the code.
- **TypeScript Utility Types**: Leverage TypeScript utility types like `Partial`, `Pick`, and `Omit` to create flexible types.
- **TypeScript Namespaces**: Use namespaces to organize related types and interfaces, especially in larger projects.
- **TypeScript Modules**: Use modules to encapsulate related functionality and avoid polluting the global namespace.
- **TypeScript Decorators**: Use decorators for cross-cutting concerns like logging, validation, or authentication.
