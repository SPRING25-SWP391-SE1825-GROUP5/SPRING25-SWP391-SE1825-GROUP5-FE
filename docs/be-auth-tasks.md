BE responsibilities for Auth (ASP.NET Core + SQL Server + Google Login)

Goal
- Provide JWT-based authentication and refresh-token flow compatible with your existing dbo.Users schema
- Support email/password and Google ID token login

1) Configuration
- appsettings.json
  - Jwt: Issuer, Audience, AccessTokenSecret, RefreshTokenSecret, AccessTokenMinutes, RefreshTokenDays
  - Google: ClientId
  - ConnectionStrings: DefaultConnection
- Program.cs
  - AddDbContext<AppDbContext>(SqlServer)
  - AddAuthentication(JwtBearer) with TokenValidationParameters
  - AddAuthorization()
  - Register TokenService
  - app.UseAuthentication(); app.UseAuthorization();

2) Database
- Existing table: dbo.Users (int identity UserID, Username, Email, PasswordHash, FullName, AvatarUrl, Role, IsActive, EmailVerified, ...)
- Add new table: dbo.RefreshTokens (SQL)
  - Columns: Id INT IDENTITY PK, UserID INT FK->Users, Token NVARCHAR(500) UNIQUE, UserAgent NVARCHAR(255), IpAddress NVARCHAR(50), ExpiresAt DATETIME2(0), IsRevoked BIT DEFAULT 0, CreatedAt DATETIME2(0) DEFAULT sysdatetime()
  - Purpose: manage refresh tokens per session/UA

3) EF Core Mapping
- Entities:
  - AppUser -> maps to dbo.Users with matching property names and lengths
  - RefreshToken -> maps to dbo.RefreshTokens
- DbContext:
  - DbSet<AppUser> Users
  - DbSet<RefreshToken> RefreshTokens
  - Unique indexes on Username and Email; Token unique index

4) TokenService
- CreateAccessToken(AppUser user)
  - Claims: sub=UserID, email, fullName, role, nameidentifier=UserID
  - Expiration: Jwt:AccessTokenMinutes
  - Signing key: Jwt:AccessTokenSecret
- CreateRefreshToken(int userId)
  - Claims: sub=userId, nameidentifier=userId
  - Expiration: Jwt:RefreshTokenDays
  - Signing key: Jwt:RefreshTokenSecret
- ValidateRefreshToken(string token)
  - Use Jwt:RefreshTokenSecret and same Issuer/Audience

5) Controllers and Endpoints
- AuthController (Route: /api/auth)
  - POST /login
    - Input: { email, password }
    - Steps: find user by Email; check IsActive; verify BCrypt password; issue access+refresh; save RefreshTokens row; return user info + tokens
  - POST /refresh-token
    - Input: { refreshToken }
    - Steps: find RefreshTokens row valid & not revoked & not expired; ValidateRefreshToken(); retrieve user; issue new accessToken; return { accessToken }
  - POST /logout
    - Input: { refreshToken }
    - Steps: mark RefreshTokens.IsRevoked = true
- GoogleAuthController (can be merged with AuthController)
  - POST /login-google
    - Input: { token } where token = Google ID token from FE
    - Steps: validate with GoogleJsonWebSignature using Google:ClientId; find user by Email; if not exists create user
      - Generate Username unique (use email prefix + suffix if needed)
      - PasswordHash = BCrypt hash of random string (not used for manual login)
      - Set EmailVerified=true, Role="customer", IsActive=true
      - Map AvatarUrl=payload.Picture
    - Issue access+refresh; save RefreshTokens; return user + tokens

6) DTOs
- LoginDto { string Email, string Password }
- RefreshDto { string RefreshToken }
- GoogleLoginDto { string Token }

7) Password hashing
- Use BCrypt.Net-Next
- Create/seed users with BCrypt.HashPassword(plain)
- Verify with BCrypt.Verify(input, hash)

8) Authorization on protected endpoints
- Decorate controllers/actions with [Authorize]
- To access current user ID:
  - var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)

9) Response contracts (example)
- POST /login, /login-google
  - 200 OK { message, data: { id, fullName, email, role, emailVerified, avatar, accessToken, refreshToken } }
  - 400 BadRequest { message }
  - 403 Forbidden { message }
- POST /refresh-token
  - 200 OK { message, data: { accessToken } }
  - 401 Unauthorized { message }
- POST /logout
  - 200 OK { message }

10) Security considerations
- Secrets: use long random AccessTokenSecret/RefreshTokenSecret
- Issuer/Audience consistent between create and validate
- Short access token TTL; longer refresh TTL; allow rotation if desired
- Rate-limit /login and /login-google
- If storing refreshToken in cookies: set HttpOnly, Secure, SameSite=None (over HTTPS), add CORS AllowCredentials
- If using body for refreshToken (as above), keep it only in memory on FE where possible

11) CORS/cookies (optional)
- If you decide to use cookies for refresh:
  - Add cookie policy and CORS with AllowCredentials
  - Set cookie in responses and read from Request.Cookies on refresh/logout

12) Minimal code placement
- Domain/Entities: AppUser.cs, RefreshToken.cs
- Infrastructure/Data: AppDbContext.cs
- Services: TokenService.cs
- Controllers: AuthController.cs (and GoogleAuthController.cs or combine)
- Program.cs and appsettings.json configured as above

13) Testing checklist
- Seed a user with known email/password (BCrypt hash) and test /login
- Test Google ID token flow with GIS on FE; confirm user auto-creation and Username uniqueness
- Verify /refresh-token returns new accessToken and rejects revoked/expired tokens
- Verify [Authorize] endpoints work with Authorization: Bearer <accessToken>
- Verify logout revokes refresh and subsequent refresh fails

