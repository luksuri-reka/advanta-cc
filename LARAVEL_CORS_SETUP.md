# Laravel CORS Setup (Fix preflight/blocked by CORS for /auth/login)

This guides you to enable CORS on your Laravel API so the Next.js app can call:
- http://127.0.0.1:8000/auth/login
- http://127.0.0.1:8000/auth/profile
- http://127.0.0.1:8000/auth/logout

Your browser error indicates:
- Origin: http://172.22.160.1:3000 (and/or http://localhost:3000)
- Preflight failed (no Access-Control-Allow-Origin on OPTIONS/POST /auth/login)

Important: Your auth routes are NOT under the default api/* prefix, so you must include auth/* in CORS paths.

## 1) Edit config/cors.php

Open config/cors.php in your Laravel backend and adjust:

```php
return [

    // Include both API and non-API auth endpoints so CORS headers apply to preflight and actual requests
    'paths' => [
        'api/*',
        'auth/*',               // IMPORTANT for /auth/login, /auth/profile, /auth/logout
        'sanctum/csrf-cookie',  // optional if using Sanctum cookie-based SPA
    ],

    // Allow the methods you need (or *)
    'allowed_methods' => ['*'],

    // Explicitly allow your frontend origins
    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://172.22.160.1:3000', // your LAN interface shown in the error
    ],

    // If you prefer patterns (optional):
    'allowed_origins_patterns' => [
        // '/^http:\/\/127\.0\.0\.1:3000$/',
        // '/^http:\/\/localhost:3000$/',
    ],

    // Allow Authorization header for Bearer token
    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Set to true ONLY if you are using cookie-based auth (Sanctum SPA)
    // For Bearer token in Authorization header, keep this false.
    'supports_credentials' => false,
];
```

Notes:
- Adding 'auth/*' ensures Laravel adds CORS headers to both OPTIONS and POST/GET requests for your auth endpoints.
- If you serve from a different host/port, add it to allowed_origins.

## 2) Ensure CORS middleware is active

Laravel 7+ ships with Fruitcake CORS. Confirm the global middleware includes:
- app/Http/Kernel.php has \App\Http\Middleware\HandleCors::class in $middleware (default in recent Laravel versions).
No additional registration is usually needed.

If you’re on older Laravel without built-in CORS:
- Install Fruitcake CORS:
  composer require fruitcake/laravel-cors
- Publish config (if needed):
  php artisan vendor:publish --provider="Fruitcake\Cors\CorsServiceProvider"
- Then configure config/cors.php as above.

## 3) Clear config cache and restart

Run in your Laravel backend project directory:
- php artisan config:clear
- php artisan cache:clear
- Restart your PHP server (php artisan serve / queue / supervisor / Nginx/Apache reload)

## 4) Test

- From your Next.js app (http://localhost:3000 or http://172.22.160.1:3000), try logging in again.
- Verify in the browser DevTools Network tab that requests to /auth/login now include:
  - Request headers: Origin, Content-Type, (and preflight: Access-Control-Request-Method/Headers)
  - Response headers: Access-Control-Allow-Origin matching your origin, Access-Control-Allow-Headers includes Authorization, Content-Type, etc.

Optional cURL test (actual request, not preflight):
```
curl -i -X POST http://127.0.0.1:8000/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"email":"adminadvanta@gmail.com","password":"advanta2023"}'
```

You should see Access-Control-Allow-Origin in the response headers.

## 5) If using Sanctum cookie-based SPA (optional)

If you later switch from Bearer token to Sanctum cookies, add:
- .env:
  - SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000,172.22.160.1:3000
  - SESSION_DOMAIN=127.0.0.1 (or your domain)
- config/cors.php: 'supports_credentials' => true
- Frontend: fetch(..., { credentials: 'include' })
- Call /sanctum/csrf-cookie before login.

For your current setup (Bearer token in Authorization header), you do NOT need these cookie settings.

## 6) Common pitfalls

- Missing 'auth/*' in CORS paths → preflight OPTIONS on /auth/login won’t get CORS headers → blocked by CORS.
- Allowed origins mismatch (e.g., using http://localhost:3000 but browser origin is http://172.22.160.1:3000).
- Reverse proxy/Nginx removing CORS headers (ensure Laravel response headers are passed through).
- Config cache not cleared after editing config/cors.php.

After applying the above, the login flow from your Next.js app should succeed without CORS errors.
