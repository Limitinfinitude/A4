import { EMOTION_TAGS, type EmotionTag } from './analyzeMood';

/**
 * 根据心情图标映射到对应的情绪标签
 */
export function iconToEmotionTag(icon: string): EmotionTag {
  const iconEmotionMap: Record<string, EmotionTag> = {
    '😊': 'joy',           // 快乐、开心
    '😢': 'sadness',       // 伤心、低落
    '😡': 'anger',         // 愤怒、生气
    '😰': 'anxiety',       // 焦虑、紧张
    '😴': 'tired',         // 疲惫、累
    '😌': 'calm',          // 平静、放松
    '🤔': 'neutral',       // 思考、困惑（中性）
    '😎': 'satisfaction',  // 满足、认可
    '😔': 'sadness',       // 失落、沮丧
    '😍': 'joy',           // 兴奋、激动（快乐）
    '😤': 'frustration',   // 挫败、无力
    '😐': 'neutral',       // 中性、平静
  };

  return iconEmotionMap[icon] || 'neutral';
}

/**
 * 根据心情图标获取情绪关键词
 */
export function iconToKeywords(icon: string): string[] {
  const iconKeywordsMap: Record<string, string[]> = {
    '😊': ['开心', '快乐'],
    '😢': ['难过', '伤心'],
    '😡': ['愤怒', '生气'],
    '😰': ['焦虑', '紧张'],
    '😴': ['疲惫', '累'],
    '😌': ['平静', '放松'],
    '🤔': ['思考', '困惑'],
    '😎': ['满足', '认可'],
    '😔': ['失落', '沮丧'],
    '😍': ['兴奋', '激动'],
    '😤': ['挫败', '无力'],
    '😐': ['平静', '无波'],
  };

  return iconKeywordsMap[icon] || ['平静'];
}

