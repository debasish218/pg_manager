# ── Stage 1: Build ──────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies first
COPY PgManager.csproj .
RUN dotnet restore PgManager.csproj

# Copy the rest of the source and publish
COPY . .
RUN dotnet publish PgManager.csproj -c Release -o /app/out

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/out .

# Render dynamically assigns a PORT — ASP.NET Core respects this automatically in .NET 8
# We also provide a fallback via ASPNETCORE_URLS for local testing
ENV ASPNETCORE_URLS=http://+:${PORT:-10000}
EXPOSE 10000

# Simply run the app, ASP.NET Core 8 automatically listens on the PORT environment variable
ENTRYPOINT ["dotnet", "PgManager.dll"]
