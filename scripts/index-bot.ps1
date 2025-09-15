param(
    [string]$action = "start"
)
# 启动 index.js
$nodePath = "node"
$scriptPath = "d:\dingidng\NotificationBot\start.js"
$pidFile = "d:\dingidng\NotificationBot\data\index-bot.pid"

function StartBot {
    if (Test-Path $pidFile) {
        Write-Host "Bot Already running."
        return
    }
    $proc = Start-Process -FilePath $nodePath -ArgumentList $scriptPath -WindowStyle Hidden -PassThru
    $proc.Id | Out-File $pidFile
    Write-Host "Bot Started."
}

function StopBot {
    if (Test-Path $pidFile) {
        $botPid = Get-Content $pidFile
        Stop-Process -Id $botPid -Force
        Remove-Item $pidFile
        Write-Host "Bot Closed."
    } else {
        Write-Host "Bot Not running."
    }
}

function RestartBot {
    StopBot
    StartBot
}

switch ($action) {
    "start"   { StartBot }
    "stop"    { StopBot }
    "restart" { RestartBot }
    default   { Write-Host "usage: .\\index-bot.ps1 [start|stop|restart]" }
}