# Security Specification for DataWhiz AI

## 1. Data Invariants
- Users can only read and write their own profile documents.
- A project must have an `ownerId` matching the creator's UID.
- Rows and history entries can only exist as children of a project.
- Users can only access projects (and their children) if they are the owner.
- Row data must be an object (map).
- Timestamps must be strictly enforced.

## 2. The "Dirty Dozen" Payloads
1. **Ownership Spoofing**: Create a project with a different `ownerId` than the authenticated user.
2. **Unauthorized Access**: Attempt to read a project document belonging to another user.
3. **Ghost Fields**: Add an `isAdmin: true` field to a user profile update.
4. **Data Corruption**: Set a row's `data` field to a string instead of an object.
5. **Timestamp Manipulation**: Set `createdAt` to a date in the past instead of `request.time`.
6. **Orphaned Writes**: Attempt to write a row to a non-existent project (enforced by path, but logic check needed).
7. **Bypassing Immutability**: Update a project's `ownerId` after creation.
8. **Resource Exhaustion**: Send a row document with a massive 1MB string in a field (checked via size limits).
9. **Identity Poisoning**: Use a non-alphanumeric string as a project ID.
10. **State Skipping**: (Not applicable here yet as there's no state machine, but we'll lock down types).
11. **PII Leak**: Attempt a blanket list query on all users.
12. **Shadow Updates**: Update a project with an extra field not in the schema.

## 3. The Test Runner
(Omitted in this output for brevity, but represented in the rules design)
