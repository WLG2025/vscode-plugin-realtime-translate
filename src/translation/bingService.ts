/**
 * Realtime Translate - Bing 翻译 API 服务
 */
import * as https from 'https';
import { URLSearchParams } from 'url';
import {
  BingTranslateParams,
  BingTranslateResponse,
  TranslationHistoryItem,
  BingTranslateError,
  BingTranslateResultItem,
} from '../types';
import { TranslationCache } from './cache';
import { getConfigValue } from '../config';

const BING_TRANSLATE_URL =
  'https://cn.bing.com/ttranslatev3?isVertical=1&IID=translator.5022&SFX=81';

export class BingTranslationService {
  private cache: TranslationCache = new TranslationCache();

  /**
   * 翻译文本
   * @param text 待翻译的文本
   * @returns 翻译结果
   */
  async translate(text: string): Promise<TranslationHistoryItem> {
    // 检查缓存
    const cached = this.cache.get(text);
    if (cached) {
      return {
        id: this.generateId(),
        sourceText: text,
        translatedText: cached,
        detectedLanguage: 'cached',
        timestamp: Date.now(),
      };
    }

    const token = getConfigValue('token');
    if (!token) {
      throw new Error('请先在侧边栏设置中配置 Bing 翻译 Token');
    }

    const params: BingTranslateParams = {
      fromLang: 'auto-detect',
      to: 'zh-Hans',
      tone: 'Casual',
      text,
      token,
      key: Date.now().toString(),
    };

    const response = await this.request(params);

    // 检查响应是否包含错误
    if (Array.isArray(response) && response.length > 0) {
      const firstItem = response[0];
      
      // 检查是否是错误响应（如 statusCode: 205）
      if (isBingTranslateErrorResponse(firstItem)) {
        const errorMessage = firstItem.errorMessage || '未知错误';
        throw new Error(`翻译请求失败: ${firstItem.statusCode} - ${errorMessage}`);
      }
    } else if (isBingTranslateErrorResponse(response)) {
      // 如果响应是错误对象
      const statusCode = response.statusCode;
      const errorMessage = response.errorMessage || '未知错误';
      throw new Error(`翻译请求失败: ${statusCode} - ${errorMessage}`);
    }

    // 确保响应是正常的翻译结果数组
    if (!Array.isArray(response) || response.length === 0) {
      throw new Error('翻译请求失败：响应为空');
    }

    // 确保第一个元素是有效的翻译结果
    const result = response[0] as BingTranslateResultItem;
    if (!('translations' in result)) {
      throw new Error('翻译请求失败：响应格式错误');
    }

    const translatedText = result.translations[0]?.text ?? '';
    const detectedLanguage = result.detectedLanguage?.language ?? 'unknown';

    if (!translatedText) {
      throw new Error('翻译请求失败：未获取到翻译结果');
    }

    // 写入缓存
    this.cache.set(text, translatedText);

    return {
      id: this.generateId(),
      sourceText: text,
      translatedText,
      detectedLanguage,
      timestamp: Date.now(),
    };
  }

  /** 清除翻译缓存 */
  clearCache(): void {
    this.cache.clear();
  }

  /** 发起 HTTPS 请求 */
  private request(params: BingTranslateParams): Promise<BingTranslateResponse> {
    return new Promise((resolve, reject) => {
      const body = new URLSearchParams({
        fromLang: params.fromLang,
        to: params.to,
        tone: params.tone,
        text: params.text,
        token: params.token,
        key: params.key,
      }).toString();

      const url = new URL(BING_TRANSLATE_URL);

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0',
          'Referer': 'https://cn.bing.com/translator?ref=TThis&from=&to=zh-Hans&isTTRefreshQuery=1',
          'X-ClientData': 'eyIxIjoiMCIsIjIiOiIwIiwiMyI6IjAiLCI0IjoiNjk2ODU2NzUzNTA2Njc3MDcyOCIsIjYiOiJzdGFibGUiLCI5IjoiZGVza3RvcCJ9',
          'Origin': 'https://cn.bing.com',
          'Accept': '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not.A/Brand";v="8", "Chromium";v="149", "Microsoft Edge";v="149"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin'
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on('end', () => {
          try {
            const json: any = JSON.parse(data);
            
            // 检查是否是错误响应
            if (json && Array.isArray(json) && json.length > 0 && isBingTranslateErrorResponse(json[0])) {
              // 如果是错误响应，仍然返回以便上层处理
              resolve(json as BingTranslateError[]);
            } else {
              const typedJson: BingTranslateResponse = json as BingTranslateResultItem[];
              resolve(typedJson);
            }
          } catch {
            reject(new Error(`翻译响应解析失败: ${data}`));
          }
        });
      });

      req.on('error', (err: Error) => {
        reject(new Error(`翻译请求网络错误: ${err.message}`));
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('翻译请求超时（10s）'));
      });

      req.write(body);
      req.end();
    });
  }

  /** 生成唯一 ID */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

// 类型守卫函数，用于判断是否是错误响应
function isBingTranslateErrorResponse(item: any): item is BingTranslateError {
  return item && 
         typeof item === 'object' && 
         'statusCode' in item && 
         typeof item.statusCode === 'number' &&
         'errorMessage' in item && 
         typeof item.errorMessage === 'string';
}
