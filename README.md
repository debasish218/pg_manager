# PG Manager - Complete Installation Guide

A full-stack PG (Paying Guest) management system with .NET backend and React Native (Expo) mobile application.

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Backend Setup (.NET API)](#backend-setup-net-api)
- [Mobile App Setup (React Native/Expo)](#mobile-app-setup-react-native-expo)
- [Running the Application](#running-the-application)
- [Features](#features)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software
1. **Node.js** (v18 or later)
   - Download: https://nodejs.org/
   - Verify: `node --version` && `npm --version`

2. **.NET SDK 8.0** (or later)
   - Download: https://dotnet.microsoft.com/download
   - Verify: `dotnet --version`

3. **MySQL Server** (v8.0 or later)
   - Download: https://dev.mysql.com/downloads/mysql/
   - Ensure MySQL is running on port 3306

4. **Expo Go** (Mobile App)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

5. **Google Authenticator** (Required for login)
   - iOS: [App Store](https://apps.apple.com/app/google-authenticator/id388497605)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2)

---

## 📁 Project Structure

```
PgManager/
├── PgManager/              # .NET Backend API
│   ├── Controllers/        # API Controllers
│   ├── Services/           # Business Logic
│   ├── Entities/           # Database Models
│   ├── Data/              # DbContext
│   ├── DTOs/              # Data Transfer Objects
│   ├── Migrations/        # EF Core Migrations
│   └── appsettings.json   # Configuration
│
├── PgManagerMobile/       # React Native Mobile App
│   ├── src/
│   │   ├── screens/       # App Screens
│   │   ├── context/       # State Management
│   │   ├── api/          # API Client
│   │   └── utils/        # Utilities
│   ├── App.js            # Entry Point
│   └── package.json      # Dependencies
│
└── README.md             # This file
```

---

## 🔙 Backend Setup (.NET API)

### 1. Navigate to Backend Directory
```bash
cd /path/to/PgManager/PgManager
```

### 2. Configure Database Connection
Edit `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=PG_Db;Uid=root;Pwd=YOUR_MYSQL_PASSWORD;"
  },
  "JwtSettings": {
    "Secret": "YourSuperSecretKeyThatIsAtLeast32CharactersLong123456",
    "ExpiresInDays": 365
  }
}
```
⚠️ **Replace `YOUR_MYSQL_PASSWORD` with your actual MySQL root password**

### 3. Restore Dependencies
```bash
dotnet restore
```

### 4. Create Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE PG_Db;
exit;
```

### 5. Apply Database Migrations
```bash
dotnet ef database update
```

This will create all required tables:
- `Users` - Authentication
- `Rooms` - Room management
- `Tenants` - Tenant information

### 6. Run Backend Server
```bash
dotnet run --urls "http://0.0.0.0:5294"
```

✅ Backend should now be running at `http://YOUR_IP:5294`

---

## 📱 Mobile App Setup (React Native/Expo)

### 1. Navigate to Mobile Directory
```bash
cd /path/to/PgManager/PgManagerMobile
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- Expo SDK 54
- React Navigation
- Axios (API client)
- AsyncStorage
- QR Code libraries

### 3. Start Expo Development Server
```bash
npx expo start
```

### 4. Connect Your Phone
1. **Ensure phone and laptop are on same WiFi network**
2. **Open Expo Go** on your phone
3. **Scan the QR code** displayed in terminal

---

## 🚀 Running the Application

### Complete Startup Sequence

**Terminal 1 - Backend:**
```bash
cd PgManager/PgManager
dotnet run --urls "http://0.0.0.0:5294"
```

**Terminal 2 - Mobile App:**
```bash
cd PgManager/PgManagerMobile
npx expo start
```

### First Time Setup

#### 1. Setup Authenticator (First User)
- Open app on your phone
- Tap **"Setup Authenticator"**
- Enter phone number (e.g., `+919348226710`)
- Enter your name
- Tap **"Generate Secret"**
- Scan QR code with **Google Authenticator**
- Note the 6-digit code from Google Authenticator

#### 2. Login
- Enter your phone number
- Enter the 6-digit code from Google Authenticator
- Tap **"Login"**

🎉 You're now logged in!

---

## ✨ Features

### 👤 Multi-User Support
- **Each PG owner has their own account**
- **Complete data isolation** - users can't see each other's data
- **Secure authentication** with Google Authenticator (TOTP)

### 🏠 Room Management
- Create and manage rooms
- Track room types (Single, Double, Triple, etc.)
- Monitor occupied/available beds
- Set rent per bed

### 👥 Tenant Management
- Add tenants to rooms
- Track rent payments
- View overdue tenants
- Automatic due amount calculation
- Payment history

### 📊 Dashboard
- Total rooms overview
- Active tenants count
- Overdue payments alerts
- Quick stats

### 👤 Account Section
- View logged-in user info
- Phone number display
- Logout functionality

---

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Google Authenticator** - 2FA protection
- **User Data Isolation** - Each owner sees only their data
- **Password-less** - No password to forget or hack

---

## 🐛 Troubleshooting

### Backend Issues

**"Cannot connect to MySQL"**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Start MySQL if not running
sudo systemctl start mysql
```

**"Table 'PG_Db.Users' doesn't exist"**
```bash
# Apply migrations
cd PgManager/PgManager
dotnet ef database update
```

**Port 5294 already in use**
```bash
# Find process using port
lsof -i :5294

# Kill process
kill -9 <PID>
```

### Mobile App Issues

**"Network Error" or "Cannot connect to backend"**
1. Ensure backend is running
2. Check both devices on same WiFi
3. Verify backend IP in mobile app matches your computer's IP
4. Run backend with: `dotnet run --urls "http://0.0.0.0:5294"`

**"Empty data" after login**
1. Check terminal for errors
2. Ensure you've created rooms/tenants
3. Verify JWT token is being saved (check AsyncStorage)

**Expo SDK Version Mismatch**
```bash
cd PgManagerMobile
npx expo install --fix
```

---

## 🗄️ Database Schema

### Users
- Id (Primary Key)
- PhoneNumber (Unique)
- Name
- TotpSecret (Google Authenticator secret)
- Role

### Rooms
- Id (Primary Key)
- **UserId** (Foreign Key - Owner)
- RoomNumber (Unique per user)
- SharingType (Single/Double/etc.)
- TotalBeds
- OccupiedBeds
- RentPerBed
- Floor

### Tenants
- Id (Primary Key)
- **UserId** (Foreign Key - Owner)
- Name
- PhoneNumber
- RoomId (Foreign Key)
- RentAmount
- AdvanceAmount
- JoinDate
- LastPaidDate
- DueAmount
- IsActive

---

## 📝 Important Notes

1. **Data Ownership**: All rooms and tenants are tied to the user who created them
2. **First User**: Gets UserId=1 and owns all pre-existing data
3. **Multi-Tenant**: Each PG owner manages their own property independently
4. **Google Authenticator**: Required - standard password login not supported
5. **Network**: Mobile app must be able to reach backend server

---

## 🔄 Common Workflows

### Adding a New PG Owner
1. User opens app → "Setup Authenticator"
2. Enters unique phone number
3. Scans QR with Google Authenticator
4. Logs in with TOTP code
5. Starts with empty rooms/tenants list

### Daily Operations
1. Open app (auto-login with saved token)
2. View dashboard for overview
3. Check "Tenants" tab for overdue payments
4. Add/edit rooms as needed
5. Track payments in tenant details

---

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review terminal logs for errors
3. Verify all prerequisites are installed

---

## 📜 License

MIT License - Free to use and modify

---

**Built with ❤️ using .NET & React Native (Expo)**
