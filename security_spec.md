# Security Specification (TDD) for Firestore Security Rules

## 1. Data Invariants
- Anyone can read/list articles.
- Users can increase (`likes`) or (`views`) of an article.
- Users can append a new comment to an article's `comments` array.
- Admin (any user since the app has open admin controls for demo, but we will lock down to authenticated admins or open admin in sandbox context, or we can use the `isAdmin()` helper check or allow the admin operations to be secured with a secret or simple flag) can create, update, and delete articles.
- Admin UIDs can be configured in `/admins/{adminId}` or standard admin path.

## 2. The "Dirty Dozen" Payloads
Here are the 12 malicious payloads to resist:
1. Creating an article without authentication.
2. Creating an article without a title.
3. Modifying an article's immutable fields such as `createdAt`.
4. Injecting fake views count (e.g. 10,000,000).
5. Injecting negative likes count.
6. Injecting invalid data types (e.g. string for `views`).
7. Bypassing category validation (e.g. setting category to "malicious").
8. Injecting massive values for `readTime`.
9. Overwriting other users' comments in the comments array.
10. Creating articles with missing required fields in JSON.
11. Admin role spoofing via user properties.
12. Denial of wallet attack via huge string IDs.

## 3. Test Cases for Rules
Our rules will deny permission for these invalid scenarios.
`firestore.rules` will explicitly enforce these validations.
