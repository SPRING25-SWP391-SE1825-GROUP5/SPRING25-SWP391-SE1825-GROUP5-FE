# Script mở Simple Browser trong Cursor/VS Code
# Sử dụng: .\open-preview.ps1

param(
    [string]$Url = "http://localhost:3000",
    [string]$Editor = "code"  # Có thể đổi thành "cursor" nếu dùng Cursor
)

Write-Host "🌐 Đang mở Simple Browser với URL: $Url" -ForegroundColor Cyan

# Thử các lệnh khác nhau tùy vào editor
$commands = @(
    "$Editor --command simpleBrowser.show $Url",
    "cursor --command simpleBrowser.show $Url",
    "code --command simpleBrowser.show $Url"
)

$success = $false
foreach ($cmd in $commands) {
    try {
        Invoke-Expression $cmd
        $success = $true
        Write-Host "✅ Đã mở Simple Browser!" -ForegroundColor Green
        break
    } catch {
        continue
    }
}

if (-not $success) {
    Write-Host "⚠️  Không thể mở Simple Browser tự động." -ForegroundColor Yellow
    Write-Host "📝 Hãy làm theo cách thủ công:" -ForegroundColor Yellow
    Write-Host "   1. Nhấn Ctrl+Shift+P" -ForegroundColor White
    Write-Host "   2. Gõ: Simple Browser: Show" -ForegroundColor White
    Write-Host "   3. Nhập: $Url" -ForegroundColor White
}

