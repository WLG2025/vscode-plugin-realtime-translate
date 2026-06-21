/**
 * Realtime Translate - OpenCLI 翻译服务
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { TranslationHistoryItem } from '../types';
import { getConfigValue } from '../config';

const execAsync = promisify(exec);

export class OpenCLITranslationService {
  /**
   * 翻译文本（带自动重试）
   * @param text 待翻译的文本
   * @returns 翻译结果
   */
  async translate(text: string): Promise<TranslationHistoryItem> {
    const fromLang = getConfigValue('fromLang') || 'auto-detect';
    const toLang = getConfigValue('toLang') || 'zh-Hans';

    // 第一次尝试：标准超时 15 秒
    try {
      return await this.executeTranslate(text, fromLang, toLang, 15000);
    } catch (err: unknown) {
      // 如果是超时错误，自动重试一次（增加超时到 30 秒）
      if (err instanceof Error && err.message.includes('timeout')) {
        console.log('首次翻译超时，正在重试（30s timeout）...');
        try {
          return await this.executeTranslate(text, fromLang, toLang, 30000);
        } catch (retryErr: unknown) {
          // 重试仍然失败，抛出最终错误
          if (retryErr instanceof Error) {
            if (retryErr.message.includes('timeout')) {
              throw new Error('翻译请求超时（已重试，总耗时约 45s），请检查：\n1. Chrome 浏览器是否正常运行\n2. 网络连接是否正常\n3. Bing 翻译页面是否可访问\n4. 文本是否过长导致处理缓慢');
            }
            throw retryErr;
          }
          throw new Error('翻译请求失败：未知错误');
        }
      }
      // 非超时错误，直接抛出
      throw err;
    }
  }

  /**
   * 执行翻译命令
   * @param text 待翻译文本
   * @param fromLang 源语言
   * @param toLang 目标语言
   * @param timeout 超时时间（毫秒）
   * @returns 翻译结果
   */
  private async executeTranslate(
    text: string,
    fromLang: string,
    toLang: string,
    timeout: number
  ): Promise<TranslationHistoryItem> {
    // 调用 OpenCLI 命令
    const command = `opencli my-bing do-translate "${this.escapeShellArg(text)}" --from ${fromLang} --to ${toLang} -f json`;
    
    const { stdout } = await execAsync(command, {
      timeout,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer，防止大文本输出被截断
    });

    // 直接解析 JSON 输出
    const result = JSON.parse(stdout.trim());

    if (!result.success) {
      throw new Error('翻译失败：OpenCLI 返回失败状态');
    }

    const translatedText = result.translated_text;
    const detectedLanguage = result.source_lang || fromLang;

    if (!translatedText) {
      throw new Error('翻译请求失败：未获取到翻译结果');
    }

    return {
      id: this.generateId(),
      sourceText: text,
      translatedText,
      detectedLanguage,
      timestamp: Date.now(),
    };
  }

  /** 清除翻译缓存（OpenCLI 不需要缓存） */
  clearCache(): void {
    // OpenCLI 使用浏览器会话，无需本地缓存
  }

  /** 转义 shell 参数 */
  private escapeShellArg(arg: string): string {
    // Windows PowerShell 和 CMD 都需要转义双引号
    // 同时将换行符替换为空格，避免命令被截断
    
    let escaped = arg
      .replace(/"/g, '\\"')
      .replace(/\r\n/g, ' ')  // Windows 换行符
      .replace(/\n/g, ' ')     // Unix 换行符
      .replace(/\r/g, ' ');    // 旧 Mac 换行符
    
    // 如果文本以 - 开头，添加零宽空格前缀，防止被解析为命令行选项
    if (escaped.startsWith('-')) {
      escaped = '\u200B' + escaped;
    }
    
    return escaped;
  }

  /** 生成唯一 ID */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

}
