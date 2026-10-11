# Security Architecture & Policies - BizFlow Ethiopia

## Core Tenets
1. **Tenant Isolation:** Enforced at database query layer. Every query must validate that the requested resource belongs to the session tenant.
2. **Password Security:** Salted and hashed using `bcrypt` (work factor 12).
3. **Session Tokens:** Stateless, cryptographically signed JWT tokens stored in HttpOnly, SameSite cookies.
4. **Role Enforcement:** Server-side validation on every endpoint. Client-side navigation guards are for UX only.
5. **Audit Trail:** Critical operations (stock changes, price updates, user additions, void sales) log actor IP, user ID, timestamp, and previous/new values.
6. **Input Sanitization:** Strict Zod schema validation on all incoming request bodies.
