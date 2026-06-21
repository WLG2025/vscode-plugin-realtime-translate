# PowerShell 脚本 - 打包 VSCode 插件
# 文件: scripts/build-vsix.ps1

# 设置错误处理
$ErrorActionPreference = "Stop"

# 函数：打印彩色信息
function Write-Info([string]$Message) {
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning([string]$Message) {
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error([string]$Message) {
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# 检查 Node.js 是否安装
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js 未找到，请先安装 Node.js"
    exit 1
}

# 检查 npm 是否安装
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm 未找到，请先安装 Node.js"
    exit 1
}

Write-Info "开始打包 VSCode 插件..."

# 检查 package.json 是否存在
if (!(Test-Path "package.json")) {
    Write-Error "package.json 文件不存在"
    exit 1
}

# 安装依赖
Write-Info "正在安装项目依赖..."
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Error "安装依赖失败"
    exit 1
}

# 编译 TypeScript
Write-Info "正在编译 TypeScript..."
npm run compile

if ($LASTEXITCODE -ne 0) {
    Write-Error "TypeScript 编译失败"
    exit 1
}

# 检查 vsce 是否安装
if (!(Get-Command vsce -ErrorAction SilentlyContinue)) {
    Write-Info "vsce 未安装，正在全局安装..."
    npm install -g @vscode/vsce
}

# 打包为 vsix
Write-Info "正在打包为 VSIX 文件..."
$PackageName = (Get-Content package.json | ConvertFrom-Json).name
$PackageVersion = (Get-Content package.json | ConvertFrom-Json).version
$OutputFileName = "${PackageName}-${PackageVersion}.vsix"

vsce package -o $OutputFileName

if ($LASTEXITCODE -eq 0) {
    Write-Info "打包成功！VSIX 文件已生成: $OutputFileName"
    Write-Info "文件路径: $(Join-Path (Get-Location) $OutputFileName)"
} else {
    Write-Error "打包失败"
    exit 1
}

Write-Info "打包完成！"
