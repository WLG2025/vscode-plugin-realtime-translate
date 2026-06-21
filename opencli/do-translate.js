import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError, CommandExecutionError, EmptyResultError } from '@jackwener/opencli/errors';

cli({
    site: 'my-bing',
    name: 'do-translate',
    access: 'read',
    description: '获取 Bing 翻译服务的翻译结果',
    domain: 'cn.bing.com',
    strategy: Strategy.PUBLIC,
    browser: true,  // 启用浏览器模式以获取有效 cookie
    args: [
        {
            name: 'text',
            required: true,
            positional: true,
            help: '要翻译的文本内容',
        },
        {
            name: 'from',
            required: false,
            default: 'auto-detect',
            help: '源语言代码，例如 en、zh-Hans 等，默认自动检测',
        },
        {
            name: 'to',
            required: false,
            default: 'zh-Hans',
            help: '目标语言代码，例如 zh-Hans、en 等，默认中文简体',
        },
    ],
    columns: ['translated_text', 'source_lang', 'target_lang', 'success'],
    func: async (page, args) => {
        const text = String(args.text);
        const fromLang = String(args.from);
        const toLang = String(args.to);
        
        // 确保浏览器会话已建立并导航到 Bing 翻译页面
        const currentUrl = await page.evaluate(() => window.location.href);
        if (!currentUrl.includes('cn.bing.com/translator')) {
            try {
                await page.goto('https://cn.bing.com/translator');
                await page.wait({ selector: '#tta_input_ta', timeout: 15 });
                await page.wait(2).catch(() => {});
            } catch (error) {
                throw new CommandExecutionError(`Failed to open Bing Translator: ${error instanceof Error ? error.message : String(error)}`);
            }
        } else {
            // 页面已加载，只需短暂等待确保 DOM 就绪
            await page.wait(0.3).catch(() => {});
        }
        
        try {
            // 通过页面内置的 JavaScript API 执行翻译（优化版）
            const result = await page.evaluate(async (inputText, sourceLang, targetLang) => {
                return new Promise((resolve, reject) => {
                    try {
                        // 设置源语言和目标语言
                        const fromSelect = document.querySelector('#tta_srcsl');
                        const toSelect = document.querySelector('#tta_tgtsl');
                        
                        if (fromSelect && sourceLang !== 'auto-detect') {
                            fromSelect.value = sourceLang;
                            fromSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        
                        if (toSelect) {
                            toSelect.value = targetLang;
                            toSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        
                        // 短暂等待语言切换生效
                        setTimeout(() => {
                            // 设置输入文本（使用 innerText）
                            const inputArea = document.querySelector('#tta_input_ta');
                            if (!inputArea) {
                                reject(new Error('Input area not found'));
                                return;
                            }
                            
                            // 清空并设置新文本
                            inputArea.innerText = '';
                            inputArea.innerText = inputText;
                            inputArea.dispatchEvent(new Event('input', { bubbles: true }));
                            
                            // 使用 MutationObserver 监听输出框变化（比轮询更高效）
                            const outputArea = document.querySelector('#tta_output_ta');
                            if (!outputArea) {
                                reject(new Error('Output area not found'));
                                return;
                            }
                            
                            let mutationTimeout = null;
                            const observer = new MutationObserver((mutations) => {
                                const translatedText = outputArea.innerText?.trim();
                                
                                // 检查是否有实际内容
                                if (translatedText && translatedText.length > 0 && translatedText !== '...') {
                                    if (mutationTimeout) clearTimeout(mutationTimeout);
                                    observer.disconnect();
                                    
                                    resolve({
                                        translated_text: translatedText,
                                        source_lang: sourceLang,
                                        target_lang: targetLang,
                                        success: true
                                    });
                                }
                            });
                            
                            observer.observe(outputArea, { 
                                childList: true, 
                                subtree: true, 
                                characterData: true 
                            });
                            
                            // 设置超时保护（3 秒）
                            mutationTimeout = setTimeout(() => {
                                observer.disconnect();
                                reject(new Error('Translation timeout - no result received'));
                            }, 3000);
                        }, 100); // 从 200ms 减少到 100ms
                    } catch (error) {
                        reject(error);
                    }
                });
            }, text, fromLang, toLang);
            
            return result;
        } catch (error) {
            if (error instanceof CliError) {
                throw error;
            }
            if (error.message && error.message.includes('timeout')) {
                throw new EmptyResultError('bing translate', 'Translation timed out.');
            }
            throw new CommandExecutionError(`Translation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    },
});