# Quick Start Guide - PG Manager

## 🚀 5-Minute Setup

### Prerequisites Checklist
- [ ] Node.js installed (`node --version`)
- [ ] .NET SDK installed (`dotnet --version`)
- [ ] MySQL running (`mysql -u root -p`)
- [ ] Expo Go app on phone
- [ ] Google Authenticator app on phone

---

## Step 1: Database Setup (2 minutes)

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE PG_Db;
exit;
```

## Step 2: Backend Setup (2 minutes)

```bash
cd PgManager/PgManager

# Edit appsettings.json - change MySQL password
nano appsettings.json
# Change: Pwd=YOUR_PASSWORD

# Apply migrations
dotnet ef database update

# Run backend
dotnet run --urls "http://0.0.0.0:5294"
```

✅ Backend running at http://0.0.0.0:5294

---

## Step 3: Mobile App (1 minute)

**Open NEW terminal:**
```bash
cd PgManager/PgManagerMobile

# Install dependencies (first time only)
npm install

# Start app
npx expo start
```

1. **Scan QR code** with Expo Go
2. App opens on your phone

---

## Step 4: First Login

### On Phone:
1. Tap **"Setup Authenticator"**
2. Enter phone: `+919348226710`
3. Enter name: `Admin`
4. Tap **"Generate Secret"**
5. **Scan QR** with Google Authenticator
6. Go back to app
7. Enter phone again
8. Enter **6-digit code** from Google Authenticator
9. Tap **"Login"**

🎉 **Done!** You're logged in!

---

## Adding Data

### Add First Room:
1. Go to **"Rooms"** tab
2. Tap **"+"** button
3. Fill details (Room 101, Double sharing, 2 beds, ₹5000/bed)
4. Tap **"Save"**

### Add First Tenant:
1. Go to **"Tenants"** tab
2. Tap **"+"** button
3. Fill details and select room
4. Tap **"Save"**

---

## Troubleshooting

**Can't see data:**
- Check backend terminal for errors
- Ensure backend shows: `=== RESPONSE STATUS: 200 ===`

**Network error:**
- Confirm phone and laptop on same WiFi
- Backend must use `http://0.0.0.0:5294`

**Empty rooms/tenants:**
- This is normal for new account!
- Add rooms first, then tenants

---

## Daily Use

```bash
# Terminal 1 - Backend
cd PgManager/PgManager
dotnet run --urls "http://0.0.0.0:5294"

# Terminal 2 - Mobile
cd PgManager/PgManagerMobile
npx expo start
```

Then scan QR and login!

---

## Multiple PGOwners

Each owner:
1. Opens app → "Setup Authenticator"
2. Uses **different** phone number
3. Gets their own Google Authenticator entry
4. Sees only their own rooms/tenants

**Data is completely isolated!**
