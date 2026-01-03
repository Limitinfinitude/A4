/**
 * 应用配置文件
 * 用于统一管理模型名称、API 模式等配置项
 * 
 * 配置优先级：
 * 1. 环境变量 OPENAI_MODEL（服务器端）
 * 2. localStorage 中的 mood_model_name_permanent（永久配置，客户端）
 * 3. localStorage 中的 mood_model_name（临时配置，客户端）
 * 4. 默认值 'gpt-4o-mini'
 */

// AI 模式类型
export type AIMode = 'api' | 'ollama';

// 默认模型名称
//const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_MODEL = 'gpt-5.2';

// 默认 Ollama URL
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

/**
 * 获取 OpenAI 模型名称
 * 
 * 服务器端：从环境变量 OPENAI_MODEL 读取，如果没有则使用默认值
 * 客户端：优先从永久配置读取，然后从临时配置读取，最后使用默认值
 * 
 * @returns 模型名称
 */
export function getModelName(): string {
  // 服务器端：从环境变量读取
  if (typeof window === 'undefined') {
    return process.env.OPENAI_MODEL || DEFAULT_MODEL;
  }

  // 客户端：优先读取永久配置，然后读取临时配置
  try {
    // 先检查永久配置
    const permanent = localStorage.getItem('mood_model_name_permanent');
    if (permanent) {
      return permanent;
    }
    // 再检查临时配置
    const stored = localStorage.getItem('mood_model_name');
    if (stored) {
      return stored;
    }
  } catch (error) {
    // localStorage 可能不可用（如隐私模式）
    console.warn('无法访问 localStorage，使用默认模型');
  }

  return DEFAULT_MODEL;
}

/**
 * 设置模型名称（仅客户端，临时配置）
 * 
 * @param modelName 模型名称
 */
export function setModelName(modelName: string): void {
  if (typeof window === 'undefined') {
    throw new Error('setModelName 只能在客户端调用');
  }

  try {
    localStorage.setItem('mood_model_name', modelName);
  } catch (error) {
    console.error('保存模型名称失败：', error);
    throw new Error('无法保存模型名称');
  }
}

/**
 * 设置永久模型名称（仅客户端，永久配置）
 * 永久配置会覆盖临时配置
 * 
 * @param modelName 模型名称
 */
export function setPermanentModelName(modelName: string): void {
  if (typeof window === 'undefined') {
    throw new Error('setPermanentModelName 只能在客户端调用');
  }

  try {
    localStorage.setItem('mood_model_name_permanent', modelName);
    // 同时清除临时配置，因为永久配置优先级更高
    localStorage.removeItem('mood_model_name');
  } catch (error) {
    console.error('保存永久模型名称失败：', error);
    throw new Error('无法保存永久模型名称');
  }
}

/**
 * 清除永久模型配置（仅客户端）
 * 清除后，如果有临时配置则使用临时配置，否则使用默认值
 */
export function clearPermanentModelName(): void {
  if (typeof window === 'undefined') {
    throw new Error('clearPermanentModelName 只能在客户端调用');
  }

  try {
    localStorage.removeItem('mood_model_name_permanent');
  } catch (error) {
    console.error('清除永久模型配置失败：', error);
  }
}

/**
 * 重置模型名称为默认值（仅客户端）
 * 清除所有配置（永久和临时）
 */
export function resetModelName(): void {
  if (typeof window === 'undefined') {
    throw new Error('resetModelName 只能在客户端调用');
  }

  try {
    localStorage.removeItem('mood_model_name');
    localStorage.removeItem('mood_model_name_permanent');
  } catch (error) {
    console.error('重置模型名称失败：', error);
  }
}

/**
 * 获取默认模型名称
 */
export function getDefaultModelName(): string {
  return DEFAULT_MODEL;
}

/**
 * 检查是否有永久配置
 */
export function hasPermanentModelName(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return localStorage.getItem('mood_model_name_permanent') !== null;
  } catch (error) {
    return false;
  }
}

/**
 * 获取 AI 模式（API 或 Ollama）
 * @returns 'api' 或 'ollama'
 */
export function getAIMode(): AIMode {
  if (typeof window === 'undefined') {
    return 'api';
  }

  try {
    const mode = localStorage.getItem('mood_ai_mode');
    return (mode === 'ollama' ? 'ollama' : 'api') as AIMode;
  } catch (error) {
    return 'api';
  }
}

/**
 * 设置 AI 模式
 * @param mode 'api' 或 'ollama'
 */
export function setAIMode(mode: AIMode): void {
  if (typeof window === 'undefined') {
    throw new Error('setAIMode 只能在客户端调用');
  }

  try {
    localStorage.setItem('mood_ai_mode', mode);
  } catch (error) {
    console.error('保存 AI 模式失败：', error);
    throw new Error('无法保存 AI 模式');
  }
}

/**
 * 获取 Ollama URL
 * @returns Ollama 服务器 URL
 */
export function getOllamaURL(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_OLLAMA_URL;
  }

  try {
    const url = localStorage.getItem('mood_ollama_url');
    return url || DEFAULT_OLLAMA_URL;
  } catch (error) {
    return DEFAULT_OLLAMA_URL;
  }
}

/**
 * 设置 Ollama URL
 * @param url Ollama 服务器 URL
 */
export function setOllamaURL(url: string): void {
  if (typeof window === 'undefined') {
    throw new Error('setOllamaURL 只能在客户端调用');
  }

  try {
    localStorage.setItem('mood_ollama_url', url);
  } catch (error) {
    console.error('保存 Ollama URL 失败：', error);
    throw new Error('无法保存 Ollama URL');
  }
}

/**
 * 获取 Ollama 模型名称
 * @returns Ollama 模型名称
 */
export function getOllamaModel(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return localStorage.getItem('mood_ollama_model') || '';
  } catch (error) {
    return '';
  }
}

/**
 * 设置 Ollama 模型名称
 * @param model Ollama 模型名称
 */
export function setOllamaModel(model: string): void {
  if (typeof window === 'undefined') {
    throw new Error('setOllamaModel 只能在客户端调用');
  }

  try {
    localStorage.setItem('mood_ollama_model', model);
  } catch (error) {
    console.error('保存 Ollama 模型失败：', error);
    throw new Error('无法保存 Ollama 模型');
  }
}

/**
 * 获取默认 Ollama URL
 */
export function getDefaultOllamaURL(): string {
  return DEFAULT_OLLAMA_URL;
}

/**
 * 重置所有模型名称配置
 */
export function resetModelNameConfig(): void {
  if (typeof window === 'undefined') {
    throw new Error('resetModelNameConfig 只能在客户端调用');
  }

  try {
    localStorage.removeItem('mood_model_name');
    localStorage.removeItem('mood_model_name_permanent');
  } catch (error) {
    console.error('重置所有模型配置失败：', error);
  }
}

