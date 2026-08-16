# @oracle69/platform-contracts

This package contains the versioned TypeScript types and interfaces that define the integration contracts for the Oracle69 Enterprise AI Platform.

## Versioning Policy

**Important:** This package follows a strict semver policy.

- **Breaking Change:** Any change to an existing type or interface that would break compatibility with consumers **MUST** result in a major version bump (e.g., 1.x.x -> 2.0.0).
- **Additive Change:** New types or optional fields can be added with a minor version bump.

This ensures that sibling products (Business Architect, Business Launch, etc.) can safely pin to compatible versions of these contracts.
