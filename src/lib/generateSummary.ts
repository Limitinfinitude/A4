import OpenAI from 'openai';
import { EMOTION_TAGS } from './analyzeMood';

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

// 统计数据
export interface SummaryData {
  period: 'week' | 'month'; // 时间段：本周或本月
  dominant_emotion: string; // 最常出现的情绪（中文）
  dominant_emotion_count: number; // 出现次数
  total_records: number; // 总记录数
  emotion_distribution: Record<string, number>; // 各情绪出现次数
  avg_intensity: number; // 平均强度
  intensity_trend: 'up' | 'down' | 'stable'; // 强度趋势
  weekday_negative_count: number; // 工作日负向情绪次数
  weekend_negative_count: number; // 周末负向情绪次数
  weekday_total: number; // 工作日总记录
  weekend_total: number; // 周末总记录
  content_keywords: string[]; // 用户经常提到的关键词/内容
  sample_contents: string[]; // 示例内容（用于分析）
}

/**
 * 生成情绪总结（本周或本月）
 * @param summaryData 统计数据
 * @returns AI 生成的总结文本
 */
export async function generateSummary(summaryData: SummaryData): Promise<string> {
  const openai = getOpenAIClient();

  const periodText = summaryData.period === 'week' ? '本周' : '本月';

  // 构建情绪分布描述
  const emotionDistributionText = Object.entries(summaryData.emotion_distribution)
    .map(([emotion, count]) => {
      const percentage = ((count / summaryData.total_records) * 100).toFixed(1);
      return `${emotion}（${count}次，${percentage}%）`;
    })
    .join('、');

  // 判断工作日和周末的情绪差异
  const weekdayNegativeRate = summaryData.weekday_total > 0 
    ? ((summaryData.weekday_negative_count / summaryData.weekday_total) * 100).toFixed(1)
    : '0';
  const weekendNegativeRate = summaryData.weekend_total > 0
    ? ((summaryData.weekend_negative_count / summaryData.weekend_total) * 100).toFixed(1)
    : '0';

  // 构建内容关键词描述
  const keywordsText = summaryData.content_keywords.length > 0
    ? summaryData.content_keywords.join('、')
    : '无明显重复主题';

  // 示例内容（用于上下文理解和提取典型句）
  const sampleContentsText = summaryData.sample_contents.slice(0, 5)
    .map((content, index) => {
      // 提取较短的典型句（如果内容太长，取前80字）
      const displayContent = content.length > 80 ? content.substring(0, 80) + '...' : content;
      return `示例${index + 1}：${displayContent}`;
    })
    .join('\n');

  const prompt = `你是一位专业的情绪观察分析师。请基于以下${periodText}的情绪数据，用自然、温暖的语言总结观察结果。

重要要求：
1. 只给观察，不要给建议或指导
2. 用"你"来称呼用户
3. 语言要自然、温暖、专业
4. 总结要简洁，控制在6-8句话
5. 严格按照以下顺序组织内容：
   - 第一部分（情绪走向）：先说明${periodText}的整体情绪走向，包括最常出现的情绪、情绪分布、强度趋势、工作日/周末差异等
   - 第二部分（关键词/典型句）：再说出你经常提到的关键词或典型句，使用"${periodText}你经常提到..."的句式

数据统计：
- 时间段：${periodText}
- 最常出现的情绪：${summaryData.dominant_emotion}（出现${summaryData.dominant_emotion_count}次，共${summaryData.total_records}条记录）
- 情绪分布：${emotionDistributionText}
- 平均情绪强度：${summaryData.avg_intensity.toFixed(1)}
- 强度趋势：${summaryData.intensity_trend === 'up' ? '上升' : summaryData.intensity_trend === 'down' ? '下降' : '稳定'}
- 工作日负向情绪占比：${weekdayNegativeRate}%（${summaryData.weekday_negative_count}/${summaryData.weekday_total}）
- 周末负向情绪占比：${weekendNegativeRate}%（${summaryData.weekend_negative_count}/${summaryData.weekend_total}）
- 你经常提到的关键词/主题：${keywordsText}

示例内容片段（用于理解上下文）：
${sampleContentsText}

请生成一段自然、温暖的观察总结，严格按照以下结构：

【第一部分：情绪走向】
- 说明${periodText}的整体情绪特征（最常出现的情绪、情绪分布情况）
- 描述情绪强度趋势（上升/下降/稳定）
- 如果有明显差异，说明工作日和周末的情绪差异

【第二部分：关键词/典型句】
- 使用"${periodText}你经常提到..."的句式
- 先列出用户经常提到的关键词（如：工作压力、睡眠不足）
- 然后可以从示例内容中提取1-2个典型句子或表达作为补充（用引号标注，如："今天又加班到很晚"、"感觉好累"）

示例风格（注意顺序）：
"${periodText}，焦虑是最常出现的情绪，在工作日尤其明显，负向情绪占比达到60%。周末时情绪明显缓和，负向情绪占比下降到30%。整体来看，情绪强度呈上升趋势。${periodText}你经常提到工作压力和睡眠不足，比如'今天又加班到很晚'、'感觉好累'等。"

直接输出总结文本，不要包含任何其他说明或格式。`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的情绪观察分析师，擅长用自然、温暖的语言总结情绪数据。你只提供观察，不提供建议。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    if (!summary) {
      throw new Error('AI 返回内容为空');
    }

    return summary;
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
      throw new Error(`生成总结失败：${error.message}`);
    } else {
      throw new Error('生成总结失败：未知错误，请稍后再试');
    }
  }
}

