---
applyTo: "**/*.js"
---

# Important

When developing a new feature start with coding the skeleton of the feature, then wait for approval before proceeding with the implementation. This allows for early feedback and ensures that the feature aligns with project goals.

## JavaScript Instructions

- apply modular architecture to the files you are working on.

- use dry principles to create reusable code.

- use error boundaries to handle errors gracefully.

- Add `#TODO` comments for any areas that need further work or refactoring.

### Fixing Issues

- **Identify the Issue**: Clearly define the problem you are addressing. Document any related issues or bugs in the codebase.
- **Fix the Code**: Implement the necessary changes to resolve the issue. Ensure that the fix is well-tested and does not introduce new bugs.
- **Systematically fix the code**: Follow a systematic approach to fix the code, ensuring that all related components and utilities are updated accordingly.

- **Decoupling**: Keep code/classes decoupled from specific data fetching logic; use hooks or context for data access.
- **Open Closed Principle**: Ensure code/classes are open for extension but closed for modification.
- **Single Responsibility Principle**: Each component should have a single responsibility and not be overloaded with multiple functionalities.
- **Separation of Concerns**: Keep business logic separate from UI code/classes.
- **Code Reviews**: Regularly review code for adherence to these guidelines and best practices.
- **Consistent Naming Conventions**: Use clear and consistent naming conventions for variables, functions, and code/classes.
- **Avoid Global State**: Minimize the use of global state; prefer local state or context providers for managing state.
- **Use OOP design patterns**: Implement object-oriented design patterns where applicable, such as Factory, Singleton, Strategy, or Observer patterns etc.
- **Version Control**: Use meaningful commit messages and follow branching strategies for version control.
- **Linting and Formatting**: Use ESLint and Prettier for consistent code style and formatting.
- **Dependency Management**: Keep dependencies up to date and remove unused ones to reduce bundle size.
- **Error Handling**: Implement try-catch blocks for async operations and provide user feedback on errors.
- **Dependency Injection**: Use dependency injection for better testability and flexibility.
- **Use SOLID Principles**: Follow SOLID principles for object-oriented design to ensure maintainability and scalability.
- **Testing**: Write unit tests for functions and modules to ensure reliability.
- **Documentation**: Document functions and modules clearly, including usage examples and parameter descriptions.
- **NODEjS Best Practices**: Follow Node.js best practices for asynchronous programming, error handling, and performance optimization.
- **Security Best Practices**: Follow security best practices, such as sanitizing inputs and avoiding inline styles.

- **Code Modularity**: Break down large files into smaller, manageable modules.
- **Reusable code/classes**: Create reusable code/classes for common patterns.
- **Testability**: Ensure code/classes are easily testable by keeping them stateless where possible.

## current nodejs development environment

- **Logger**: We use logger in backend/utils/logger.js for logging purposes.
- **Knex**: We use knex for database migrations and queries.
- **Dotenvx**: We use dotenvx to manage environment variables
- **How to run the server**: npm start

## nodejs Testing

- **Unit Tests**: Use Jest for unit testing. Write tests for each module to ensure functionality.
- **Integration Tests**: Use Supertest to test API endpoints. Ensure all endpoints are covered
- **End-to-End Tests**: Use Cypress for end-to-end testing of the application. Test user flows and critical paths.
- **Mocking**: Use libraries like `jest.mock` to mock dependencies in tests.
- **Test Coverage**: Aim for high test coverage. Use `jest --coverage` to check coverage reports.
- **Continuous Integration**: Set up CI pipelines to run tests on every commit or pull request.
- **Error Handling in Tests**: Ensure tests handle errors gracefully and provide meaningful feedback.
- **Test Data Management**: Use factories or fixtures to manage test data. Avoid hardcoding data in tests.
- **Performance Testing**: Use tools like Artillery or k6 for performance testing of critical endpoints.
- **Code Reviews**: Conduct code reviews to ensure test quality and coverage.
- **Documentation**: Document test cases and their expected outcomes. Use comments to explain complex test logic.
- **Test Naming Conventions**: Use descriptive names for test cases to clarify their purpose.
- **Test Isolation**: Ensure tests are isolated and do not depend on each other. Use setup and teardown methods to manage test state.
- **Mocking External Services**: Use libraries like `nock` to mock external API calls in tests.
