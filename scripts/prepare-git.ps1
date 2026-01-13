# PowerShell 脚本：准备 Git 推送

Write-Host "检查大文件..." -ForegroundColor Yellow
Get-ChildItem -Recurse -File | Where-Object { $_.Length -gt 1MB -and $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.next*" -and $_.FullName -notlike "*.git*" } | Select-Object -First 20 FullName, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}

Write-Host "`n检查 .gitignore..." -ForegroundColor Yellow
Get-Content .gitignore

Write-Host "`nGit 状态：" -ForegroundColor Yellow
git status --short | Select-Object -First 20

Write-Host "`n准备推送到 GitHub..." -ForegroundColor Green
Write-Host "运行以下命令：" -ForegroundColor Cyan
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Add contact author component and prepare for deployment'" -ForegroundColor White
Write-Host "  git remote add origin https://github.com/MyraWang0406/ADX-experiment.git" -ForegroundColor White
Write-Host "  git branch -M main" -ForegroundColor White
Write-Host "  git push -u origin main" -ForegroundColor White





