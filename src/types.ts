/**
 * Realtime Translate - 公共类型定义
 */

/** Bing 翻译 API 请求参数 */
export interface BingTranslateParams {
  fromLang: string;
  to: string;
  tone: string;
  text: string;
  token: string;
  key: string;
}

/** Bing 翻译 API 响应 - 音译信息 */
export interface BingTransliteration {
  text: string;
  script: string;
}

/** Bing 翻译 API 响应 - 单条翻译结果 */
export interface BingTranslation {
  text: string;
  to: string;
  transliteration: BingTransliteration;
}

/** Bing 翻译 API 响应 - 单条结果集 */
export interface BingTranslateResultItem {
  translations: BingTranslation[];
  usedLLM: boolean;
  detectedLanguage: {
    language: string;
  };
}

/** Bing 翻译 API 错误响应 */
export interface BingTranslateError {
  statusCode: number;
  errorMessage: string;
}

/** Bing 翻译 API 完整响应 */
export type BingTranslateResponse = BingTranslateResultItem[] | BingTranslateError[];

/** 翻译历史记录 */
export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  detectedLanguage: string;
  timestamp: number;
}

/** Extension ↔ Webview 消息类型 */
export type ExtensionToWebviewMessage =
  | { type: 'fillInput'; text: string }
  | { type: 'translationResult'; success: true; result: TranslationHistoryItem }
  | { type: 'translationResult'; success: false; error: string }
  | { type: 'updateHistory'; history: TranslationHistoryItem[] }
  | { type: 'configUpdate'; config: ExtensionConfig };

export type WebviewToExtensionMessage =
  | { type: 'translate'; text: string }
  | { type: 'configChange'; key: string; value: unknown }
  | { type: 'selectHistory'; id: string };

/** 插件配置 */
export interface ExtensionConfig {
  hoverEnabled: boolean;
  token: string; // 保留以兼容，但不再使用
  shortcut: string;
  historyLimit: number;
  fromLang: string; // 源语言
  toLang: string;   // 目标语言
}
