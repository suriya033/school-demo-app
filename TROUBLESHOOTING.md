# 🔧 Login Error Fix - Troubleshooting Guide

## Problem
The mobile app cannot connect to the backend server running on your PC.

## Root Cause
Windows Firewall is blocking incoming connections to port 5003 from your mobile device.

## ✅ Solution Steps

### Step 1: Allow Node.js through Windows Firewall

1. Press `Windows + R` and type: `wf.msc` then press Enter
2. Click on "Inbound Rules" in the left panel
3. Click "New Rule..." in the right panel
4. Select "Port" and click Next
5. Select "TCP" and enter "5003" in Specific local ports
6. Click Next
7. Select "Allow the connection"
8. Click Next
9. Check all three boxes (Domain, Private, Public)
10. Click Next
11. Name it "School App Backend" and click Finish

### Step 2: Verify Your Connection Method

You have two options to connect:

**Option A: Local IP (STABLE - Recommended)**
Current IP: **10.219.31.35**
URL: `http://10.219.31.35:5003/api`
*This is the most reliable method. Ensure your phone and PC are on the same Wi-Fi.*

**Option B: Localtunnel (Backup - Use if on different networks)**
The app has a backup URL: `https://nine-states-pay.loca.lt/api`
*Tunnels can sometimes be unstable and show 503 errors if the connection drops.*
(To use this, update `frontend/src/config.js`)

### Step 4: Test the Connection

From your PC, run:
```powershell
curl http://10.219.31.35:5003/test
```

If this works, your firewall is configured correctly.

### Step 5: Restart Everything

1. Stop the backend server (Ctrl+C in the terminal)
2. Start it again: `npm run dev`
3. In Expo Go on your phone, long-press the app and select "Forget Project"
4. Restart Metro Bundler: `npx expo start -c`
5. Scan the QR code again

## 🔐 Test Credentials

Use these credentials to test login:

**Staff Account:**
- Email: `staff@school.com`
- Password: `password123`

**Student Account:**
- Email: `student@school.com`  
- Password: `password123`

**Admin Account:**
- Email: `admin@school.com`
- Password: `password123`

## 📊 Verify Database

The test script confirmed:
- ✅ MongoDB is connected
- ✅ Users exist in database
- ✅ Passwords are correctly hashed
- ✅ Login authentication works

## 🐛 Debugging

If login still fails, check the backend terminal for these logs:
- `Login attempt for: [email]`
- `Login successful` or error messages
- `✅ Sending login response`

The mobile app will show the exact error message and the API URL it's trying to connect to.

## Common Issues

### "Request failed" or "Network Error"
- Firewall is blocking the connection
- IP address has changed (run `ipconfig` again)
- Backend server is not running

### "Invalid Credentials"
- Wrong email or password
- User doesn't exist in database

### "Server Error"
- Check backend terminal for error logs
- MongoDB connection might be down
