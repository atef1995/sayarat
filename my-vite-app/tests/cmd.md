npm run test:e2e -- tests/signup-core.spec.ts

# Run all subscription tests

npm run test:subscription

# Run with visible browser for debugging

npm run test:subscription:headed

# Run specific test file

npx playwright test tests/basic-auth-flow.spec.ts

npx playwright test --config=subscription.config.ts

npx playwright test subscription-pages.spec.ts --config=subscription.config.ts --max-failures=1
