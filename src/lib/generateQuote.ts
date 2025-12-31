import OpenAI from 'openai';

// 获取 OpenAI 客户端（延迟初始化）
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 环境变量未设置');
  }
  return new OpenAI({
    apiKey,
  });
}

/**
 * 根据心情图标生成一句名言/金句
 * @param moodIcon 心情图标（emoji）
 * @returns 一句温暖的名言或金句
 */
export async function generateQuote(moodIcon: string): Promise<string> {
  if (!moodIcon) {
    throw new Error('心情图标不能为空');
  }

  try {
    const openai = getOpenAIClient();

    // 根据图标推测情绪
    const iconToEmotion: Record<string, string> = {
      '😊': '开心、快乐',
      '😢': '难过、伤心',
      '😡': '愤怒、生气',
      '😰': '焦虑、紧张',
      '😴': '疲惫、累',
      '😌': '平静、放松',
      '🤔': '思考、困惑',
      '😎': '满足、认可',
      '😔': '失落、沮丧',
      '😍': '兴奋、激动',
      '😤': '挫败、无力',
      '😐': '中性、平静',
    };

    const emotion = iconToEmotion[moodIcon] || '当前情绪';

    const prompt = `用户选择了心情图标：${moodIcon}，表示${emotion}的情绪状态。

请生成一句温暖、治愈的名言或金句，要求：
1. 可以是经典名言、诗句、或者原创的温暖话语
2. 要与当前情绪状态相关，能够给予力量或安慰
3. 语言简洁有力，不超过30字
4. 如果是引用名言，请注明出处（如"—— 鲁迅"），如果是原创，则不需要出处

直接输出这句话，不要包含其他说明文字。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一位擅长用名言和温暖话语给予情感支持的助手。请根据用户的心情，生成一句合适的名言或金句。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 100,
    });

    const quote = response.choices[0]?.message?.content?.trim();
    if (!quote) {
      throw new Error('生成名言失败');
    }

    return quote;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error('API 密钥无效，请检查 OPENAI_API_KEY 环境变量');
      } else if (error.status === 429) {
        throw new Error('API 调用频率过高，请稍后再试');
      } else if (error.status === 500) {
        throw new Error('OpenAI 服务暂时不可用，请稍后再试');
      } else {
        throw new Error(`API 调用失败：${error.message}`);
      }
    } else if (error instanceof Error) {
      throw new Error(`生成名言失败：${error.message}`);
    } else {
      throw new Error('生成名言失败：未知错误，请稍后再试');
    }
  }
}

