# Network Error Fix Guide

## The Problem
When running React Native on Android, `localhost` doesn't work because the app runs on a different device/emulator than your backend server.

## ✅ Solution Applied
I've updated `frontend/src/config.js` to use `http://10.0.2.2:5003/api` which is the Android Emulator's special IP address to access your computer's localhost.

## Testing Steps

### If you're using Android Emulator:
1. The app should now work! Just reload the app:
   - Press `r` in the Metro bundler terminal
   - Or shake your device and tap "Reload"

### If you're using a Physical Android Device:
1. **Find your computer's IP address:**
   - Open Command Prompt (CMD)
   - Type: `ipconfig`
   - Look for "IPv4 Address" under your active network adapter
   - It will look like: `192.168.x.x` or `10.0.x.x`

2. **Update the config file:**
   - Open `frontend/src/config.js`
   - Comment out line 5: `// export const API_URL = 'http://10.0.2.2:5003/api';`
   - Uncomment and update line 12 with your IP:
     ```javascript
     export const API_URL = 'http://YOUR_IP_ADDRESS:5003/api';
     ```
   - Example: `export const API_URL = 'http://10.219.31.35:5003/api';`

3. **Make sure your phone and computer are on the same WiFi network**

4. **Allow firewall access:**
   - Windows may block the connection
   - When prompted, allow Node.js through the firewall
   - Or manually add a rule in Windows Firewall for port 5003

### If you're using iOS Simulator:
1. Open `frontend/src/config.js`
2. Comment out the Android line
3. Uncomment: `export const API_URL = 'http://localhost:5003/api';`

## Verify Backend is Running
Make sure your backend server is running on port 5003:
- Check the terminal running `npm run dev` in the backend folder
- You should see: "Server running on port 5003"
- Test in browser: Open `http://localhost:5003` - you should see "School Management App API is running"

## Quick Test
After updating the config:
1. Reload the React Native app
2. Try to login with: `admin@school.com` / `admin123`
3. If it works, you'll see the Dashboard!

## Still Having Issues?

### Check if backend is accessible:
1. Open your phone's browser
2. Navigate to: `http://YOUR_IP_ADDRESS:5003`
3. You should see: "School Management App API is running"
4. If not, it's a network/firewall issue

### Common Issues:
- ❌ **Firewall blocking**: Disable Windows Firewall temporarily to test
- ❌ **Different WiFi networks**: Ensure phone and PC are on same network
- ❌ **VPN active**: Disable VPN on your computer
- ❌ **Wrong IP address**: Double-check your IP with `ipconfig`
- ❌ **Backend not running**: Check if `npm run dev` is active in backend folder

## Current Configuration
- Backend: Running on `http://localhost:5003`
- Frontend: Configured to use `http://10.0.2.2:5003/api` (Android Emulator)
