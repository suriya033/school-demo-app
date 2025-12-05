# 🔐 School App Login Guide

## ✅ Valid Login Credentials

All accounts use the same password: **`password123`**

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@school.com` | `password123` |
| **staff** | `staff@school.com` | `password123` |
| **Student** | `student@school.com` | `password123` |

---

## 🛠️ If You're Getting "Invalid Credentials" Error

### Step 1: Check Backend Server
Make sure the backend is running:

```powershell
# Navigate to backend folder
cd "c:\Users\gopi\Desktop\school app\backend"

# Start the server
npm start
```

You should see:
```
✅ MongoDB Atlas Connected Successfully!
Server running on port 5000
```

### Step 2: Verify Network Configuration

The frontend needs to connect to the backend. The configuration depends on how you're running the app:

#### **For Android Emulator** (RECOMMENDED - Already configured!)
- The app is now configured to use `http://10.0.2.2:5000/api`
- This is the Android Emulator's special IP to access your computer's localhost
- **Just reload your app!**

#### **For Physical Android Device**
1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., `192.168.1.5`)

2. Update `frontend\src\config.js`:
   ```javascript
   // Comment out line 5:
   // export const API_URL = 'http://10.0.2.2:5000/api';
   
   // Uncomment and update line 12:
   export const API_URL = 'http://YOUR_IP_ADDRESS:5000/api';
   ```

3. Make sure:
   - Your phone and computer are on the **same WiFi network**
   - Windows Firewall allows Node.js (port 5000)

#### **For iOS Simulator**
Update `frontend\src\config.js`:
```javascript
export const API_URL = 'http://localhost:5000/api';
```

### Step 3: Reload the App
After changing the config:
1. In the Metro bundler terminal, press `r` to reload
2. Or shake your device and tap "Reload"
3. Try logging in again with the credentials above

---

## 🧪 Test Backend Directly

To verify the backend is working, open your browser and go to:
- **http://localhost:5000** - You should see "School Management App API is running"

Or test the login API:
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@school.com","password":"password123"}'
```

If this returns a token, the backend is working correctly!

---

## 🔥 Quick Fix Checklist

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] MongoDB connection is successful (check backend terminal)
- [ ] Frontend config.js has correct API_URL for your setup
- [ ] App has been reloaded after config changes
- [ ] Using correct credentials: `admin@school.com` / `password123`

---

## 🆘 Still Not Working?

### Check if backend is accessible from your device:
1. Open your device's browser
2. Navigate to the API_URL you configured (without `/api`)
3. You should see: "School Management App API is running"
4. If not, it's a network/firewall issue

### Common Issues:
- **Firewall blocking**: Temporarily disable Windows Firewall to test
- **Different WiFi networks**: Ensure phone and PC are on same network
- **VPN active**: Disable VPN on your computer
- **Wrong IP address**: Double-check with `ipconfig`
- **Backend not running**: Check if `npm start` is active in backend folder
- **Typo in credentials**: Make sure email and password are exactly as shown above

---

## 📱 Current Setup

- **Backend**: Running on `http://localhost:5000`
- **Frontend**: Configured for Android Emulator (`http://10.0.2.2:5000/api`)
- **Database**: MongoDB Atlas (connected)
- **Users**: Seeded with admin, staff, and student accounts
