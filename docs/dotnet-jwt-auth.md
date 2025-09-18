# JWT Auth cho ASP.NET Core + SQL Server

Tài liệu rút gọn để mang JWT + Refresh Token sang dự án ASP.NET Core (Web API) dùng SQL Server/EF Core.

## 1) NuGet packages

- Microsoft.AspNetCore.Authentication.JwtBearer
- System.IdentityModel.Tokens.Jwt
- Microsoft.EntityFrameworkCore
- Microsoft.EntityFrameworkCore.SqlServer
- Microsoft.EntityFrameworkCore.Tools

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
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=YourDb;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

## 3) DbContext + Entities (User tối thiểu + RefreshToken)

```csharp
public class AppUser
{
    public Guid Id { get; set; }
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Role { get; set; } = "customer";
    public bool IsActive { get; set; } = true;
    public bool EmailVerified { get; set; } = false;
    public string? Avatar { get; set; }
}

public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = default!;
    public string UserAgent { get; set; } = default!;
    public string IpAddress { get; set; } = default!;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public AppUser User { get; set; } = default!;
}

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<AppUser>().HasIndex(u => u.Email).IsUnique();
        b.Entity<RefreshToken>().HasIndex(r => r.Token).IsUnique();
        base.OnModelCreating(b);
    }
}
```

## 4) Program.cs (cấu hình EF Core + JWT Bearer)

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtSection = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSection["AccessTokenSecret"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSection["Issuer"],
        ValidAudience = jwtSection["Audience"],
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

## 5) TokenService (tạo Access/Refresh token + verify refresh)

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
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("fullName", user.FullName),
            new Claim(ClaimTypes.Role, user.Role)
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

    public string CreateRefreshToken(Guid userId)
    {
        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["RefreshTokenSecret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[] { new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()) };
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
        var tokenParams = new TokenValidationParameters
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
        try
        {
            return handler.ValidateToken(token, tokenParams, out _);
        }
        catch { return null; }
    }
}
```

## 6) AuthController (login, refresh, logout)

```csharp
[ApiController]
[Route("api/auth")] 
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokenSvc;
    public AuthController(AppDbContext db, TokenService tokenSvc)
    { _db = db; _tokenSvc = tokenSvc; }

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
        var refresh = _tokenSvc.CreateRefreshToken(user.Id);
        var expires = DateTime.UtcNow.AddDays(7);
        _db.RefreshTokens.Add(new RefreshToken {
            UserId = user.Id,
            Token = refresh,
            UserAgent = Request.Headers["User-Agent"].ToString() ?? "unknown",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            ExpiresAt = expires,
            IsRevoked = false
        });
        await _db.SaveChangesAsync();

        return Ok(new { message = "Đăng nhập thành công", data = new {
            id = user.Id, fullName = user.FullName, email = user.Email,
            role = user.Role, emailVerified = user.EmailVerified,
            accessToken = access, refreshToken = refresh
        }});
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> Refresh([FromBody] RefreshDto dto)
    {
        var tokenDoc = await _db.RefreshTokens
            .FirstOrDefaultAsync(x => x.Token == dto.RefreshToken && !x.IsRevoked && x.ExpiresAt > DateTime.UtcNow);
        if (tokenDoc == null) return Unauthorized(new { message = "Refresh token không hợp lệ hoặc hết hạn" });

        var principal = _tokenSvc.ValidateRefreshToken(dto.RefreshToken);
        if (principal == null) {
            tokenDoc.IsRevoked = true; await _db.SaveChangesAsync();
            return Unauthorized(new { message = "Refresh token không hợp lệ" });
        }

        var userId = Guid.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
        var user = await _db.Users.FindAsync(userId);
        if (user == null || !user.IsActive) return Unauthorized(new { message = "Người dùng không tồn tại hoặc bị khóa" });

        var newAccess = _tokenSvc.CreateAccessToken(user);
        return Ok(new { message = "Token đã được làm mới", data = new { accessToken = newAccess }});
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshDto dto)
    {
        var tokenDoc = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == dto.RefreshToken && !x.IsRevoked);
        if (tokenDoc != null) { tokenDoc.IsRevoked = true; await _db.SaveChangesAsync(); }
        return Ok(new { message = "Đăng xuất thành công" });
    }
}

public record LoginDto(string Email, string Password);
public record RefreshDto(string RefreshToken);
```

## 7) Sử dụng [Authorize]

```csharp
[ApiController]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    [Authorize]
    [HttpGet]
    public IActionResult Me() => Ok(new { message = "Authorized" });
}
```

## 8) Checklist porting

- Thêm packages, cấu hình appsettings, Program.cs
- Tạo AppDbContext, AppUser, RefreshToken, chạy migration
- Thêm TokenService và AuthController
- Dùng BCrypt.Net-Next để hash/verify mật khẩu khi tạo user
- Bảo mật: đặt secrets dài, đồng bộ Issuer/Audience giữa phát hành và validate

