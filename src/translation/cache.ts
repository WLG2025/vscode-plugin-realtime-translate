/**
 * Realtime Translate - 翻译缓存
 */

/** 基于 Map 的本地翻译结果缓存 */
export class TranslationCache {
  private cache: Map<string, string> = new Map();

  /** 获取缓存的翻译结果 */
  get(text: string): string | undefined {
    return this.cache.get(text);
  }

  /** 设置缓存 */
  set(text: string, translatedText: string): void {
    this.cache.set(text, translatedText);
  }

  /** 检查缓存是否存在 */
  has(text: string): boolean {
    return this.cache.has(text);
  }

  /** 清除缓存 */
  clear(): void {
    this.cache.clear();
  }

  /** 获取缓存大小 */
  get size(): number {
    return this.cache.size;
  }
}
