# JWT Auth (Node/Express + Mongoose)

This guide extracts the JWT auth implementation from this project so you can quickly plug it into another Node/Express app.

## 1) Dependencies

- jsonwebtoken
- bcryptjs
- dotenv
- mongoose
- cookie-parser (for reading cookies)

Install:

```
npm i jsonwebtoken bcryptjs dotenv cookie-parser
```

## 2) Environment variables (.env)

```
SECRET_KEY=your_access_token_secret
# Optional (falls back to SECRET_KEY if missing)
REFRESH_TOKEN_SECRET=your_refresh_token_secret
NODE_ENV=development
```

## 3) Utility functions (JWT + helpers)

Source: Backend/src/utils/index.ts

- Functions you need to copy:
  - signToken
  - signRefreshToken
  - verifyRefreshToken
  - getRealIP (optional, for logging)
  - getLocationFromIP (optional, for geo logging)

Example minimal extract:

```ts
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export const signToken = async (payload: {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  role: string;
}) => {
  if (!process.env.SECRET_KEY) throw new Error('SECRET_KEY missing');
  return jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '7d' });
};

export const signRefreshToken = async (payload: {
  _id: Types.ObjectId;
  email: string;
}) => {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY;
  if (!refreshSecret) throw new Error('Refresh secret missing');
  return jwt.sign(payload, refreshSecret, { expiresIn: '7d' });
};

export const verifyRefreshToken = async (token: string) => {
  try {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY;
    if (!refreshSecret) throw new Error('Refresh secret missing');
    const decoded = jwt.verify(token, refreshSecret) as { _id: string; email: string };
    return { valid: true, expired: false, decoded };
  } catch (err: any) {
    return { valid: false, expired: err.message === 'jwt expired', decoded: null };
  }
};
```

If you want the IP and geolocation logging too, also copy getRealIP and getLocationFromIP from this repo.

## 4) Auth middleware

Source: Backend/src/middleware/authMiddleware.ts

Use this in protected routes. It reads the JWT from Authorization: Bearer <token> or cookie access_token.

```ts
import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types'; // or define: interface AuthRequest extends Request { user?: any }

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) token = authHeader.split(' ')[1];
  else if ((req as any).cookies?.access_token) token = (req as any).cookies.access_token;

  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });
  if (!process.env.SECRET_KEY) throw new Error('SECRET_KEY is not defined');

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY) as {
      _id: string;
      email: string;
      fullName: string;
      role: string;
    };
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};
```

## 5) Models used

- User: regular user account with fields: email, password, fullName, role, isActive, emailVerified, avatar, etc.
- AuthToken: stores refresh tokens per session/user agent.
- LoginHistory (optional): logs login/logout time, IP, UA, location.

AuthToken schema to copy (if you want refresh-token persistence):

```ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthToken extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
  isRevoked: boolean;
}

const AuthTokenSchema = new Schema<IAuthToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  refreshToken: { type: String, required: true },
  userAgent: { type: String, required: true },
  ipAddress: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false }
}, { timestamps: true });

AuthTokenSchema.index({ refreshToken: 1 });
export default mongoose.model<IAuthToken>('AuthToken', AuthTokenSchema);
```

## 6) Controller functions

Source: Backend/src/controllers/authController.ts

Core handlers to copy if you want email/password auth + refresh flow:

- login
- logout
- refreshAccessToken
- register (optional)

Key logic of login:

```ts
import bcrypt from 'bcryptjs';
import { User, AuthToken, LoginHistory } from '../models';
import { signToken, signRefreshToken } from '../utils';

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) return res.status(400).json({ message: 'Tài khoản không tồn tại!' });
  if (!user.isActive) return res.status(400).json({ message: 'Tài khoản bị khóa' });
  const ok = await bcrypt.compare(password.trim(), user.password);
  if (!ok) return res.status(400).json({ message: 'Thông tin đăng nhập sai' });

  const accessToken = await signToken({ _id: user._id, fullName: user.fullName, email: user.email, role: user.role });
  const refreshToken = await signRefreshToken({ _id: user._id, email: user.email });

  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  await AuthToken.create({ userId: user._id, refreshToken, userAgent: req.headers['user-agent'] || 'unknown', ipAddress: req.ip || 'unknown', expiresAt: expires, isRevoked: false });

  return res.status(200).json({
    message: 'Đăng nhập thành công!',
    data: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, emailVerified: user.emailVerified, accessToken, refreshToken }
  });
};
```

Logout and refresh flow summary:

```ts
export const logout = async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) await AuthToken.updateOne({ refreshToken }, { isRevoked: true });
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  return res.status(200).json({ message: 'Đăng xuất thành công' });
};

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return res.status(401).json({ message: 'Không tìm thấy refresh token' });
  const tokenDoc = await AuthToken.findOne({ refreshToken, isRevoked: false, expiresAt: { $gt: new Date() } });
  if (!tokenDoc) return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  const { valid, expired, decoded } = await verifyRefreshToken(refreshToken);
  if (!valid || expired || !decoded) {
    await AuthToken.updateOne({ refreshToken }, { isRevoked: true });
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
  const user = await User.findById(decoded._id);
  if (!user || !user.isActive) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.status(401).json({ message: 'Người dùng không tồn tại hoặc đã bị khóa' });
  }
  const newAccessToken = await signToken({ _id: user._id, fullName: user.fullName, email: user.email, role: user.role });
  return res.status(200).json({ message: 'Token đã được làm mới' });
};
```

## 7) Routes

Source: Backend/src/routes/authRoutes.ts

Add endpoints:

```ts
router.post('/register', register); // optional
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshAccessToken);
```

Mount in your server:

```ts
import cookieParser from 'cookie-parser';
app.use(cookieParser());
app.use('/api/auth', authRoutes);
```

## 8) CORS and cookies (if you set cookie tokens)

- If using cookies, set CORS to allow credentials and proper origin.
- In production, set cookie secure/sameSite appropriately.

Example:

```ts
import cors from 'cors';
app.use(cors({ origin: ['http://localhost:5173', 'https://yourdomain.com'], credentials: true }));
```

## 9) Summary checklist to port

- Copy utility JWT functions
- Copy authMiddleware
- Copy AuthToken model (and optionally LoginHistory)
- Copy controller handlers (login/logout/refresh and optionally register)
- Wire routes and cookie-parser
- Ensure .env secrets present
- Install dependencies

