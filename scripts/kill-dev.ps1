# PowerShell 脚本：终止占用端口 3000 的 Node.js 进程
# 使用方法：.\scripts\kill-dev.ps1

Write-Host "🔍 正在查找占用端口 3000 的进程..." -ForegroundColor Cyan

# 方法1：使用 netstat 查找占用端口的进程
$port = 3000
$processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "⚠️  发现以下进程占用端口 $port：" -ForegroundColor Yellow
    foreach ($pid in $processes) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  - PID: $pid, 进程名: $($proc.ProcessName), 路径: $($proc.Path)" -ForegroundColor Yellow
        }
    }
    
    # 只终止 Node.js 相关进程（避免误杀其他进程）
    $nodeProcesses = $processes | Where-Object {
        $proc = Get-Process -Id $_ -ErrorAction SilentlyContinue
        $proc -and ($proc.ProcessName -eq 'node' -or $proc.ProcessName -eq 'node.exe' -or $proc.Path -like '*node*')
    }
    
    if ($nodeProcesses) {
        Write-Host "`n🛑 正在终止 Node.js 进程..." -ForegroundColor Red
        foreach ($pid in $nodeProcesses) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "  ✅ 已终止进程 PID: $pid" -ForegroundColor Green
            } catch {
                Write-Host "  ⚠️  无法终止进程 PID: $pid: $_" -ForegroundColor Yellow
            }
        }
        Start-Sleep -Seconds 1
        Write-Host "`n✅ 清理完成！" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  未发现 Node.js 进程占用端口 $port" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ 端口 $port 未被占用" -ForegroundColor Green
}

# 方法2（可选）：如果安装了 kill-port，也可以使用
# 检查是否安装了 kill-port
$killPortInstalled = Get-Command npx -ErrorAction SilentlyContinue
if ($killPortInstalled) {
    Write-Host "`n💡 提示：你也可以使用 'npx kill-port 3000' 来终止端口占用" -ForegroundColor Cyan
}








