# Đăng nhập bằng Google (Node/Express + Mongoose)

Tài liệu này trích xuất phần đăng nhập Google từ dự án để bạn có thể mang sang dự án khác nhanh chóng.

## 1) Dependencies cần có

- google-auth-library
- jsonwebtoken
- bcryptjs
- cookie-parser (nếu muốn set cookie)
- mongoose (User/AuthToken model)

Cài đặt:

```
npm i google-auth-library jsonwebtoken bcryptjs cookie-parser
```

## 2) Biến môi trường (.env)

```
GOOGLE_CLIENT_ID=your_google_oauth_client_id
SECRET_KEY=your_access_token_secret
# Optional (dùng SECRET_KEY nếu không có)
REFRESH_TOKEN_SECRET=your_refresh_token_secret
NODE_ENV=development
```

Lưu ý: GOOGLE_CLIENT_ID phải khớp với Client ID mà bạn cấu hình trên Google Cloud Console (OAuth 2.0 Client IDs).

## 3) Controller: loginWithGoogle

Dưới đây là phiên bản rút gọn, độc lập, chỉ giữ phần cốt lõi để xác thực Google ID token và phát hành JWT/Refresh Token. Bạn có thể điều chỉnh theo User model của dự án mới.

```ts
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models'; // Thay đường dẫn phù hợp
import AuthToken from '../models/AuthToken'; // Optional nếu muốn lưu refresh token
import { signToken, signRefreshToken } from '../utils'; // Các hàm JWT đã nêu ở jwt-auth.md

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export const loginWithGoogle = async (req: Request, res: Response) => {
  try {
    const { token } = req.body; // Google ID token từ FE
    if (!token) return res.status(400).json({ message: 'Thiếu Google token' });

    // Xác thực token với Google + timeout phòng treo
    const verifyTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Google verification timeout')), 15000));
    const verifyPromise = googleClient.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
    const ticket = (await Promise.race([verifyPromise, verifyTimeout])) as any;
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Token Google không hợp lệ' });
    }

    // Tìm hoặc tạo user
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);
      user = await User.create({
        email: payload.email,
        password: hashedPassword,
        fullName: payload.name || payload.email.split('@')[0],
        avatar: payload.picture,
        emailVerified: true,
        isActive: true,
        role: 'customer',
        gender: 'other'
      });
    } else {
      if (!user.emailVerified) {
        user.emailVerified = true;
        await user.save();
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa' });
    }

    // Phát hành token
    const accessToken = await signToken({ _id: user._id, fullName: user.fullName, email: user.email, role: user.role });
    const refreshToken = await signRefreshToken({ _id: user._id, email: user.email });

    // Optional: lưu refresh token để quản lý phiên
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await AuthToken.create({
      userId: user._id,
      refreshToken,
      userAgent: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip || 'unknown',
      expiresAt,
      isRevoked: false,
    });

    // Optional: set cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: 'Đăng nhập với Google thành công!',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('timeout')) {
      return res.status(408).json({ message: 'Xác thực Google mất quá nhiều thời gian. Vui lòng thử lại.' });
    }
    return res.status(500).json({ message: 'Đăng nhập với Google thất bại. Vui lòng thử lại sau.' });
  }
};
```

## 4) Route

Thêm endpoint:

```ts
router.post('/login-google', loginWithGoogle);
```

## 5) Frontend flow tối giản

- Lấy Google ID token (via Google Identity Services hoặc Firebase Auth, v.v.)
- Gửi token đó về backend: POST /api/auth/login-google { token }
- Backend xác thực token, trả về accessToken/refreshToken + user info

Ví dụ gửi từ FE:

```ts
await fetch('/api/auth/login-google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // nếu dùng cookie
  body: JSON.stringify({ token: googleIdToken })
});
```

## 6) Ghi chú bảo mật/triển khai

- Chỉ chấp nhận Google ID token từ client ID hợp lệ (audience = GOOGLE_CLIENT_ID)
- Ở production, cookie nên có secure=true và sameSite='none'
- Cân nhắc chặn login nếu email domain không thuộc whitelist (nếu cần)
- Log và rate-limit endpoint nếu cần

## 7) Tích hợp với JWT refresh flow

- Kết hợp cùng tài liệu jwt-auth.md để có logout và refreshAccessToken
- Reuse cùng AuthToken model để quản lý phiên

## 8) Checklist khi port sang dự án khác

- Cài dependency và thêm env GOOGLE_CLIENT_ID
- Copy controller loginWithGoogle và chỉnh import User/AuthToken/utils
- Thêm route POST /login-google
- Đảm bảo User model có các field tối thiểu: email, password, fullName, avatar, role, isActive, emailVerified
- Đồng bộ flow refresh token/logout theo jwt-auth.md

