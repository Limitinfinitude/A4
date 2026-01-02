import OpenAI from 'openai';
import { getModelName } from './config';
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

// 周期对比数据
export interface PeriodComparison {
  prev_total_records: number; // 上一周期记录数
  prev_dominant_emotion: string; // 上一周期主导情绪
  prev_avg_intensity: number; // 上一周期平均强度
  prev_negative_rate: number; // 上一周期负向情绪占比
  records_change: number; // 记录数变化（百分比）
  intensity_change: number; // 强度变化
  negative_rate_change: number; // 负向情绪占比变化
}

// 角色偏好数据
export interface RolePreference {
  most_used_role: string; // 最常选择的角色名称
  most_used_role_count: number; // 选择次数
  role_distribution: Record<string, number>; // 角色分布
  emotion_role_pattern?: { // 情绪-角色关联模式（可选）
    emotion: string;
    preferred_role: string;
  }[];
}

// 情绪修正数据
export interface EmotionCorrection {
  total_corrections: number; // 总修正次数
  correction_patterns: { // 常见修正模式
    from: string;
    to: string;
    count: number;
  }[];
}

// 统计数据
export interface SummaryData {
  period: 'recent' | 'week' | 'month'; // 时间段：近期（3天）、本周或本月
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
  // 闭环数据（可选）
  comparison?: PeriodComparison; // 周期对比
  rolePreference?: RolePreference; // 角色偏好
  emotionCorrection?: EmotionCorrection; // 情绪修正
}

/**
 * 生成情绪总结（近期3天、本周或本月）
 * @param summaryData 统计数据
 * @returns AI 生成的总结文本
 */
export async function generateSummary(summaryData: SummaryData): Promise<string> {
  const openai = getOpenAIClient();

  const periodTextMap = {
    recent: '近3天',
    week: '本周',
    month: '本月',
  };
  const periodText = periodTextMap[summaryData.period];

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

  // 根据时间段选择不同的 prompt 重点
  const insightFocus = summaryData.period === 'recent' 
    ? '关注用户近期的情绪状态和可能的触发因素，提供即时的情绪画像'
    : summaryData.period === 'week'
    ? '关注一周内的情绪节奏和模式，探索工作日与休息日的情绪差异'
    : '关注更长期的情绪走向和潜在的成长轨迹';

  // 构建周期对比文本
  let comparisonText = '';
  if (summaryData.comparison) {
    const comp = summaryData.comparison;
    const prevPeriodText = summaryData.period === 'recent' ? '前3天' : summaryData.period === 'week' ? '上周' : '上月';
    comparisonText = `
## 周期对比（${prevPeriodText} vs ${periodText}）
- ${prevPeriodText}记录数：${comp.prev_total_records} 条，${periodText}：${summaryData.total_records} 条（${comp.records_change > 0 ? '+' : ''}${comp.records_change.toFixed(0)}%）
- ${prevPeriodText}主导情绪：${comp.prev_dominant_emotion}，${periodText}：${summaryData.dominant_emotion}
- 情绪强度变化：${comp.intensity_change > 0 ? '上升' : comp.intensity_change < 0 ? '下降' : '持平'} ${Math.abs(comp.intensity_change).toFixed(1)}
- 负向情绪占比变化：${comp.negative_rate_change > 0 ? '增加' : comp.negative_rate_change < 0 ? '减少' : '持平'} ${Math.abs(comp.negative_rate_change).toFixed(1)}%`;
  }

  // 构建角色偏好文本
  let rolePreferenceText = '';
  if (summaryData.rolePreference && summaryData.rolePreference.most_used_role) {
    const rp = summaryData.rolePreference;
    const roleDistText = Object.entries(rp.role_distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([role, count]) => `${role}（${count}次）`)
      .join('、');
    
    rolePreferenceText = `
## 角色选择偏好
- 最常选择的角色：${rp.most_used_role}（${rp.most_used_role_count}次）
- 角色分布：${roleDistText}`;
    
    if (rp.emotion_role_pattern && rp.emotion_role_pattern.length > 0) {
      const patternText = rp.emotion_role_pattern
        .map(p => `${p.emotion}时倾向选择${p.preferred_role}`)
        .join('；');
      rolePreferenceText += `\n- 情绪-角色关联：${patternText}`;
    }
  }

  // 构建情绪修正文本
  let correctionText = '';
  if (summaryData.emotionCorrection && summaryData.emotionCorrection.total_corrections > 0) {
    const ec = summaryData.emotionCorrection;
    correctionText = `
## 情绪自我修正
- 用户共修正了 ${ec.total_corrections} 次 AI 识别的情绪标签`;
    if (ec.correction_patterns.length > 0) {
      const patternText = ec.correction_patterns
        .slice(0, 3)
        .map(p => `"${p.from}"→"${p.to}"（${p.count}次）`)
        .join('、');
      correctionText += `\n- 常见修正模式：${patternText}`;
    }
  }

  const prompt = `你是一位富有洞察力的情绪陪伴者。请基于以下${periodText}的情绪数据，用温暖、有洞察力的语言，帮助用户更好地理解自己的情绪。

## 核心原则（必须遵守）

1. **伦理边界**：
   - 你是情绪记录工具，不是心理咨询师或医生
   - 不做诊断、不贴标签（如"你有焦虑症倾向"）
   - 不给指导性建议（如"你应该..."），只做观察和陪伴
   - 如果发现持续负面情绪，可温和提醒"如果感到困扰，寻求专业支持也是一种力量"

2. **洞察而非总结**：
   - 不要只罗列数据变化，要挖掘情绪背后的可能联系
   - 关注情绪的节奏和模式（如：工作日压力 vs 周末放松）
   - 注意情绪转变的时机和可能的关联
   - 用"也许..."、"看起来..."等开放性表达，避免武断

3. **表达风格**：
   - 温暖但不煽情，专业但不冷漠
   - 用"你"来称呼用户，像朋友一样交流
   - 控制在4-6句话，简洁有力

## 分析重点
${insightFocus}

## 数据统计
- 时间段：${periodText}
- 记录数：${summaryData.total_records} 条
- 最常出现的情绪：${summaryData.dominant_emotion}（${summaryData.dominant_emotion_count}次）
- 情绪分布：${emotionDistributionText}
- 平均情绪强度：${summaryData.avg_intensity.toFixed(1)}（1-3分）
- 强度趋势：${summaryData.intensity_trend === 'up' ? '上升' : summaryData.intensity_trend === 'down' ? '下降' : '稳定'}
- 工作日负向情绪：${weekdayNegativeRate}%（${summaryData.weekday_negative_count}/${summaryData.weekday_total}）
- 周末负向情绪：${weekendNegativeRate}%（${summaryData.weekend_negative_count}/${summaryData.weekend_total}）
- 高频关键词：${keywordsText}

## 用户记录片段
${sampleContentsText}
${comparisonText}
${rolePreferenceText}
${correctionText}

## 输出要求

请生成一段洞察性的情绪观察，包含：

1. **情绪画像**：用一两句话描绘${periodText}的情绪状态，不只是说"焦虑最多"，而是描述这种情绪的质感

2. **变化洞察**（如果有周期对比数据）：
   - 自然地提及与上一周期的对比，让用户感知到"变化"
   - 用鼓励的语气描述积极变化（如："和上周相比，你的情绪明显轻松了一些"）
   - 用理解的语气描述消极变化（如："这周似乎比上周更辛苦一些"）

3. **角色选择洞察**（如果有角色偏好数据）：
   - 如果用户有明显的角色偏好，温和地指出这可能意味着什么
   - 例如："你常常选择理性严师，也许在情绪里你更需要的是'理清思路'"
   - 例如："焦虑时你倾向于找树洞倾听者，看起来那时候你最需要的是被听见"

4. **自我觉察**（如果有情绪修正数据）：
   - 如果用户修正过情绪标签，可以提及这体现了自我觉察
   - 例如："你几次把'焦虑'修正为'疲惫'——也许你的疲惫里藏着一些焦虑的影子"

5. **温暖收尾**：用一句简短、温暖但不说教的话结尾

**重要**：不要生硬地罗列上面所有点，而是自然地融合成一段流畅的文字。根据数据的丰富程度，选择最有洞察价值的点来说。

示例风格（有周期对比时）：
"这周，你的情绪比上周平静了不少，负向情绪减少了将近一半。你常常选择理性严师来回应自己，看起来在情绪里你更需要的是理清思路。这周你提到的关键词从'加班'变成了'休息'，这个变化本身就值得被看见。"

直接输出总结文本，不要包含任何标题、编号或格式标记。`;

  try {
    // 移除 max_completion_tokens 以兼容第三方 API
    const response = await openai.chat.completions.create({
      model: getModelName(),
      messages: [
        {
          role: 'system',
          content: '你是一位富有洞察力的情绪陪伴者，擅长用温暖、有深度的语言帮助用户理解自己的情绪。你遵守伦理边界，不做诊断和指导，只提供观察和陪伴。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.75,
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

