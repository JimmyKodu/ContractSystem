using ContractSystem.Core.Interfaces;
using ContractSystem.Infrastructure.Data;
using ContractSystem.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Database
builder.Services.AddDbContext<ContractDbContext>(options =>
{
    // 使用SQLite用于开发，实际部署时可改为SQL Server
    var dbPath = Path.Combine(builder.Environment.ContentRootPath, "contractsystem.db");
    options.UseSqlite($"Data Source={dbPath}");
});

// Configure Services
var uploadPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
builder.Services.AddScoped<IContractWorkflowService, ContractWorkflowService>();
builder.Services.AddScoped<IPdfService>(sp => 
{
    var context = sp.GetRequiredService<ContractDbContext>();
    return new PdfService(context, uploadPath);
});
builder.Services.AddScoped<IOcrService>(sp => 
{
    var tessDataPath = Path.Combine(builder.Environment.ContentRootPath, "tessdata");
    return new OcrService(tessDataPath);
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Initialize database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ContractDbContext>();
    context.Database.EnsureCreated();
    DbInitializer.Initialize(context);
}

app.Run();
