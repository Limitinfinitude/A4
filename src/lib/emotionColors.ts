import { EMOTION_TAGS, type EmotionTag } from './analyzeMood';

/**
 * 情绪颜色映射 - 12种情绪有明显差别
 * 正向情绪：明亮温暖
 * 负向情绪：深沉或警示
 * 中性：柔和
 */
export const EMOTION_COLORS: Record<EmotionTag, {
  bg: string;        // 背景色（浅色）
  bgDark: string;    // 深色模式背景
  text: string;      // 文字色
  textDark: string;  // 深色模式文字
  border: string;    // 边框色
  borderDark: string;// 深色模式边框
  hex: string;       // 十六进制颜色（用于图表）
}> = {
  // 正向情绪（4种）
  joy: {
    bg: 'bg-yellow-50',
    bgDark: 'dark:bg-yellow-900/20',
    text: 'text-yellow-700',
    textDark: 'dark:text-yellow-300',
    border: 'border-yellow-400',
    borderDark: 'dark:border-yellow-500',
    hex: '#fbbf24', // yellow-400
  },
  satisfaction: {
    bg: 'bg-green-50',
    bgDark: 'dark:bg-green-900/20',
    text: 'text-green-700',
    textDark: 'dark:text-green-300',
    border: 'border-green-400',
    borderDark: 'dark:border-green-500',
    hex: '#4ade80', // green-400
  },
  calm: {
    bg: 'bg-blue-50',
    bgDark: 'dark:bg-blue-900/20',
    text: 'text-blue-700',
    textDark: 'dark:text-blue-300',
    border: 'border-blue-400',
    borderDark: 'dark:border-blue-500',
    hex: '#60a5fa', // blue-400
  },
  hope: {
    bg: 'bg-purple-50',
    bgDark: 'dark:bg-purple-900/20',
    text: 'text-purple-700',
    textDark: 'dark:text-purple-300',
    border: 'border-purple-400',
    borderDark: 'dark:border-purple-500',
    hex: '#a78bfa', // purple-400
  },
  // 负向情绪（6种）
  sadness: {
    bg: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-900/20',
    text: 'text-indigo-700',
    textDark: 'dark:text-indigo-300',
    border: 'border-indigo-400',
    borderDark: 'dark:border-indigo-500',
    hex: '#818cf8', // indigo-400
  },
  anger: {
    bg: 'bg-red-50',
    bgDark: 'dark:bg-red-900/20',
    text: 'text-red-700',
    textDark: 'dark:text-red-300',
    border: 'border-red-500',
    borderDark: 'dark:border-red-600',
    hex: '#ef4444', // red-500
  },
  anxiety: {
    bg: 'bg-orange-50',
    bgDark: 'dark:bg-orange-900/20',
    text: 'text-orange-700',
    textDark: 'dark:text-orange-300',
    border: 'border-orange-400',
    borderDark: 'dark:border-orange-500',
    hex: '#fb923c', // orange-400
  },
  fear: {
    bg: 'bg-rose-50',
    bgDark: 'dark:bg-rose-900/20',
    text: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    border: 'border-rose-500',
    borderDark: 'dark:border-rose-600',
    hex: '#f43f5e', // rose-500
  },
  frustration: {
    bg: 'bg-violet-50',
    bgDark: 'dark:bg-violet-900/20',
    text: 'text-violet-700',
    textDark: 'dark:text-violet-300',
    border: 'border-violet-400',
    borderDark: 'dark:border-violet-500',
    hex: '#a78bfa', // violet-400
  },
  tired: {
    bg: 'bg-slate-50',
    bgDark: 'dark:bg-slate-900/20',
    text: 'text-slate-700',
    textDark: 'dark:text-slate-300',
    border: 'border-slate-400',
    borderDark: 'dark:border-slate-500',
    hex: '#94a3b8', // slate-400
  },
  // 中性/特殊（2种）
  surprise: {
    bg: 'bg-pink-50',
    bgDark: 'dark:bg-pink-900/20',
    text: 'text-pink-700',
    textDark: 'dark:text-pink-300',
    border: 'border-pink-400',
    borderDark: 'dark:border-pink-500',
    hex: '#f472b6', // pink-400
  },
  neutral: {
    bg: 'bg-gray-50',
    bgDark: 'dark:bg-gray-800/20',
    text: 'text-gray-700',
    textDark: 'dark:text-gray-300',
    border: 'border-gray-400',
    borderDark: 'dark:border-gray-500',
    hex: '#9ca3af', // gray-400
  },
};

/**
 * 获取情绪颜色
 */
export function getEmotionColor(emotionTag: EmotionTag) {
  return EMOTION_COLORS[emotionTag] || EMOTION_COLORS.neutral;
}

/**
 * 获取情绪颜色（用于图表）
 */
export function getEmotionColorHex(emotionTag: EmotionTag): string {
  return EMOTION_COLORS[emotionTag]?.hex || EMOTION_COLORS.neutral.hex;
}

