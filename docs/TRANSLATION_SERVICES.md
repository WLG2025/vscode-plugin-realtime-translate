# 翻译服务说明

本项目提供了两种翻译服务实现，可以根据需要选择使用。

## 1. OpenCLITranslationService（当前默认）

**文件位置**: `src/translation/opencliService.ts`

### 特点
- ✅ **无需 Token**：基于浏览器会话，不需要 API Token
- ✅ **免费使用**：利用 Bing 翻译网页版
- ✅ **支持多语言**：可配置源语言和目标语言
- ⚠️ **依赖环境**：需要安装 OpenCLI 并确保 Chrome 正在运行

### 前置要求
1. 安装 OpenCLI：
   ```bash
   npm install -g @jackwener/opencli
   ```
2. 确保 Chrome 浏览器正在运行
3. 验证连接状态：
   ```bash
   opencli doctor
   ```

### 使用方法
在 `extension.ts` 中导入并使用：
```typescript
import { OpenCLITranslationService } from './translation/opencliService';

const translationService = new OpenCLITranslationService();
```

### 配置项
- `realtimeTranslate.fromLang`: 源语言（默认：auto-detect）
- `realtimeTranslate.toLang`: 目标语言（默认：zh-Hans）

## 2. BingTranslationService（备用）

**文件位置**: `src/translation/bingService.ts`

### 特点
- ✅ **直接 API 调用**：不依赖浏览器
- ✅ **响应速度快**：无需等待页面加载
- ❌ **需要 Token**：必须配置有效的 Bing API Token
- ❌ **可能受限**：Token 有时效性或 IP 限制

### 前置要求
1. 获取有效的 Bing 翻译 API Token
2. 在 VSCode 设置中配置 Token：
   ```json
   {
     "realtimeTranslate.token": "your-bing-token-here"
   }
   ```

### 使用方法
在 `extension.ts` 中导入并使用：
```typescript
import { BingTranslationService } from './translation/bingService';

const translationService = new BingTranslationService();
```

### 注意事项
- Token 失效时会返回错误码 205
- 建议定期更新 Token
- 有请求频率限制

## 切换翻译服务

要切换到不同的翻译服务，只需修改 `src/extension.ts` 中的导入和实例化代码：

**使用 OpenCLI**（当前默认）:
```typescript
import { OpenCLITranslationService } from './translation/opencliService';
const translationService = new OpenCLITranslationService();
```

**使用 Bing API**:
```typescript
import { BingTranslationService } from './translation/bingService';
const translationService = new BingTranslationService();
```

## 技术架构

两个服务都实现了相同的接口：
```typescript
interface TranslationService {
  translate(text: string): Promise<TranslationHistoryItem>;
  clearCache(): void;
}
```

这使得它们可以在 `SidebarProvider` 中无缝替换，不影响其他代码。
