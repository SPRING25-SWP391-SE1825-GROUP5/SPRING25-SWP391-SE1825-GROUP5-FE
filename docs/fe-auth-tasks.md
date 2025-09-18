FE responsibilities for Auth (ASP.NET Core API + SQL Server + Google Login)

Scope
- Support login with email/password and with Google ID token
- Receive and store accessToken/refreshToken
- Use accessToken for protected API calls
- Refresh accessToken when expired
- Logout (invalidate refresh on server and clear local state)

1) Endpoints to call
- POST /api/auth/login
  - body: { email: string, password: string }
  - resp.data: { id, fullName, email, role, emailVerified, avatar, accessToken, refreshToken }
- POST /api/auth/login-google
  - body: { token: string } // Google ID token from GIS
  - resp.data: same structure as login
- POST /api/auth/refresh-token
  - body: { refreshToken: string }
  - resp.data: { accessToken }
- POST /api/auth/logout
  - body: { refreshToken: string }
  - resp: { message }

2) Token storage strategy
- Recommended: keep accessToken in memory (state) and refreshToken in httpOnly cookie if BE supports it. If not using cookies, store refreshToken in memory or secure storage and rotate often.
- Minimal approach (no cookies):
  - Store both tokens in memory + optionally localStorage/sessionStorage for persistence (accepting XSS risk). Consider encrypting or using httpOnly cookies for production.

3) Google Identity Services (GIS) on FE
- Install and load GIS script or use Firebase Auth (either way produce a Google ID token).
- With GIS One Tap or button, after user selects account, you receive credential (ID token).
- Send that token to BE: POST /api/auth/login-google { token: googleIdToken }

4) Example code (fetch)

Login (email/password):
```ts
async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
  const { data } = await res.json();
  setAuthState({ user: data, accessToken: data.accessToken, refreshToken: data.refreshToken });
}
```

Login with Google:
```ts
async function loginWithGoogle(googleIdToken: string) {
  const res = await fetch('/api/auth/login-google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: googleIdToken })
  });
  if (!res.ok) throw new Error('Google login failed');
  const { data } = await res.json();
  setAuthState({ user: data, accessToken: data.accessToken, refreshToken: data.refreshToken });
}
```

Refresh token:
```ts
let isRefreshing = false;
let pending: Array<(t: string) => void> = [];

async function refreshTokenFlow(currentRefresh: string) {
  if (isRefreshing) return new Promise<string>(res => pending.push(res));
  isRefreshing = true;
  try {
    const res = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefresh })
    });
    if (!res.ok) throw new Error('Refresh failed');
    const { data } = await res.json();
    const newAccess = data.accessToken;
    updateAccessToken(newAccess);
    pending.forEach(fn => fn(newAccess));
    pending = [];
    return newAccess;
  } finally {
    isRefreshing = false;
  }
}
```

API wrapper with auto-attach/refresh (axios):
```ts
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const access = getAccessToken();
  if (access) cfg.headers.Authorization = `Bearer ${access}`;
  return cfg;
});

api.interceptors.response.use(r => r, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && !original._retry) {
    original._retry = true;
    const newAccess = await refreshTokenFlow(getRefreshToken());
    original.headers.Authorization = `Bearer ${newAccess}`;
    return api(original);
  }
  return Promise.reject(error);
});

export default api;
```

Logout:
```ts
async function logout() {
  const refresh = getRefreshToken();
  if (refresh) {
    try { await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: refresh }) }); } catch {}
  }
  clearAuthState();
}
```

5) Route guards (React Router)
- If no accessToken, redirect to /login.
- Optionally try silent refresh on first load if refreshToken exists.

6) Error handling UX
- Show explicit messages for bad credentials, locked account, token expired.
- Retry/reauth flows for 401.

7) Security notes
- Prefer httpOnly cookies for refresh token if backend supports; if using localStorage, be aware of XSS.
- Always send Authorization: Bearer <accessToken> on protected requests.

