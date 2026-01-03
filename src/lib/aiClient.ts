/**
 * AI 客户端
 * 统一处理 OpenAI API 和 Ollama 本地模型调用
 */

import { getAIMode, getOllamaURL, getOllamaModel } from './config';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
}

export interface AIConfig {
  mode?: 'api' | 'ollama';
  apiKey?: string;
  apiUrl?: string;
  modelName?: string;
  ollamaUrl?: string;
  ollamaModel?: string;
  responseFormat?: 'json' | 'text';
}

export interface AIResult {
  content: string;
  tokens?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 调用 AI（根据模式自动选择 API 或 Ollama）
 * @param messages 对话消息列表
 * @param config AI 配置（如果不提供则从 localStorage 读取）
 * @returns AI 返回的内容和 token 使用信息
 */
export async function callAI(
  messages: AIMessage[],
  config?: AIConfig
): Promise<AIResult> {
  // 如果没有提供配置，从 localStorage 读取（客户端）或使用默认值（服务器端）
  const mode = config?.mode || getAIMode();

  if (mode === 'ollama') {
    const ollamaUrl = config?.ollamaUrl || getOllamaURL();
    const ollamaModel = config?.ollamaModel || getOllamaModel();
    return callOllama(messages, ollamaUrl, ollamaModel);
  } else {
    const apiKey = config?.apiKey || '';
    const apiUrl = config?.apiUrl || '';
    const modelName = config?.modelName || '';
    const responseFormat = config?.responseFormat;
    return callOpenAI(messages, apiKey, apiUrl, modelName, responseFormat);
  }
}

/**
 * 调用 OpenAI API
 */
async function callOpenAI(
  messages: AIMessage[],
  apiKey: string,
  apiUrl: string,
  modelName: string,
  responseFormat?: 'json' | 'text'
): Promise<AIResult> {
  const startTime = Date.now();
  
  // 使用提供的 URL，如果为空则使用默认值
  const finalApiUrl = apiUrl || 'https://api.openai.com/v1';
  
  // 使用提供的 API Key，如果为空则尝试从环境变量获取
  const finalApiKey = apiKey || process.env.OPENAI_API_KEY || '';
  
  if (!finalApiKey) {
    throw new Error('未配置 API Key，请在调试页面设置或配置环境变量 OPENAI_API_KEY');
  }

  console.log(`[AI Client] 开始调用 API: ${finalApiUrl}`);
  console.log(`[AI Client] 模型: ${modelName}`);
  console.log(`[AI Client] 消息数量: ${messages.length}`);
  console.log(`[AI Client] 响应格式: ${responseFormat || 'text'}`);

  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

  try {
    const fetchStart = Date.now();
    
    // 构建请求体
    const requestBody: any = {
      model: modelName,
      messages,
      // 不设置 temperature，使用模型默认值（兼容更多模型）
    };
    
    // 如果指定了 JSON 格式，添加 response_format
    if (responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }
    
    const response = await fetch(`${finalApiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalApiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      // 优化 fetch 配置
      cache: 'no-store',
      keepalive: true,
    });

    const fetchEnd = Date.now();
    console.log(`[AI Client] Fetch 完成，耗时: ${fetchEnd - fetchStart}ms`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API 调用失败: ${response.statusText}`);
    }

    const parseStart = Date.now();
    const data = await response.json();
    const parseEnd = Date.now();
    console.log(`[AI Client] JSON 解析完成，耗时: ${parseEnd - parseStart}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`[AI Client] 总耗时: ${totalTime}ms`);

    // 提取 token 使用信息
    const tokens = data.usage ? {
      promptTokens: data.usage.prompt_tokens || 0,
      completionTokens: data.usage.completion_tokens || 0,
      totalTokens: data.usage.total_tokens || 0,
    } : undefined;

    if (tokens) {
      console.log(`[AI Client] Token 使用: prompt=${tokens.promptTokens}, completion=${tokens.completionTokens}, total=${tokens.totalTokens}`);
    }

    return {
      content: data.choices[0]?.message?.content || '',
      tokens,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API 调用超时（60秒），请检查网络连接或更换 API 地址');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 调用 Ollama 本地模型
 */
async function callOllama(
  messages: AIMessage[],
  ollamaUrl: string,
  ollamaModel: string
): Promise<AIResult> {
  const startTime = Date.now();
  
  if (!ollamaModel) {
    throw new Error('请先在调试页面选择 Ollama 模型');
  }

  console.log(`[AI Client] 开始调用 Ollama: ${ollamaUrl}`);
  console.log(`[AI Client] 模型: ${ollamaModel}`);
  console.log(`[AI Client] 消息数量: ${messages.length}`);

  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120秒超时（本地模型可能需要更长时间）

  try {
    const fetchStart = Date.now();
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ollamaModel,
        messages,
        stream: false,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    const fetchEnd = Date.now();
    console.log(`[AI Client] Ollama Fetch 完成，耗时: ${fetchEnd - fetchStart}ms`);

    if (!response.ok) {
      throw new Error(`Ollama 调用失败: ${response.statusText}`);
    }

    const parseStart = Date.now();
    const data = await response.json();
    const parseEnd = Date.now();
    console.log(`[AI Client] Ollama JSON 解析完成，耗时: ${parseEnd - parseStart}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`[AI Client] Ollama 总耗时: ${totalTime}ms`);

    // Ollama 也返回 token 使用信息（如果有的话）
    const tokens = data.prompt_eval_count || data.eval_count ? {
      promptTokens: data.prompt_eval_count || 0,
      completionTokens: data.eval_count || 0,
      totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
    } : undefined;

    if (tokens) {
      console.log(`[AI Client] Ollama Token 使用: prompt=${tokens.promptTokens}, completion=${tokens.completionTokens}, total=${tokens.totalTokens}`);
    }

    return {
      content: data.message?.content || '',
      tokens,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Ollama 调用超时（120秒），请检查模型是否正常运行');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 获取 Ollama 可用模型列表
 * @returns 模型名称列表
 */
export async function getOllamaModels(): Promise<string[]> {
  const ollamaURL = getOllamaURL();

  try {
    const response = await fetch(`${ollamaURL}/api/tags`);

    if (!response.ok) {
      throw new Error('无法连接到 Ollama 服务');
    }

    const data = await response.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch (error) {
    console.error('获取 Ollama 模型列表失败：', error);
    return [];
  }
}

/**
 * 检查 Ollama 服务是否可用
 * @returns 是否可用
 */
export async function checkOllamaAvailable(): Promise<boolean> {
  const ollamaURL = getOllamaURL();

  try {
    const response = await fetch(`${ollamaURL}/api/tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

