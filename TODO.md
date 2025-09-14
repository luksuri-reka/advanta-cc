# Admin Console Login - Implementation TODO

Information Gathered:
- Next.js App Router frontend.
- API base URL: http://127.0.0.1:8000/api.
- Backend routes (Laravel Sanctum):
  - POST /auth/login
  - GET /auth/profile (auth:sanctum)
  - DELETE /auth/logout (auth:sanctum)
- Token storage approval: store in non-HttpOnly cookie "auth_token" and localStorage.
- Preference: safe and easy to maintain approach.

Plan and Steps:

1) Update API Layer
- [x] app/utils/api.ts
  - [x] Add apiFetch helper attaching Authorization Bearer token when present.
  - [x] Ensure searchProduct uses apiFetch.

2) Auth Utilities
- [x] app/utils/auth.ts (new)
  - [x] login(email, password) -> POST /auth/login, store token and user.
  - [x] logout() -> DELETE /auth/logout, clear token and user.
  - [x] getAuthToken(), setAuthToken(), clearAuth()
  - [x] getProfile() -> GET /auth/profile
  - [x] Cookie helpers: setCookie, getCookie, deleteCookie

3) Route Protection (Client)
- [x] app/components/ProtectedRoute.tsx (new)
  - [x] Client-side check for token; redirect to /admin/login if missing.

4) Pages
- [x] app/admin/login/page.tsx (new)
  - [x] Login form (email, password), calls login(), redirects to /admin.
  - [x] Error handling and basic UX.

- [x] app/admin/page.tsx (new)
  - [x] Simple dashboard placeholder wrapped with ProtectedRoute.
  - [x] Shows basic profile info (if available) and Logout button.

5) Route Protection (Server - Optional but recommended)
- [x] middleware.ts (new)
  - [x] Protect /admin(/**) by checking 'auth_token' cookie.
  - [x] Redirect to /admin/login if missing.
  - [x] If accessing /admin/login with existing token, redirect to /admin.

6) Testing
- [ ] Start Next.js dev server: npm run dev
- [ ] Test Login: /admin/login -> login with valid credentials.
- [ ] Access /admin (should pass when logged in, redirect when not).
- [ ] Test Logout and redirect behavior.
- [ ] Verify API requests include Authorization header.
- [ ] Validate CORS settings on backend.

Notes:
- Ensure backend CORS allows origin http://localhost:3000.
- This implementation uses Bearer token model (no CSRF cookies).
- In production, set Secure cookie attribute if served over HTTPS.
