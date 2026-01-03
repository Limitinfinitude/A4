/**
 * 客户端配置工具
 * 用于在客户端获取 AI 配置并传递给 API 路由
 */

import { getAIMode, getModelName, getOllamaURL, getOllamaModel } from './config';
import type { AIConfig } from './aiClient';

/**
 * 获取客户端 AI 配置
 * 从 localStorage 读取所有必要的配置信息
 * @returns AI 配置对象
 */
export function getClientAIConfig(): AIConfig {
  const startTime = Date.now();
  
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const mode = getAIMode();
    const config: AIConfig = {
      mode,
    };

    if (mode === 'api') {
      // API 模式：获取 API Key、API URL 和模型名称
      config.apiKey = localStorage.getItem('debug_api_key') || undefined;
      config.apiUrl = localStorage.getItem('debug_api_url') || undefined;
      config.modelName = getModelName();
      
      console.log(`[Client Config] API 模式配置:`, {
        hasApiKey: !!config.apiKey,
        apiUrl: config.apiUrl,
        modelName: config.modelName,
      });
    } else if (mode === 'ollama') {
      // Ollama 模式：获取 Ollama URL 和模型
      config.ollamaUrl = getOllamaURL();
      config.ollamaModel = getOllamaModel();
      
      console.log(`[Client Config] Ollama 模式配置:`, {
        ollamaUrl: config.ollamaUrl,
        ollamaModel: config.ollamaModel,
      });
    }

    const endTime = Date.now();
    console.log(`[Client Config] 获取配置耗时: ${endTime - startTime}ms`);

    return config;
  } catch (error) {
    console.error('获取客户端 AI 配置失败：', error);
    return {};
  }
}

