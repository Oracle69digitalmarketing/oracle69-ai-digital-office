| Test | Security property | Actual implementation exercised | Result |
|---|---|---|---|
| Create Org and Publish | Event tenant isolation | Service calls Repository to create & MessageBus to publish | FAIL (Assertion) |
| Update record tenant-scoped | Update isolation | Service resolves tenant and calls Repository to update | FAIL (Assertion) |
