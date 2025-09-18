# Đăng nhập Google cho ASP.NET Core + SQL Server

Kịch bản: FE lấy Google ID token (Google Identity Services) và gửi lên BE. BE xác thực ID token với Google, tìm/tạo user trong SQL, sau đó phát hành JWT + Refresh Token (theo tài liệu dotnet-jwt-auth.md).

## 1) NuGet packages

- Google.Apis.Auth
- BCrypt.Net-Next
- Microsoft.EntityFrameworkCore (+ SqlServer, Tools)
- Microsoft.AspNetCore.Authentication.JwtBearer (đã có ở jwt doc)

## 2) appsettings.json

```json
{
  "Google": {
    "ClientId": "999755754993-k18l7lqno6dossajbp6mnt4vcqjnhc7o.apps.googleusercontent.com"
  }
}
```

Lưu ý: ClientId phải trùng với client ID cấu hình trên Google Cloud Console.

## 3) Program.cs (đọc cấu hình, dịch vụ)

Không bắt buộc cấu hình middleware OAuth nếu bạn chỉ nhận ID token từ FE. Chỉ cần giữ cấu hình JWT như trong dotnet-jwt-auth.md. Đảm bảo đã đăng ký AppDbContext, TokenService.

## 4) DTO

```csharp
public record GoogleLoginDto(string Token); // Google ID token
```

## 5) Controller: LoginWithGoogle

```csharp
using Google.Apis.Auth;

[ApiController]
[Route("api/auth")] 
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenSvc;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, TokenService tokenSvc, IConfiguration config)
    { _db = db; _tokenSvc = tokenSvc; _config = config; }

    [HttpPost("login-google")]
    public async Task<IActionResult> LoginWithGoogle([FromBody] GoogleLoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest(new { message = "Thiếu Google token" });

        var clientId = _config["Google:ClientId"];
        if (string.IsNullOrEmpty(clientId))
            return StatusCode(500, new { message = "Chưa cấu hình Google:ClientId" });

        // Xác thực ID token với Google
        GoogleJsonWebSignature.Payload payload;
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { clientId }
            };
            payload = await GoogleJsonWebSignature.ValidateAsync(dto.Token, settings);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Token Google không hợp lệ", detail = ex.Message });
        }

        if (payload == null || string.IsNullOrEmpty(payload.Email))
            return BadRequest(new { message = "Không đọc được thông tin email từ Google" });

        // Tìm hoặc tạo user
        var email = payload.Email.ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            // Tạo password ngẫu nhiên để thỏa DB constraint, không dùng cho đăng nhập tay
            var randomPwd = Guid.NewGuid().ToString("N").Substring(0, 10) + "Aa1!";
            var hash = BCrypt.Net.BCrypt.HashPassword(randomPwd);

            user = new AppUser
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = hash,
                FullName = string.IsNullOrWhiteSpace(payload.Name) ? email.Split('@')[0] : payload.Name,
                Avatar = payload.Picture,
                EmailVerified = payload.EmailVerified ?? true,
                IsActive = true,
                Role = "customer"
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        else
        {
            if (!user.EmailVerified)
            {
                user.EmailVerified = true;
                await _db.SaveChangesAsync();
            }
        }

        if (!user.IsActive)
            return StatusCode(403, new { message = "Tài khoản của bạn đã bị khóa" });

        // Phát hành token theo TokenService
        var access = _tokenSvc.CreateAccessToken(user);
        var refresh = _tokenSvc.CreateRefreshToken(user.Id);

        var expires = DateTime.UtcNow.AddDays(7);
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = refresh,
            UserAgent = Request.Headers["User-Agent"].ToString() ?? "unknown",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            ExpiresAt = expires,
            IsRevoked = false
        });
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Đăng nhập với Google thành công",
            data = new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                role = user.Role,
                emailVerified = user.EmailVerified,
                avatar = user.Avatar,
                accessToken = access,
                refreshToken = refresh
            }
        });
    }
}
```

## 6) Route

- Đã đặt [Route("api/auth")] và [HttpPost("login-google")] trong controller.
- FE gửi: POST /api/auth/login-google { token }

## 7) Frontend flow (tối giản)

- Lấy ID token từ Google Identity Services (OneTap hoặc gsi)
- Gửi lên BE: body { token: googleIdToken }
- Nhận về accessToken, refreshToken, user info

## 8) Ghi chú bảo mật

- Chỉ validate Audience = Google:ClientId của bạn
- Có thể thêm kiểm tra domain email (whitelist) nếu cần
- Rate-limit endpoint
- Ở production, hãy xử lý refresh token an toàn (HTTP-only cookie hoặc body tuỳ bạn), đồng bộ với flow ở dotnet-jwt-auth.md

## 9) Checklist

- Thêm Google.Apis.Auth và BCrypt.Net-Next
- Thêm Google:ClientId vào appsettings
- Copy action LoginWithGoogle và sửa namespace/entity nếu khác
- Bảo đảm tồn tại TokenService, AppDbContext, AppUser, RefreshToken
- Liên kết refresh/logout/authorize giống dotnet-jwt-auth.md

