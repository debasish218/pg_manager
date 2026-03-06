#!/bin/bash

# Start .NET Backend listening on Render's dynamic PORT
export ASPNETCORE_URLS="http://+:${PORT:-10000}"
echo "Starting .NET backend on port ${PORT:-10000}..."
dotnet PgManager.dll &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend..."
until curl -s http://127.0.0.1:${PORT:-10000}/api/tenants > /dev/null; do
  sleep 1
done
echo "Backend is up!"

# Start ngrok targeting the backend port
echo "Starting ngrok tunnel..."
if [ -z "$NGROK_AUTHTOKEN" ]; then
    echo "WARNING: NGROK_AUTHTOKEN is not set in Render Environment Variables!"
fi

# We use the static domain configured in the mobile app.
ngrok http --domain=spoilless-supplely-lawerence.ngrok-free.dev ${PORT:-10000} &
NGROK_PID=$!

# Keep the container running
wait $BACKEND_PID
