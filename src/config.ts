/**
 * Realtime Translate - 配置管理
 */
import * as vscode from 'vscode';
import { ExtensionConfig } from './types';

const CONFIG_SECTION = 'realtimeTranslate';

/** 获取插件完整配置 */
export function getConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return {
    hoverEnabled: config.get<boolean>('hoverEnabled', false),
    token: config.get<string>('token', ''), // 保留以兼容，但不再使用
    shortcut: config.get<string>('shortcut', 'ctrl+shift+q'),
    historyLimit: config.get<number>('historyLimit', 10),
    fromLang: config.get<string>('fromLang', 'auto-detect'),
    toLang: config.get<string>('toLang', 'zh-Hans'),
  };
}

/** 获取单项配置 */
export function getConfigValue<K extends keyof ExtensionConfig>(key: K): ExtensionConfig[K] {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  return config.get<ExtensionConfig[K]>(key, getDefaultConfig()[key]);
}

/** 更新单项配置 */
export async function updateConfigValue<K extends keyof ExtensionConfig>(
  key: K,
  value: ExtensionConfig[K]
): Promise<void> {
  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  await config.update(key, value, vscode.ConfigurationTarget.Global);
}

/** 获取默认配置 */
export function getDefaultConfig(): ExtensionConfig {
  return {
    hoverEnabled: false,
    token: '',
    shortcut: 'ctrl+shift+q',
    historyLimit: 10,
    fromLang: 'auto-detect',
    toLang: 'zh-Hans',
  };
}