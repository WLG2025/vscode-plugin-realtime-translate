/**
 * Realtime Translate - 悬浮窗 Hover Provider
 *
 * 当开启悬浮窗开关时，翻译成功后在选中文本旁边弹出悬浮窗显示翻译结果。
 * 使用 vscode.languages.registerHoverProvider 实现。
 */
import * as vscode from 'vscode';

export class TranslateHoverProvider implements vscode.HoverProvider {
  private currentTranslation: string | null = null;
  private currentRange: vscode.Range | null = null;
  private registration: vscode.Disposable | null = null;

  /** 设置当前翻译结果和范围，用于 Hover 展示 */
  setTranslation(text: string, range: vscode.Range): void {
    this.currentTranslation = text;
    this.currentRange = range;
  }

  /** 清除当前翻译结果 */
  clearTranslation(): void {
    this.currentTranslation = null;
    this.currentRange = null;
  }

  /** 注册 Hover Provider */
  register(context: vscode.ExtensionContext): void {
    this.registration = vscode.languages.registerHoverProvider(
      { scheme: 'file' },
      this
    );
    context.subscriptions.push(this.registration);
  }

  /** HoverProvider 实现 */
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | undefined {
    if (!this.currentTranslation || !this.currentRange) {
      return undefined;
    }

    // 检查鼠标是否在当前选区范围内
    if (!this.currentRange.contains(position)) {
      return undefined;
    }

    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`**🌐 翻译：** ${this.currentTranslation}`);
    markdown.supportHtml = true;

    return new vscode.Hover(markdown, this.currentRange);
  }

  /** 销毁 */
  dispose(): void {
    this.registration?.dispose();
  }
}
