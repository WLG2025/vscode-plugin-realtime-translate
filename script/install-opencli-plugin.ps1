# OpenCLI 插件安装脚本
# 功能：将本项目的 opencli 插件安装到系统目录

$ErrorActionPreference = "Stop"

# 配置
$ProjectName = "my-bing"
$SourceDir = Join-Path $PSScriptRoot ".." "opencli"
$TargetBaseDir = Join-Path $env:USERPROFILE ".opencli" "clis"
$TargetDir = Join-Path $TargetBaseDir $ProjectName

Write-Host "=== OpenCLI 插件安装 ===" -ForegroundColor Cyan
Write-Host "项目名称: $ProjectName"
Write-Host "源目录: $SourceDir"
Write-Host "目标目录: $TargetDir"
Write-Host ""

# 检查源目录是否存在
if (-not (Test-Path $SourceDir)) {
    Write-Host "错误: 源目录不存在: $SourceDir" -ForegroundColor Red
    exit 1
}

# 获取所有 .js 文件
$JsFiles = Get-ChildItem -Path $SourceDir -Filter "*.js" -File
if ($JsFiles.Count -eq 0) {
    Write-Host "错误: 在 $SourceDir 中未找到 .js 文件" -ForegroundColor Red
    exit 1
}

Write-Host "找到 $($JsFiles.Count) 个插件文件:" -ForegroundColor Green
foreach ($file in $JsFiles) {
    Write-Host "  - $($file.Name)" -ForegroundColor Gray
}
Write-Host ""

# 创建目标目录（如果不存在）
if (-not (Test-Path $TargetDir)) {
    Write-Host "创建目标目录: $TargetDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

# 复制文件
Write-Host "正在复制文件..." -ForegroundColor Yellow
foreach ($file in $JsFiles) {
    $targetPath = Join-Path $TargetDir $file.Name
    Copy-Item -Path $file.FullName -Destination $targetPath -Force
    Write-Host "  ✓ $($file.Name) -> $targetPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== 安装完成 ===" -ForegroundColor Cyan
Write-Host "插件已安装到: $TargetDir"
Write-Host "可以使用命令: opencli $ProjectName <command>" -ForegroundColor Green
