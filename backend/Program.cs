using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

using demo_dotnet.backend.Data;
using demo_dotnet.backend.Data.Interfaces;
using demo_dotnet.backend.Data.Repositories;
using demo_dotnet.backend.exception;
using demo_dotnet.backend.Hubs;
using demo_dotnet.backend.Security;
using demo_dotnet.backend.Services;
using demo_dotnet.backend.Services.Interfaces;
using demo_dotnet.backend.Services.Interface;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// 1. KẾT NỐI DATABASE (PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. ĐĂNG KÝ REPOSITORIES & SERVICES (Dependency Injection)
builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IParentRepository, ParentRepository>();
builder.Services.AddScoped<IStudentParentRepository, StudentParentRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddSingleton<IEmailQueueService, EmailQueueService>();
builder.Services.AddHostedService<EmailWorkerService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IParentService, ParentService>();
builder.Services.AddScoped<IRoleService, RoleService>();

// 👈 2. BỔ SUNG: Dịch vụ SignalR
builder.Services.AddSignalR();
builder.Services.AddSingleton<Microsoft.AspNetCore.SignalR.IUserIdProvider, ChatUserIdProvider>();
builder.Services.AddOptions<ChatAttachmentOptions>()
    .Bind(builder.Configuration.GetSection(ChatAttachmentOptions.SectionName))
    .Validate(o => !string.IsNullOrWhiteSpace(o.StoragePath) && o.MaxFiles > 0 && o.MaxFiles <= 100 &&
        o.MaxFileBytes > 0 && o.MaxTotalBytes >= o.MaxFileBytes && o.MaxTotalBytes <= 1024L * 1024 * 1024 &&
        o.PendingHours > 0 && o.PendingHours <= 8760 && o.MaxImagePixels > 0 && o.MaxImagePixels <= 100_000_000,
        "Invalid chat attachment limits.")
    .ValidateOnStart();
builder.Services.AddSingleton<IFileStorageService, LocalFileStorageService>();
builder.Services.AddScoped<demo_dotnet.backend.Controllers.ChatUploadLimitsFilter>();
builder.Services.AddHostedService<ChatAttachmentCleanupService>();

// 3. CONTROLLERS & VALIDATION RESPONSE FORMAT
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .SelectMany(e =>
                {
                    var rawKey = e.Key;
                    var key = string.IsNullOrEmpty(rawKey)
                        ? "request"
                        : char.ToLowerInvariant(rawKey[0]) + (rawKey.Length > 1 ? rawKey[1..] : string.Empty);

                    return e.Value!.Errors.Select(err => new { Key = key, Message = err.ErrorMessage });
                })
                .ToLookup(x => x.Key, x => x.Message)
                .ToDictionary(g => g.Key, g => g.ToArray());

            var result = new
            {
                message = "Dữ liệu không hợp lệ",
                errors
            };

            return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(result);
        };
    });

// 4. JWT AUTHENTICATION
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret chưa được cấu hình trong appsettings.json");
var key = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };

    // 👈 3. BỔ SUNG: Cấu hình đọc JWT Token từ Query String "access_token" cho kết nối SignalR
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && 
                (path.StartsWithSegments("/hubs/chat") || path.StartsWithSegments("/api/v1/chat/attachments")))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// 5. AUTHORIZATION & DYNAMIC PERMISSION PROVIDER
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();

// 6. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendPolicy", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 7. SWAGGER GENERATOR
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Student Management System API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập token JWT dạng: Bearer {accessToken}"
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
    });
});

var app = builder.Build();

// 8. MIDDLEWARE PIPELINE
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 👈 4. BỔ SUNG: Map Route Endpoint cho SignalR Hub
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
