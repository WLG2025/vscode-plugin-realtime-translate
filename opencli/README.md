# OpenCLI Bing 翻译插件

## 简介

这是一个 OpenCLI 插件，提供通过 Bing 翻译服务进行文本翻译的功能。

## 安装

```powershell
.\script\install-opencli-plugin.ps1
```

## 使用方法

### 基本用法

```bash
# 英文翻译成中文（默认）
opencli my-bing do-translate "Hello World"

# 指定源语言和目标语言
opencli my-bing do-translate "Hello World" --from en --to zh-Hans

# 中文翻译成英文
opencli my-bing do-translate "你好世界" --from zh-Hans --to en
```

### 输出格式

支持多种输出格式：

```bash
# 表格格式（默认）
opencli my-bing do-translate "Hello World" -f table

# JSON 格式
opencli my-bing do-translate "Hello World" -f json

# YAML 格式
opencli my-bing do-translate "Hello World" -f yaml

# Markdown 格式
opencli my-bing do-translate "Hello World" -f md

# CSV 格式
opencli my-bing do-translate "Hello World" -f csv
```

### 参数说明

- `text`（必需，位置参数）：要翻译的文本内容
- `--from`（可选）：源语言代码，例如 `en`、`zh-Hans` 等，默认为 `auto-detect`
- `--to`（可选）：目标语言代码，例如 `zh-Hans`、`en` 等，默认为 `zh-Hans`

### 示例

```bash
# 翻译单个单词
opencli my-bing do-translate "computer" --from en --to zh-Hans

# 翻译句子
opencli my-bing do-translate "How are you today?" --from en --to zh-Hans

# 翻译长文本
opencli my-bing do-translate "OpenCLI is a powerful tool that turns any website into a CLI." --from en --to zh-Hans -f json
```

## 技术实现

### 工作原理

1. **浏览器模式**：插件使用 OpenCLI 的浏览器桥接功能，在 Chrome 中打开 Bing 翻译页面
2. **DOM 操作**：通过 JavaScript 操作页面元素来设置输入文本并获取翻译结果
3. **异步等待**：轮询检查翻译结果，最多等待 8 秒

### 关键页面元素

- 输入框：`#tta_input_ta`
- 输出框：`#tta_output_ta`
- 源语言选择器：`#tta_srcsl`
- 目标语言选择器：`#tta_tgtsl`

## 开发调试

### 修改代码后重新安装

```powershell
.\script\install-opencli-plugin.ps1
```

### 验证插件

```bash
# 基本验证
opencli browser verify my-bing/do-translate

# 更新测试 fixture
opencli browser verify my-bing/do-translate --update-fixture

# 详细模式
opencli my-bing do-translate "Hello World" -v

# Trace 模式（失败时保留痕迹）
opencli my-bing do-translate "Hello World" --trace retain-on-failure
```

### 手动调试浏览器会话

```bash
# 打开调试会话
opencli browser debug-session open "https://cn.bing.com/translator"

# 执行 JavaScript 调试
opencli browser debug-session eval 'document.querySelector("#tta_input_ta").innerText = "Test";'

# 关闭会话
opencli browser debug-session close
```

## 常见问题

### 翻译返回空结果或 "..."

**原因**：翻译尚未完成或页面未完全加载

**解决方案**：
- 确保 Chrome 正在运行且 Browser Bridge 已连接（运行 `opencli doctor` 检查）
- 增加等待时间（已在代码中实现）
- 检查网络连接是否正常

### 命令执行失败

**检查项**：
1. 运行 `opencli doctor` 确认浏览器桥接正常
2. 确保 Chrome 已启动
3. 检查插件是否正确安装到 `~/.opencli/clis/my-bing/`

## 许可证

MIT
