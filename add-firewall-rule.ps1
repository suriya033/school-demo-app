# This script adds a Windows Firewall rule to allow the School App backend server
# Run this as Administrator

Write-Host "Adding Windows Firewall rule for School App Backend..." -ForegroundColor Cyan

try {
    netsh advfirewall firewall add rule name="School App Backend" dir=in action=allow protocol=TCP localport=5003
    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The backend server can now accept connections on port 5003" -ForegroundColor Green
    Write-Host "You can now connect from your mobile device at: http://10.219.31.245:5003" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Failed to add firewall rule" -ForegroundColor Red
    Write-Host "Please run this script as Administrator" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run:" -ForegroundColor Yellow
    Write-Host "  .\add-firewall-rule.ps1" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
