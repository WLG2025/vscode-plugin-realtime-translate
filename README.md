# Realtime Translate - VSCode 插件
## 项目简介

Realtime Translate 是一款 VSCode 插件，为阅读英文 Markdown 文件的用户提供**实时翻译**能力。用户在编辑器中选中文本后，通过快捷键或按钮触发翻译，翻译结果展示在左侧侧边栏中，并可选地在编辑器中以悬浮窗形式展示。

## 功能特性

- **选中文本自动捕获**：在编辑器中选中文本后，自动填充到侧边栏的待翻译输入框
- **快捷键触发翻译**：默认 `Ctrl+Shift+Q` 快捷键触发翻译
- **按钮触发翻译**：侧边栏中的翻译按钮点击触发翻译
- **翻译结果展示**：翻译结果显示在侧边栏的只读文本框中
- **悬浮窗展示（可选）**：开启悬浮窗开关后，翻译成功时额外在编辑器选中文本旁边弹出悬浮窗显示翻译结果
- **翻译历史记录**：侧边栏保留最近的翻译历史记录，数量可配置，默认 10 条
- **请求节流**：避免频繁调用 API，具有防抖/节流机制
- **翻译缓存**：相同文本不重复请求，使用本地内存缓存
- **网络异常处理**：请求失败时给出友好提示，不阻塞后续操作
- **选中仅填充不翻译**：选中文本后仅填充到输入框，**不自动发起翻译请求**，避免频繁调用 API

## 安装依赖

在项目根目录下执行：

```bash
npm install
```

这会安装项目所需的所有依赖，包括 `@types/vscode`、`@types/node`、`typescript` 等。

## 打包插件

### 使用 PowerShell 脚本打包

项目提供了 PowerShell 脚本用于打包：

```powershell
# 进入项目根目录
cd "<项目根目录路径>"

# 运行打包脚本
.\script\build-vsix.ps1
```

脚本功能：
- 检查是否已安装 `vsce`
- 如未安装则自动安装
- 编译 TypeScript 代码
- 打包为 `.vsix` 文件
- 显示打包结果

### 手动打包

如果不想使用脚本，也可以手动执行：

```bash
# 1. 安装打包工具（首次使用时）
npm install -g @vscode/vsce

# 2. 编译代码
npm run compile

# 3. 打包为 vsix 文件
vsce package
```

打包完成后会在项目根目录生成 `realtime-translate-x.x.x.vsix` 文件。

## 安装插件

### 方法一：从 VSIX 文件安装

1. 在 VSCode 中打开命令面板（`Ctrl+Shift+P`）
2. 输入并选择 `Extensions: Install from VSIX...`
3. 选择打包生成的 `.vsix` 文件
4. 重启 VSCode

### 方法二：开发模式安装

1. 确保已安装依赖：`npm install`
2. 编译代码：`npm run compile`
3. 在 VSCode 中按 `F5` 运行调试配置

## 配置选项

插件提供以下配置项：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `realtimeTranslate.hoverEnabled` | `boolean` | `false` | 是否在编辑器中启用悬浮窗展示翻译结果 |
| `realtimeTranslate.token` | `string` | `""` | Bing 翻译 API 的 token |
| `realtimeTranslate.shortcut` | `string` | `"ctrl+shift+q"` | 触发翻译的快捷键 |
| `realtimeTranslate.historyLimit` | `number` | `10` | 翻译历史记录保留的最大条数 |

## 发布到 VSCode 市场

### 准备工作

1. **注册 Microsoft Partner Center 账户**：
   - 访问 [Partner Center](https://partner.microsoft.com/)
   - 注册成为发布者

2. **安装 `vsce` 工具**：
   ```bash
   npm install -g @vscode/vsce
   ```

3. **获取 Azure DevOps Personal Access Token**：
   - 登录 Azure DevOps
   - 创建个人访问令牌（PAT）
   - 选择 `Marketplace (Publish)` 范围

### 发布步骤

1. **登录到 Marketplace**：
   ```bash
   vsce login <publisher-name>
   ```
   其中 `<publisher-name>` 是你在 Partner Center 的发布者名称

2. **发布插件**：
   ```bash
   vsce publish
   ```
   
   或指定版本号：
   ```bash
   vsce publish --packagePath realtime-translate-x.x.x.vsix
   ```

### 版本管理

- 每次发布前需要更新 [package.json](./package.json) 中的版本号
- 版本号格式：`主版本号.次版本号.修订号`（例如 `1.0.0`）
- 使用语义化版本控制规范

### 注意事项

- 确保 [package.json](./package.json) 中包含必要字段：
  - `displayName`：插件显示名称
  - `description`：插件描述
  - `icon`：插件图标
  - `galleryBanner`：市场横幅
  - `repository`：仓库地址
  - `bugs`：问题跟踪地址

- 插件包大小不超过 32MB
- 确保所有依赖都正确声明
- 测试插件功能完整性

## 开发说明

### 项目结构

```
realtime-translate/
├── .vscodeignore          # 打包排除文件
├── package.json           # 插件清单（命令、快捷键、配置项）
├── tsconfig.json          # TypeScript 配置
├── README.md              # 本文档
├── spec.md                # 原始需求文档
├── spec_v2.md             # 规格文档 v2
├── scripts/
│   └── build-vsix.ps1     # PowerShell 打包脚本
├── icon.png               # 插件图标
├── node_modules/          # 依赖目录
├── out/                   # 编译输出目录
└── src/
    ├── extension.ts       # 插件入口
    ├── types.ts           # 类型定义
    ├── config.ts          # 配置管理
    ├── providers/
    │   ├── sidebarProvider.ts  # 侧边栏 Webview
    │   └── hoverProvider.ts    # 悬浮窗 Hover
    ├── translation/
    │   ├── bingService.ts      # Bing 翻译 API
    │   └── cache.ts            # 翻译缓存
    └── listeners/
        └── selectionListener.ts # 选中文本监听
```

### 主要模块

- **[extension.ts](./src/extension.ts)**：插件激活入口，注册命令、监听器、Provider
- **[types.ts](./src/types.ts)**：所有公共类型定义（API 请求/响应、消息协议、配置）
- **[config.ts](./src/config.ts)**：读取/更新 VSCode 配置项
- **[bingService.ts](./src/translation/bingService.ts)**：Bing 翻译 API 封装（HTTPS 请求 + 缓存）
- **[cache.ts](./src/translation/cache.ts)**：基于 Map 的翻译缓存
- **[sidebarProvider.ts](./src/providers/sidebarProvider.ts)**：侧边栏 Webview（含完整 HTML/CSS/JS）
- **[hoverProvider.ts](./src/providers/hoverProvider.ts)**：编辑器悬浮窗翻译展示
- **[selectionListener.ts](./src/listeners/selectionListener.ts)**：监听编辑器选中文本变化

## 使用说明

1. 安装插件后重启 VSCode
2. 打开侧边栏中的 "Realtime Translate" 面板
3. 在编辑器中选中需要翻译的文本
4. 文本会自动填充到侧边栏的输入框
5. 点击 "翻译" 按钮或使用快捷键 `Ctrl+Shift+Q` 进行翻译
6. 翻译结果会显示在侧边栏的结果框中
7. 如果开启了悬浮窗功能，翻译结果也会在编辑器中选中文本旁边显示

## 常见问题

### 1. 翻译失败
- 确认已配置正确的 Bing 翻译 Token
- 检查网络连接是否正常
- 查看 VSCode 输出面板中的错误信息

### 2. 类型错误
- 确认已执行 `npm install`
- 重启 VSCode 或 TypeScript 服务器

### 3. 打包失败
- 确认已安装 `vsce` 工具
- 检查 [package.json](./package.json) 配置是否正确
- 确认所有文件路径有效

## 许可证

MIT License
