# ── Stage 1: Build ──────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies first
COPY PgManager/PgManager.csproj PgManager/
RUN dotnet restore PgManager/PgManager.csproj

# Copy the rest of the source and publish
COPY PgManager/ PgManager/
RUN dotnet publish PgManager/PgManager.csproj -c Release -o /app/out

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl/unzip, download ngrok, and clean up
RUN apt-get update && apt-get install -y curl unzip \
    && curl -s https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz -o ngrok.tgz \
    && tar xvzf ngrok.tgz -C /usr/local/bin \
    && rm ngrok.tgz && apt-get clean

COPY --from=build /app/out .

# Copy and make the startup script executable
COPY render-start.sh .
RUN chmod +x render-start.sh

# Port configuration
ENV ASPNETCORE_URLS=http://+:${PORT:-10000}
EXPOSE 10000

# The custom script starts both .NET and ngrok
ENTRYPOINT ["./render-start.sh"]
