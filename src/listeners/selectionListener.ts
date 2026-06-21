/**
 * Realtime Translate - 选中文本监听器
 */
import * as vscode from 'vscode';

export class SelectionListener {
  private editorDisposable: vscode.Disposable;
  private clipboardPollingInterval: NodeJS.Timeout | null = null;
  private lastClipboardContent: string = '';

  constructor(private onSelectionChanged: (text: string) => void) {
    // 监听活跃编辑器的选中文本变化
    this.editorDisposable = vscode.window.onDidChangeTextEditorSelection((e) => {
      const editor = e.textEditor;
      const selection = editor.selection;

      if (selection.isEmpty) {
        return;
      }

      const selectedText = editor.document.getText(selection).trim();
      if (selectedText.length > 0) {
        this.onSelectionChanged(selectedText);
      }
    });

    // 启动剪贴板轮询（用于捕获 Markdown Preview Enhanced 等 Webview 中的选中）
    this.startClipboardPolling();
  }

  /** 启动剪贴板轮询 */
  private startClipboardPolling(): void {
    // 每 500ms 检查一次剪贴板
    this.clipboardPollingInterval = setInterval(async () => {
      try {
        const clipboardText = await vscode.env.clipboard.readText();
        
        // 检查剪贴板内容是否变化且非空
        if (clipboardText && clipboardText !== this.lastClipboardContent && clipboardText.trim().length > 0) {
          this.lastClipboardContent = clipboardText;
          this.onSelectionChanged(clipboardText.trim());
        }
      } catch (error) {
        // 忽略剪贴板读取错误
        console.error('读取剪贴板失败:', error);
      }
    }, 500);
  }

  /** 销毁监听器 */
  dispose(): void {
    this.editorDisposable.dispose();
    if (this.clipboardPollingInterval) {
      clearInterval(this.clipboardPollingInterval);
    }
  }
}
