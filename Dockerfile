# ── Stage 1: Build ──────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies first (layer-cache friendly)
COPY PgManager/PgManager.csproj PgManager/
RUN dotnet restore PgManager/PgManager.csproj

# Copy the rest of the source and publish
COPY PgManager/ PgManager/
RUN dotnet publish PgManager/PgManager.csproj -c Release -o /app/out

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/out .

# Render dynamically assigns a PORT — ASP.NET Core must listen on it
ENV ASPNETCORE_URLS=http://+:${PORT:-10000}
EXPOSE 10000

ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-10000} dotnet PgManager.dll"]
