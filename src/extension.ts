/**
 * Realtime Translate - 插件入口
 */
import * as vscode from 'vscode';
import { SidebarProvider } from './providers/sidebarProvider';
import { TranslateHoverProvider } from './providers/hoverProvider';
import { SelectionListener } from './listeners/selectionListener';
import { OpenCLITranslationService } from './translation/opencliService';
import { getConfig } from './config';

let hoverProvider: TranslateHoverProvider;

export function activate(context: vscode.ExtensionContext) {
  const translationService = new OpenCLITranslationService();

  // 初始化 Hover Provider
  hoverProvider = new TranslateHoverProvider();
  hoverProvider.register(context);

  // 初始化侧边栏 Provider
  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    translationService,
    async (text: string, duration: number) => {
      // 翻译完成后的回调：如果开启了悬浮窗，则显示悬浮窗
      // 注意：这里不再执行翻译，因为 triggerTranslate 已经完成翻译
      const config = getConfig();
      if (config.hoverEnabled) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const selection = editor.selection;
          // 从历史记录中获取最新的翻译结果
          const latestHistory = sidebarProvider.getLatestTranslation();
          if (latestHistory) {
            hoverProvider.setTranslation(latestHistory.translatedText, selection);
          }
        }
      }
      
      // 显示翻译完成提示，包含耗时信息
      vscode.window.showInformationMessage(`翻译完成（${duration}ms）`);
    }
  );

  // 注册侧边栏 View
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarProvider.viewType,
      sidebarProvider
    )
  );

  // 注册翻译命令
  const translateCommand = vscode.commands.registerCommand(
    'realtimeTranslate.translate',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('请先打开一个文件');
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection).trim();

      if (!text) {
        vscode.window.showWarningMessage('请先选中要翻译的文本');
        return;
      }

      // 通过侧边栏触发翻译（会更新按钮状态和保存历史记录）
      try {
        const { result, duration } = await sidebarProvider.triggerTranslate(text);

        // 悬浮窗展示（直接使用返回的结果，避免重复翻译）
        const config = getConfig();
        if (config.hoverEnabled && result) {
          hoverProvider.setTranslation(result.translatedText, selection);
        }

        vscode.window.showInformationMessage(`翻译完成（${duration}ms）`);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        vscode.window.showErrorMessage(`翻译失败：${errorMessage}`);
      }
    }
  );
  context.subscriptions.push(translateCommand);

  // 注册选中文本监听器
  const selectionListener = new SelectionListener((text) => {
    sidebarProvider.fillInput(text);
    // 选中变化时清除悬浮窗
    hoverProvider.clearTranslation();
  });
  context.subscriptions.push(selectionListener);
}

export function deactivate() {
  hoverProvider?.dispose();
}
