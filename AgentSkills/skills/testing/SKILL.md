---
name: testing
description: Component, hook, and integration testing with Vitest and React Testing Library.
---

# Frontend Testing

## Testing Principles
- Test user-visible behavior and interactions rather than internal component implementation details.
- Query elements using accessibility priorities: `getByRole` $\rightarrow$ `getByLabelText` $\rightarrow$ `getByText` $\rightarrow$ `getByTestId` (last resort).
- Use `@testing-library/user-event` over `fireEvent` to simulate realistic browser interactions.

## Test Coverage & Scenarios
- Cover happy path user flows along with edge cases: loading skeletons, empty states, error boundaries, and invalid inputs.
- Isolate test suites; mock network boundaries cleanly (e.g. MSW or handler mocks).
- Test custom hooks using `renderHook` to verify state transitions and effect lifecycles.
- Keep tests deterministic, idempotent, and independent of execution order.
