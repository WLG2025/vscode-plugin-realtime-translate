/**
 * Realtime Translate - 侧边栏 Webview Provider
 */
import * as vscode from 'vscode';
import { TranslationHistoryItem, WebviewToExtensionMessage } from '../types';
import { getConfig, updateConfigValue } from '../config';

// 定义翻译服务接口，支持多种实现
interface TranslationService {
  translate(text: string): Promise<TranslationHistoryItem>;
  clearCache(): void;
}

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'realtimeTranslate.sidebar';

  private webviewView?: vscode.WebviewView;
  private history: TranslationHistoryItem[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private translationService: TranslationService,
    private onTranslateRequest?: (text: string, duration: number) => void
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview();

    // 处理来自 Webview 的消息
    webviewView.webview.onDidReceiveMessage(
      async (message: WebviewToExtensionMessage) => {
        switch (message.type) {
          case 'translate':
            await this.handleTranslate(message.text);
            break;
          case 'configChange':
            await updateConfigValue(message.key as any, message.value);
            break;
          case 'selectHistory':
            this.handleSelectHistory(message.id);
            break;
        }
      }
    );

    // 初始化时发送当前配置和历史记录
    this.postMessage({
      type: 'configUpdate',
      config: getConfig(),
    });
    this.postMessage({
      type: 'updateHistory',
      history: this.history,
    });
  }

  /** 填充输入框（由选中事件触发） */
  fillInput(text: string): void {
    this.postMessage({ type: 'fillInput', text });
  }

  /** 从外部触发翻译（例如快捷键命令） */
  async triggerTranslate(text: string): Promise<{ result: TranslationHistoryItem | null; duration: number }> {
    // 先填充输入框
    this.fillInput(text);
    
    // 执行翻译（会更新按钮状态和保存历史，并返回耗时）
    const { result, duration } = await this.handleTranslateWithResult(text);
    
    return { result, duration };
  }

  /** 获取最新的翻译结果（用于悬浮窗等） */
  getLatestTranslation(): TranslationHistoryItem | null {
    return this.history.length > 0 ? this.history[0] : null;
  }

  /** 处理翻译请求（来自 Webview 消息） */
  private async handleTranslate(text: string): Promise<void> {
    await this.handleTranslateWithResult(text);
  }

  /** 处理翻译请求并返回结果 */
  private async handleTranslateWithResult(text: string): Promise<{ result: TranslationHistoryItem | null; duration: number }> {
    if (!text.trim()) {
      return { result: null, duration: 0 };
    }

    // 记录开始时间
    const startTime = Date.now();

    // 禁用按钮并显示加载状态
    this.postMessage({ type: 'setButtonLoading', loading: true });

    try {
      const result = await this.translationService.translate(text);

      // 计算耗时
      const duration = Date.now() - startTime;

      // 添加到历史记录
      this.history.unshift(result);
      const limit = getConfig().historyLimit;
      if (this.history.length > limit) {
        this.history = this.history.slice(0, limit);
      }

      // 恢复按钮状态
      this.postMessage({ type: 'setButtonLoading', loading: false });

      // 发送翻译结果
      this.postMessage({
        type: 'translationResult',
        success: true,
        result,
      });

      // 更新历史记录
      this.postMessage({
        type: 'updateHistory',
        history: this.history,
      });

      // 通知外部（用于悬浮窗等），传递耗时信息
      this.onTranslateRequest?.(text, duration);

      return { result, duration };
    } catch (err: unknown) {
      // 恢复按钮状态
      this.postMessage({ type: 'setButtonLoading', loading: false });

      const errorMessage = err instanceof Error ? err.message : String(err);
      this.postMessage({
        type: 'translationResult',
        success: false,
        error: errorMessage,
      });

      // 计算失败时的耗时
      const duration = Date.now() - startTime;

      return { result: null, duration };
    }
  }

  /** 处理历史记录点击 */
  private handleSelectHistory(id: string): void {
    const item = this.history.find((h) => h.id === id);
    if (item) {
      // 将原文填充到输入框
      this.postMessage({ type: 'fillInput', text: item.sourceText });
      
      // 显示翻译结果
      this.postMessage({
        type: 'translationResult',
        success: true,
        result: item,
      });
    }
  }

  /** 向 Webview 发送消息 */
  private postMessage(message: unknown): void {
    this.webviewView?.webview.postMessage(message);
  }

  /** 生成 Webview HTML */
  private getHtmlForWebview(): string {
    return /* html */ `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      padding: 10px;
      color: var(--vscode-foreground);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    .section { margin-bottom: 16px; }
    .section-title {
      font-weight: bold;
      margin-bottom: 6px;
      font-size: 13px;
    }
    .config-row {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }
    .config-row label {
      width: 80px;
      flex-shrink: 0;
      font-size: 12px;
    }
    .config-row input, .config-row select {
      flex: 1;
      padding: 4px 6px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
      font-size: 12px;
    }
    .config-row input[type="checkbox"] {
      margin: 0;
    }
    .input-area {
      position: relative;
    }
    #inputText {
      width: 100%;
      min-height: 60px;
      padding: 6px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
      resize: vertical;
      font-size: 13px;
      box-sizing: border-box;
    }
    #translateBtn {
      position: absolute;
      right: 6px;
      bottom: 6px;
      padding: 4px 10px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
      opacity: 1;
    }
    #translateBtn:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground);
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    #translateBtn:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    #translateBtn:disabled {
      background: var(--vscode-disabledForeground);
      color: var(--vscode-button-foreground);
      cursor: not-allowed;
      opacity: 0.6;
    }
    #resultText {
      width: 100%;
      min-height: 60px;
      padding: 6px;
      background: var(--vscode-textBlockQuote-background);
      color: var(--vscode-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 2px;
      font-size: 13px;
      box-sizing: border-box;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .history-list {
      max-height: 200px;
      overflow-y: auto;
    }
    .history-item {
      padding: 4px 6px;
      margin-bottom: 4px;
      background: var(--vscode-list-hoverBackground);
      border-radius: 2px;
      cursor: pointer;
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .history-item:hover {
      background: var(--vscode-list-activeSelectionBackground);
      color: var(--vscode-list-activeSelectionForeground);
    }
    .history-source { color: var(--vscode-descriptionForeground); }
    .history-arrow { margin: 0 4px; }
  </style>
</head>
<body>
  <!-- 设置区 -->
  <div class="section">
    <div class="section-title">⚙ 设置</div>
    <div class="config-row">
      <label>悬浮窗</label>
      <input type="checkbox" id="hoverEnabled" />
    </div>
    <div class="config-row">
      <label>源语言</label>
      <select id="fromLang">
        <option value="auto-detect">自动检测</option>
        <option value="en">英语 (English)</option>
        <option value="zh-Hans">中文简体</option>
        <option value="zh-Hant">中文繁体</option>
        <option value="ja">日语 (日本語)</option>
        <option value="ko">韩语 (한국어)</option>
        <option value="fr">法语 (Français)</option>
        <option value="de">德语 (Deutsch)</option>
        <option value="es">西班牙语 (Español)</option>
        <option value="ru">俄语 (Русский)</option>
      </select>
    </div>
    <div class="config-row">
      <label>目标语言</label>
      <select id="toLang">
        <option value="zh-Hans">中文简体</option>
        <option value="en">英语 (English)</option>
        <option value="zh-Hant">中文繁体</option>
        <option value="ja">日语 (日本語)</option>
        <option value="ko">韩语 (한국어)</option>
        <option value="fr">法语 (Français)</option>
        <option value="de">德语 (Deutsch)</option>
        <option value="es">西班牙语 (Español)</option>
        <option value="ru">俄语 (Русский)</option>
      </select>
    </div>
    <div class="config-row">
      <label>快捷键</label>
      <input type="text" id="shortcut" readonly value="Ctrl+Shift+Q" />
    </div>
    <div class="config-row">
      <label>历史条数</label>
      <input type="number" id="historyLimit" min="1" max="100" value="10" />
    </div>
  </div>

  <!-- 待翻译输入框 -->
  <div class="section">
    <div class="section-title">📝 原文</div>
    <div class="input-area">
      <textarea id="inputText" placeholder="选中文本后自动填充到这里..."></textarea>
      <button id="translateBtn">翻译</button>
    </div>
  </div>

  <!-- 翻译结果 -->
  <div class="section">
    <div class="section-title">📖 结果</div>
    <div id="resultText" placeholder="翻译结果将显示在这里..."></div>
  </div>

  <!-- 翻译历史 -->
  <div class="section">
    <div class="section-title">📜 历史</div>
    <div class="history-list" id="historyList"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    const inputText = document.getElementById('inputText');
    const translateBtn = document.getElementById('translateBtn');
    const resultText = document.getElementById('resultText');
    const historyList = document.getElementById('historyList');
    const hoverEnabled = document.getElementById('hoverEnabled');
    const fromLangSelect = document.getElementById('fromLang');
    const toLangSelect = document.getElementById('toLang');
    const historyLimitInput = document.getElementById('historyLimit');

    // 翻译按钮点击
    translateBtn.addEventListener('click', () => {
      const text = inputText.value.trim();
      if (text) {
        vscode.postMessage({ type: 'translate', text });
      }
    });

    // 配置变更
    hoverEnabled.addEventListener('change', () => {
      vscode.postMessage({ type: 'configChange', key: 'hoverEnabled', value: hoverEnabled.checked });
    });
    fromLangSelect.addEventListener('change', () => {
      vscode.postMessage({ type: 'configChange', key: 'fromLang', value: fromLangSelect.value });
    });
    toLangSelect.addEventListener('change', () => {
      vscode.postMessage({ type: 'configChange', key: 'toLang', value: toLangSelect.value });
    });
    historyLimitInput.addEventListener('change', () => {
      vscode.postMessage({ type: 'configChange', key: 'historyLimit', value: parseInt(historyLimitInput.value, 10) });
    });

    // 处理来自 Extension 的消息
    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'fillInput':
          inputText.value = msg.text;
          break;
        case 'setButtonLoading':
          translateBtn.disabled = msg.loading;
          translateBtn.textContent = msg.loading ? '翻译中...' : '翻译';
          break;
        case 'translationResult':
          if (!msg.loading) {
            translateBtn.disabled = false;
            translateBtn.textContent = '翻译';
          }
          
          if (msg.success) {
            resultText.textContent = msg.result.translatedText;
          } else {
            resultText.textContent = '❌ ' + msg.error;
          }
          break;
        case 'updateHistory':
          renderHistory(msg.history);
          break;
        case 'configUpdate':
          hoverEnabled.checked = msg.config.hoverEnabled;
          fromLangSelect.value = msg.config.fromLang || 'auto-detect';
          toLangSelect.value = msg.config.toLang || 'zh-Hans';
          historyLimitInput.value = msg.config.historyLimit;
          break;
      }
    });

    function renderHistory(history) {
      historyList.innerHTML = '';
      history.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML =
          '<span class="history-source">' + escapeHtml(item.sourceText) + '</span>' +
          '<span class="history-arrow">→</span>' +
          '<span>' + escapeHtml(item.translatedText) + '</span>';
        div.addEventListener('click', () => {
          vscode.postMessage({ type: 'selectHistory', id: item.id });
        });
        historyList.appendChild(div);
      });
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>`;
  }
}
