# ASP.NET Core JWT + Google Login (Áp dụng cho schema SQL hiện tại)

Schema bạn cung cấp có bảng [dbo].[Users] (UserID int identity, Username, Email, PasswordHash, FullName, AvatarUrl, Role, IsActive, EmailVerified, ...). Dưới đây là phiên bản đã chỉnh hoàn toàn khớp với DB của bạn (khóa chính int, tên cột, ràng buộc NOT NULL, v.v.).

## 1) NuGet
- Microsoft.AspNetCore.Authentication.JwtBearer
- System.IdentityModel.Tokens.Jwt
- Microsoft.EntityFrameworkCore
- Microsoft.EntityFrameworkCore.SqlServer
- Microsoft.EntityFrameworkCore.Tools
- BCrypt.Net-Next
- Google.Apis.Auth (cho Google login)

## 2) appsettings.json

```json
{
  "Jwt": {
    "Issuer": "your-issuer",
    "Audience": "your-audience",
    "AccessTokenSecret": "REPLACE_WITH_LONG_RANDOM_SECRET",
    "RefreshTokenSecret": "REPLACE_WITH_ANOTHER_LONG_SECRET",
    "AccessTokenMinutes": 60,
    "RefreshTokenDays": 7
  },
  "Google": {
    "ClientId": "YOUR_GOOGLE_OAUTH_CLIENT_ID"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=ksf00691_team03;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

## 3) Bản đồ Entity EF Core khớp bảng dbo.Users

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("Users")]
public class AppUser
{
    [Key]
    public int UserID { get; set; }

    [Required, MaxLength(50)]
    public string Username { get; set; } = default!;

    [Required, MaxLength(100)]
    public string Email { get; set; } = default!;

    [Required, MaxLength(255)]
    public string PasswordHash { get; set; } = default!;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = default!;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    [MaxLength(6)]
    public string? Gender { get; set; } // 'MALE' | 'FEMALE' | null (ràng buộc CHECK)

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    [Required, MaxLength(20)]
    public string Role { get; set; } = "customer";

    public bool IsActive { get; set; } = true;
    public bool EmailVerified { get; set; } = false;
    public bool PhoneVerified { get; set; } = false;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

## 4) Bảng RefreshTokens (thêm mới) + Entity

SQL tạo bảng (bạn có thể chạy kèm với script gốc):

```sql
CREATE TABLE [dbo].[RefreshTokens](
  [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [UserID] INT NOT NULL,
  [Token] NVARCHAR(500) NOT NULL,
  [UserAgent] NVARCHAR(255) NOT NULL,
  [IpAddress] NVARCHAR(50) NOT NULL,
  [ExpiresAt] DATETIME2(0) NOT NULL,
  [IsRevoked] BIT NOT NULL CONSTRAINT DF_RT_IsRevoked DEFAULT(0),
  [CreatedAt] DATETIME2(0) NOT NULL CONSTRAINT DF_RT_Created DEFAULT(sysdatetime()),
  CONSTRAINT FK_RT_Users FOREIGN KEY(UserID) REFERENCES [dbo].[Users](UserID),
  CONSTRAINT UQ_RT_Token UNIQUE(Token)
);
```

Entity:

```csharp
[Table("RefreshTokens")]
public class RefreshToken
{
    [Key]
    public int Id { get; set; }
    public int UserID { get; set; }
    [Required]
    public string Token { get; set; } = default!;
    [Required]
    public string UserAgent { get; set; } = default!;
    [Required]
    public string IpAddress { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTime CreatedAt { get; set; }

    [ForeignKey(nameof(UserID))]
    public AppUser User { get; set; } = default!;
}
```

## 5) DbContext

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<AppUser>().HasIndex(u => u.Username).IsUnique();
        b.Entity<AppUser>().HasIndex(u => u.Email).IsUnique();
        b.Entity<RefreshToken>().HasIndex(r => r.Token).IsUnique();
        base.OnModelCreating(b);
    }
}
```

## 6) Program.cs (JWT Bearer)

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwt = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwt["AccessTokenSecret"]!);

builder.Services.AddAuthentication(o =>
{
    o.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    o.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwt["Issuer"],
        ValidAudience = jwt["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddScoped<TokenService>();

builder.Services.AddControllers();
var app = builder.Build();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
```

## 7) TokenService: dùng khóa chính int (UserID)

```csharp
public class TokenService
{
    private readonly IConfiguration _config;
    public TokenService(IConfiguration config) => _config = config;

    public string CreateAccessToken(AppUser user)
    {
        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["AccessTokenSecret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserID.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("fullName", user.FullName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString())
        };
        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwt["AccessTokenMinutes"]!)),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string CreateRefreshToken(int userId)
    {
        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["RefreshTokenSecret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        };
        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(int.Parse(jwt["RefreshTokenDays"]!)),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateRefreshToken(string token)
    {
        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["RefreshTokenSecret"]!));
        var parms = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = key,
            ClockSkew = TimeSpan.Zero
        };
        var handler = new JwtSecurityTokenHandler();
        try { return handler.ValidateToken(token, parms, out _); }
        catch { return null; }
    }
}
```

## 8) AuthController (login/refresh/logout) theo bảng Users

```csharp
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenSvc;
    public AuthController(AppDbContext db, TokenService tokenSvc)
    { _db = db; _tokenSvc = tokenSvc; }

    public record LoginDto(string Email, string Password);
    public record RefreshDto(string RefreshToken);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var email = dto.Email.Trim().ToLower();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (user == null) return BadRequest(new { message = "Tài khoản không tồn tại" });
        if (!user.IsActive) return BadRequest(new { message = "Tài khoản bị khóa" });
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return BadRequest(new { message = "Thông tin đăng nhập sai" });

        var access = _tokenSvc.CreateAccessToken(user);
        var refresh = _tokenSvc.CreateRefreshToken(user.UserID);

        var expires = DateTime.UtcNow.AddDays(7);
        _db.RefreshTokens.Add(new RefreshToken {
            UserID = user.UserID,
            Token = refresh,
            UserAgent = Request.Headers["User-Agent"].ToString() ?? "unknown",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            ExpiresAt = expires,
            IsRevoked = false
        });
        await _db.SaveChangesAsync();

        return Ok(new {
            message = "Đăng nhập thành công",
            data = new {
                id = user.UserID,
                fullName = user.FullName,
                email = user.Email,
                role = user.Role,
                emailVerified = user.EmailVerified,
                avatar = user.AvatarUrl,
                accessToken = access,
                refreshToken = refresh
            }
        });
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> Refresh([FromBody] RefreshDto dto)
    {
        var tokenDoc = await _db.RefreshTokens
            .FirstOrDefaultAsync(x => x.Token == dto.RefreshToken && !x.IsRevoked && x.ExpiresAt > DateTime.UtcNow);
        if (tokenDoc == null) return Unauthorized(new { message = "Refresh token không hợp lệ hoặc hết hạn" });

        var principal = _tokenSvc.ValidateRefreshToken(dto.RefreshToken);
        if (principal == null)
        {
            tokenDoc.IsRevoked = true; await _db.SaveChangesAsync();
            return Unauthorized(new { message = "Refresh token không hợp lệ" });
        }
        var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub)!;
        if (!int.TryParse(userIdStr, out var userId))
            return Unauthorized(new { message = "Refresh token không hợp lệ" });

        var user = await _db.Users.FindAsync(userId);
        if (user == null || !user.IsActive) return Unauthorized(new { message = "Người dùng không tồn tại hoặc bị khóa" });

        var newAccess = _tokenSvc.CreateAccessToken(user);
        return Ok(new { message = "Token đã được làm mới", data = new { accessToken = newAccess } });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshDto dto)
    {
        var tokenDoc = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == dto.RefreshToken && !x.IsRevoked);
        if (tokenDoc != null) { tokenDoc.IsRevoked = true; await _db.SaveChangesAsync(); }
        return Ok(new { message = "Đăng xuất thành công" });
    }
}
```

## 9) Google Login (khớp cột Username/AvatarUrl)

```csharp
using Google.Apis.Auth;

[ApiController]
[Route("api/auth")]
public class GoogleAuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenSvc;
    private readonly IConfiguration _config;
    public GoogleAuthController(AppDbContext db, TokenService tokenSvc, IConfiguration config)
    { _db = db; _tokenSvc = tokenSvc; _config = config; }

    public record GoogleLoginDto(string Token);

    [HttpPost("login-google")]
    public async Task<IActionResult> LoginWithGoogle([FromBody] GoogleLoginDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Token))
            return BadRequest(new { message = "Thiếu Google token" });

        var clientId = _config["Google:ClientId"];
        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(dto.Token,
                new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { clientId! } });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Token Google không hợp lệ", detail = ex.Message });
        }

        if (payload == null || string.IsNullOrEmpty(payload.Email))
            return BadRequest(new { message = "Không đọc được email từ Google" });

        var email = payload.Email.ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            var username = email.Split('@')[0];
            // đảm bảo Username unique, nếu đụng thì thêm hậu tố
            var baseUsername = username; int suffix = 1;
            while (await _db.Users.AnyAsync(u => u.Username == username))
                username = baseUsername + suffix++;

            var randomPwd = Guid.NewGuid().ToString("N").Substring(0, 10) + "Aa1!";
            var hash = BCrypt.Net.BCrypt.HashPassword(randomPwd);

            user = new AppUser
            {
                Username = username,
                Email = email,
                PasswordHash = hash,
                FullName = string.IsNullOrWhiteSpace(payload.Name) ? baseUsername : payload.Name!,
                AvatarUrl = payload.Picture,
                EmailVerified = payload.EmailVerified ?? true,
                IsActive = true,
                Role = "customer"
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        else if (!user.EmailVerified)
        {
            user.EmailVerified = true;
            await _db.SaveChangesAsync();
        }

        if (!user.IsActive) return StatusCode(403, new { message = "Tài khoản của bạn đã bị khóa" });

        var access = _tokenSvc.CreateAccessToken(user);
        var refresh = _tokenSvc.CreateRefreshToken(user.UserID);
        _db.RefreshTokens.Add(new RefreshToken {
            UserID = user.UserID,
            Token = refresh,
            UserAgent = Request.Headers["User-Agent"].ToString() ?? "unknown",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });
        await _db.SaveChangesAsync();

        return Ok(new {
            message = "Đăng nhập Google thành công",
            data = new {
                id = user.UserID,
                fullName = user.FullName,
                email = user.Email,
                role = user.Role,
                emailVerified = user.EmailVerified,
                avatar = user.AvatarUrl,
                accessToken = access,
                refreshToken = refresh
            }
        });
    }
}
```

## 10) Gợi ý tích hợp nhanh
- Tạo bảng RefreshTokens bằng SQL trên, hoặc tạo migration từ EF Core.
- Dùng BCrypt.Net-Next khi tạo user tay: var hash = BCrypt.HashPassword(plainPassword);
- Ràng buộc Username NOT NULL/unique: khi tạo user qua Google, sinh Username an toàn.
- Gender có CHECK (MALE/FEMALE), nên để null nếu không xác định.
- Bảo mật: secrets đủ dài, đồng bộ Issuer/Audience giữa phát hành và validate.

