using Microsoft.EntityFrameworkCore;
using TheMoods.Data.Contexts;
using TheMoods.Data.Initializer;

// Enable Npgsql legacy timestamp behavior to handle DateTime with Kind=Unspecified seamlessly
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add TenantDbContext with a default PostgreSQL connection for design-time/migrations
builder.Services.AddDbContext<TenantDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Host=localhost;Port=5432;Database=themoods_tie;Username=postgres;Password="));

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Enable CORS for localhost and production subdomains
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

var app = builder.Build();

// Seed database and apply migrations on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<TenantDbContext>();

    // 1. Luôn chạy DbInitializer trước để các cột cần thiết (IsNightShift, TotalShiftAllowance, ShiftExtensions) luôn được đảm bảo tồn tại ngay cả khi EF Migration bị lỗi
    try
    {
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing schema/seeding database.");
    }

    // 2. Chạy Migration (nếu có lỗi thì ghi log, không làm crash app)
    try
    {
        context.Database.Migrate();
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "An error occurred while running EF Core migrations (skipped to keep app running).");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors();

app.MapControllers();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
