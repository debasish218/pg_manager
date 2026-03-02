#!/bin/bash
# ============================================================
# PG Manager — Start Backend + ngrok Tunnel
# Run this once whenever you want to share the app externally:
#   chmod +x start-server.sh  (first time only)
#   ./start-server.sh
# ============================================================

BACKEND_DIR="$(cd "$(dirname "$0")/PgManager" && pwd)"
PORT=5294

echo "🚀 Starting PG Manager backend..."
cd "$BACKEND_DIR"
dotnet run &
DOTNET_PID=$!

echo "⏳ Waiting for backend to be ready on port $PORT..."
until curl -s "http://localhost:$PORT/api/tenants" > /dev/null 2>&1; do
    sleep 1
done

echo "✅ Backend is up!"
echo ""
echo "🌐 Starting ngrok tunnel on port $PORT..."
echo "────────────────────────────────────────────"
echo "  Open the app → Settings → Connection Settings"
echo "  Paste the URL shown below (the https:// line)"
echo "────────────────────────────────────────────"
echo ""

# Start ngrok — the public URL will be printed by ngrok itself
ngrok http $PORT

# When ngrok exits (Ctrl+C), also stop the backend
kill $DOTNET_PID 2>/dev/null
