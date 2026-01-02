/**
 * 应用配置文件
 * 用于统一管理模型名称等配置项
 * 
 * 配置优先级：
 * 1. 环境变量 OPENAI_MODEL（服务器端）
 * 2. localStorage 中的 mood_model_name（客户端，如果可用）
 * 3. 默认值 'gpt-4o-mini'
 */

// 默认模型名称
//const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_MODEL = 'o4-mini';
/**
 * 获取 OpenAI 模型名称
 * 
 * 服务器端：从环境变量 OPENAI_MODEL 读取，如果没有则使用默认值
 * 客户端：从 localStorage 读取，如果没有则使用默认值
 * 
 * @returns 模型名称
 */
export function getModelName(): string {
  // 服务器端：从环境变量读取
  if (typeof window === 'undefined') {
    return process.env.OPENAI_MODEL || DEFAULT_MODEL;
  }

  // 客户端：从 localStorage 读取
  try {
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
 * 设置模型名称（仅客户端）
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
 * 重置模型名称为默认值（仅客户端）
 */
export function resetModelName(): void {
  if (typeof window === 'undefined') {
    throw new Error('resetModelName 只能在客户端调用');
  }

  try {
    localStorage.removeItem('mood_model_name');
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

