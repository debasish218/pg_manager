# PgManager Authentication Setup Guide

## Current Status
✅ Mobile app is running (port 8081)  
❌ Backend not accessible from mobile (port 5294)  

## How to Fix Backend Connection

### Step 1: Configure Backend to Listen on All Interfaces

The backend needs to listen on `0.0.0.0` (all network interfaces) instead of `localhost`.

**Option A: Using command line (temporary)**
```bash
cd /home/zadmin/Documents/PgManager/PgManager
dotnet run --urls "http://0.0.0.0:5294"
```

**Option B: Using launchSettings.json (permanent)**
Edit `/home/zadmin/Documents/PgManager/PgManager/Properties/launchSettings.json`:
```json
{
  "profiles": {
    "http": {
      "commandName": "Project",
      "applicationUrl": "http://0.0.0.0:5294",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

### Step 2: Test Backend
```bash
curl http://192.168.1.70:5294/api/tenants
```
Should return your tenant data (or 401 Unauthorized if auth is required).

## Authentication Flow - How to Access Your Data

### First Time Setup (One Time Only)

1. **Open the mobile app** → You'll see the Login screen
2. **Click "First time? Setup Authenticator"**
3. **Enter your phone number** (e.g., `+919876543210`)
4. **Click "Generate Secret"**
   - Backend creates a user in the database
   - Returns a secret key and QR code
5. **Scan the QR code** with Google Authenticator app
6. **Google Authenticator** now shows a 6-digit code that changes every 30 seconds

### Login (Every Time)

1. **Enter your phone number**
2. **Open Google Authenticator** app on your phone
3. **Copy the 6-digit code** from Google Authenticator
4. **Enter the code** in the mobile app
5. **Click "Login"**
6. ✅ **You're in!** You'll see all your data:
   - Home tab → Dashboard (stats, pending payments)
   - Tenants tab → All tenants
   - Rooms tab → All rooms

## Your Existing Data

### Where is it?
Your data is **safe in the MySQL database** (`PG_Db` database):
- `Tenants` table → All your tenant records
- `Rooms` table → All your room records  
- `Payments` table → All payment history

### How to access it?
**After successful login**, the app automatically:
1. Stores the JWT token from the backend
2. Sends this token with every API request
3. Backend validates the token and returns your data
4. App displays it in the UI

**Nothing is deleted or hidden** - the login just adds security so only authorized users can access the data.

## Troubleshooting

### "Network Error" when generating secret
- Backend is not running or not accessible
- Run backend with: `dotnet run --urls "http://0.0.0.0:5294"`
- Check firewall isn't blocking port 5294

### "Invalid code" when logging in
- Make sure Google Authenticator is synced (correct time)
- Code expires every 30 seconds, enter it quickly
- Make sure you're using the right phone number

### Can't see my data after login
- Check backend logs to see if requests are coming through
- Open browser dev tools / React Native debugger to see if JWT token is being sent
- JWT token should be in `Authorization: Bearer <token>` header

## Summary

**Authentication Flow:**
```
Setup (First Time):
Phone Number → Backend → Secret Key → QR Code → Google Authenticator

Login (Every Time):
Phone Number + Code from Authenticator → Backend validates → JWT Token → Access to all data
```

**Your Data:**
- Still in the MySQL database
- Accessible after successful login
- Nothing was deleted or changed
- Login just adds a security layer
