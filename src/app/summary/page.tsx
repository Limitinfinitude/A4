'use client';

import { useState, useEffect, useMemo } from 'react';
import { EMOTION_TAGS } from '@/lib/analyzeMood';
import { getRoleInfo } from '@/lib/roleUtils';
import { getEmotionColorHex } from '@/lib/emotionColors';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import MainLayout from '@/components/MainLayout';

// 获取情绪标签的中文显示（统一格式：只显示第一个词）
function getEmotionDisplayName(emotionTag: string): string {
  const emotionTagInfo = Object.values(EMOTION_TAGS).find(
    (tag) => tag.en === emotionTag
  );
  if (!emotionTagInfo) return emotionTag;
  
  // 只取第一个词（去掉"、"后面的部分）
  const firstWord = emotionTagInfo.zh.split('、')[0];
  return firstWord;
}

// 根据数据生成智能文案
function generateInsightText(data: {
  period: 'day' | 'week' | 'month';
  totalRecords: number;
  dominantEmotion: string;
  dominantEmotionCount: number;
  emotionDistribution: Record<string, number>;
}): string {
  const { period, totalRecords, dominantEmotion, dominantEmotionCount, emotionDistribution } = data;
  
  if (totalRecords === 0) {
    return period === 'day' 
      ? '今天还没有记录心情哦，快去记录一下吧！' 
      : period === 'week' 
      ? '本周还没有记录心情哦，快去记录一下吧！'
      : '本月还没有记录心情哦，快去记录一下吧！';
  }
  
  const periodText = period === 'day' ? '今天' : period === 'week' ? '本周' : '本月';
  const dominantRatio = (dominantEmotionCount / totalRecords) * 100;
  
  // 定义积极、消极情绪
  const positiveEmotions = ['喜悦', '满足', '希望', '平静'];
  const negativeEmotions = ['悲伤', '愤怒', '焦虑', '恐惧', '挫败', '疲惫'];
  
  const isPositive = positiveEmotions.includes(dominantEmotion);
  const isNegative = negativeEmotions.includes(dominantEmotion);
  
  // 计算情绪多样性
  const emotionCount = Object.keys(emotionDistribution).length;
  
  // 生成文案
  let text = '';
  
  if (isPositive && dominantRatio > 60) {
    text = `${periodText}你的情绪不错！${dominantEmotion}占比${dominantRatio.toFixed(0)}%，继续保持这份美好心情吧！`;
  } else if (isNegative && dominantRatio > 60) {
    text = `${periodText}你的${dominantEmotion}情绪占比${dominantRatio.toFixed(0)}%，请注意调节心情，适当放松一下。`;
  } else if (emotionCount >= 5) {
    text = `${periodText}你的情绪比较多样化，记录了${emotionCount}种不同的情绪，这说明你的生活丰富多彩。`;
  } else if (dominantRatio > 40) {
    text = `${periodText}你的主要情绪是${dominantEmotion}（${dominantRatio.toFixed(0)}%），整体情绪较为稳定。`;
  } else {
    text = `${periodText}你记录了${totalRecords}次心情，情绪分布较为均衡，保持这份平和吧！`;
  }
  
  // 添加记录数提示
  if (totalRecords < 3 && period === 'day') {
    text += ' 今天的记录还比较少，可以多记录几次哦！';
  } else if (totalRecords >= 10 && period === 'day') {
    text += ' 今天记录了很多次，真是用心在记录生活呢！';
  }
  
  return text;
}

// 类型定义
type MoodAnalysisResult = {
  keyWords: string[];
  emotionTag: string;
  feedback: string;
  slogan: string;
};

type MoodRecord = {
  id: number;
  content: string;
  role: string; // 角色ID（固定角色或自定义角色）
  feedback: MoodAnalysisResult;
  createTime: string;
  originalEmotionTag?: string; // 原始情绪标签（用户修正前）
};

type ViewMode = 'line' | 'pie' | 'trend' | 'calendar';
type TimePeriod = 'day' | 'week' | 'month';

// 日历日期类型
type CalendarDay = {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  moodStatus: 'none' | 'positive' | 'negative' | 'neutral';
  recordCount: number;
};

export default function SummaryPage() {
  const [history, setHistory] = useState<MoodRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [summaryPeriod, setSummaryPeriod] = useState<'recent' | 'week' | 'month'>('recent');
  const [recentSummary, setRecentSummary] = useState<string>('');
  const [weekSummary, setWeekSummary] = useState<string>('');
  const [monthSummary, setMonthSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [linePeriod, setLinePeriod] = useState<TimePeriod>('day');
  const [piePeriod, setPiePeriod] = useState<TimePeriod>('day');
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('mood_history') || '[]') as MoodRecord[];
    setHistory(savedHistory);
    
    // 检查是否首次访问统计页面
    const hasVisitedSummary = localStorage.getItem('has_visited_summary');
    if (!hasVisitedSummary) {
      setShowGuide(true);
    }
  }, []);

  // 情绪强度映射
  const emotionIntensityMap: Record<string, number> = {
    joy: 3,
    satisfaction: 2,
    calm: 1,
    hope: 2,
    sadness: -2,
    anger: -3,
    anxiety: -2,
    fear: -3,
    frustration: -2,
    tired: -1,
    surprise: 0,
    neutral: 0,
  };

  // 情绪颜色映射（使用工具函数）
  const getEmotionColor = (emotionTag: string) => {
    return getEmotionColorHex(emotionTag as any);
  };

  // 计算日历数据
  const calculateCalendarData = useMemo((): CalendarDay[] => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 获取第一天是星期几（0-6，0是周日）
    const firstDayOfWeek = firstDay.getDay();
    
    // 计算需要显示的日期范围（包括上月和下月的日期）
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    // 生成6周的日期（42天）
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isCurrentMonth = currentDate.getMonth() === month;
      
      // 获取当天的记录
      const dayRecords = history.filter((record) => {
        const recordDate = new Date(record.createTime).toISOString().split('T')[0];
        return recordDate === dateStr;
      });
      
      let moodStatus: 'none' | 'positive' | 'negative' | 'neutral' = 'none';
      
      if (dayRecords.length > 0) {
        // 定义积极、消极和中性情绪
        const positiveEmotions = ['joy', 'satisfaction', 'hope', 'calm'];
        const negativeEmotions = ['sadness', 'anger', 'anxiety', 'fear', 'frustration', 'tired'];
        const neutralEmotions = ['neutral', 'surprise'];
        
        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;
        
        dayRecords.forEach((record) => {
          const emotion = record.feedback.emotionTag;
          if (positiveEmotions.includes(emotion)) {
            positiveCount++;
          } else if (negativeEmotions.includes(emotion)) {
            negativeCount++;
          } else {
            neutralCount++;
          }
        });
        
        // 计算占比并确定主导情绪
        const total = dayRecords.length;
        const positiveRatio = positiveCount / total;
        const negativeRatio = negativeCount / total;
        
        if (positiveRatio > 0.5) {
          moodStatus = 'positive';
        } else if (negativeRatio > 0.5) {
          moodStatus = 'negative';
        } else {
          moodStatus = 'neutral';
        }
      }
      
      days.push({
        date: new Date(currentDate),
        dateStr,
        isCurrentMonth,
        moodStatus,
        recordCount: dayRecords.length,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [history, calendarMonth]);

  // 获取所有可用的日期
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    history.forEach((record) => {
      const date = new Date(record.createTime);
      const dateStr = date.toISOString().split('T')[0];
      dates.add(dateStr);
    });
    return Array.from(dates).sort().reverse();
  }, [history]);

  // 初始化选中的日期
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // 生成智能文案（线性统计）
  const lineInsightText = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    if (linePeriod === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (linePeriod === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const periodRecords = history.filter((record) => {
      const recordDate = new Date(record.createTime);
      return recordDate >= startDate && recordDate <= now;
    });
    
    const emotionCount: Record<string, number> = {};
    periodRecords.forEach((record) => {
      const emotionName = getEmotionDisplayName(record.feedback.emotionTag);
      emotionCount[emotionName] = (emotionCount[emotionName] || 0) + 1;
    });
    
    const dominantEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0];
    
    return generateInsightText({
      period: linePeriod,
      totalRecords: periodRecords.length,
      dominantEmotion: dominantEmotion?.[0] || '中性',
      dominantEmotionCount: dominantEmotion?.[1] || 0,
      emotionDistribution: emotionCount,
    });
  }, [history, linePeriod]);

  // 生成智能文案（扇形统计）
  const pieInsightText = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    if (piePeriod === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (piePeriod === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const periodRecords = history.filter((record) => {
      const recordDate = new Date(record.createTime);
      return recordDate >= startDate && recordDate <= now;
    });
    
    const emotionCount: Record<string, number> = {};
    periodRecords.forEach((record) => {
      const emotionName = getEmotionDisplayName(record.feedback.emotionTag);
      emotionCount[emotionName] = (emotionCount[emotionName] || 0) + 1;
    });
    
    const dominantEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0];
    
    return generateInsightText({
      period: piePeriod,
      totalRecords: periodRecords.length,
      dominantEmotion: dominantEmotion?.[0] || '中性',
      dominantEmotionCount: dominantEmotion?.[1] || 0,
      emotionDistribution: emotionCount,
    });
  }, [history, piePeriod]);

  // 线性统计数据（天/周/月）
  const lineChartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let groupBy: 'hour' | 'day' = 'hour';
    
    if (linePeriod === 'day') {
      // 今天的数据，按小时分组
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      groupBy = 'hour';
    } else if (linePeriod === 'week') {
      // 最近7天，按天分组
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupBy = 'day';
    } else {
      // 本月，按天分组
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupBy = 'day';
    }
    
    const periodRecords = history.filter((record) => {
      const recordDate = new Date(record.createTime);
      return recordDate >= startDate && recordDate <= endDate;
    });
    
    if (periodRecords.length === 0) return [];
    
    // 按时间分组
    const groups: Record<string, MoodRecord[]> = {};
    
    periodRecords.forEach((record) => {
      const date = new Date(record.createTime);
      let key: string;
      
      if (groupBy === 'hour') {
        key = `${String(date.getHours()).padStart(2, '0')}:00`;
      } else {
        key = `${date.getMonth() + 1}/${date.getDate()}`;
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (groupBy === 'hour') {
          return parseInt(a) - parseInt(b);
        }
        return a.localeCompare(b);
      })
      .map(([key, records]) => {
        const intensities = records.map(r => Math.abs(emotionIntensityMap[r.feedback.emotionTag] || 0));
        const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
        
        const emotionCount: Record<string, number> = {};
        records.forEach((record) => {
          emotionCount[record.feedback.emotionTag] = (emotionCount[record.feedback.emotionTag] || 0) + 1;
        });
        const dominantEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
        
        return {
          time: key,
          intensity: Math.round(avgIntensity * 10) / 10,
          dominant_emotion: getEmotionDisplayName(dominantEmotion),
          emotionTag: dominantEmotion,
          count: records.length,
        };
      });
  }, [history, linePeriod]);

  // 扇形统计数据（天/周/月）
  const pieChartData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    if (piePeriod === 'day') {
      // 今天
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (piePeriod === 'week') {
      // 最近7天
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // 本月
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const periodRecords = history.filter((record) => {
      const recordDate = new Date(record.createTime);
      return recordDate >= startDate && recordDate <= now;
    });

    const emotionCount: Record<string, number> = {};
    periodRecords.forEach((record) => {
      const emotionName = getEmotionDisplayName(record.feedback.emotionTag);
      emotionCount[emotionName] = (emotionCount[emotionName] || 0) + 1;
    });

    return Object.entries(emotionCount).map(([name, value]) => {
      // 根据显示名称反向查找对应的 emotionTag
      const emotionTag = Object.values(EMOTION_TAGS).find(
        tag => tag.zh.split('、')[0] === name
      )?.en || name;
      
      return {
        name,
        value,
        emotionTag,
      };
    });
  }, [history, piePeriod]);

  // 3️⃣ 周/月趋势
  const trendData = useMemo(() => {
    const dateGroups: Record<string, MoodRecord[]> = {};
    history.forEach((record) => {
      const date = new Date(record.createTime);
      const dateStr = date.toISOString().split('T')[0];
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = [];
      }
      dateGroups[dateStr].push(record);
    });

    return Object.entries(dateGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, records]) => {
        const intensities = records.map(r => Math.abs(emotionIntensityMap[r.feedback.emotionTag] || 0));
        const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
        
        const emotionCount: Record<string, number> = {};
        records.forEach((record) => {
          emotionCount[record.feedback.emotionTag] = (emotionCount[record.feedback.emotionTag] || 0) + 1;
        });
        const dominantEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
        
        const date = new Date(dateStr);
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          fullDate: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          avg_intensity: Math.round(avgIntensity * 10) / 10,
          dominant_emotion: getEmotionDisplayName(dominantEmotion),
          dominant_emotion_tag: dominantEmotion,
        };
      });
  }, [history]);

  // 提取内容关键词
  const extractContentKeywords = (contents: string[]): string[] => {
    const wordCount: Record<string, number> = {};
    const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']);
    
    contents.forEach((content) => {
      const words: string[] = [];
      for (let i = 0; i < content.length - 1; i++) {
        for (let len = 2; len <= 4 && i + len <= content.length; len++) {
          const word = content.substring(i, i + len);
          if (!stopWords.has(word) && word.length >= 2) {
            words.push(word);
          }
        }
      }
      
      words.forEach((word) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  };

  // 计算统计数据
  const calculateSummaryData = (period: 'recent' | 'week' | 'month') => {
    const now = new Date();
    let startDate: Date;
    
    if (period === 'recent') {
      startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const periodRecords = history.filter((record) => {
      const recordDate = new Date(record.createTime);
      return recordDate >= startDate && recordDate <= now;
    });

    if (periodRecords.length === 0) return null;

    const emotionCount: Record<string, number> = {};
    periodRecords.forEach((record) => {
      const emotionName = getEmotionDisplayName(record.feedback.emotionTag);
      emotionCount[emotionName] = (emotionCount[emotionName] || 0) + 1;
    });

    const dominantEmotion = Object.entries(emotionCount).sort((a, b) => b[1] - a[1])[0];

    const intensities = periodRecords.map((r) => Math.abs(emotionIntensityMap[r.feedback.emotionTag] || 0));
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;

    const sortedRecords = [...periodRecords].sort(
      (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
    );
    const midPoint = Math.floor(sortedRecords.length / 2);
    const firstHalf = sortedRecords.slice(0, midPoint);
    const secondHalf = sortedRecords.slice(midPoint);
    
    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, r) => sum + Math.abs(emotionIntensityMap[r.feedback.emotionTag] || 0), 0) / firstHalf.length
      : 0;
    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, r) => sum + Math.abs(emotionIntensityMap[r.feedback.emotionTag] || 0), 0) / secondHalf.length
      : 0;
    
    let intensityTrend: 'up' | 'down' | 'stable' = 'stable';
    if (secondHalfAvg > firstHalfAvg + 0.2) intensityTrend = 'up';
    else if (secondHalfAvg < firstHalfAvg - 0.2) intensityTrend = 'down';

    const negativeEmotions = ['sadness', 'anger', 'anxiety', 'fear', 'frustration', 'tired'];
    let weekdayNegativeCount = 0;
    let weekendNegativeCount = 0;
    let weekdayTotal = 0;
    let weekendTotal = 0;

    periodRecords.forEach((record) => {
      const recordDate = new Date(record.createTime);
      const dayOfWeek = recordDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isNegative = negativeEmotions.includes(record.feedback.emotionTag);

      if (isWeekend) {
        weekendTotal++;
        if (isNegative) weekendNegativeCount++;
      } else {
        weekdayTotal++;
        if (isNegative) weekdayNegativeCount++;
      }
    });

    const contents = periodRecords.map(r => r.content);
    const contentKeywords = extractContentKeywords(contents);
    const sampleContents = contents.slice(0, 5);

    // === 闭环数据计算 ===

    // 1. 周期对比数据
    let comparison = undefined;
    let prevStartDate: Date;
    let prevEndDate: Date;
    
    if (period === 'recent') {
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    } else if (period === 'week') {
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0); // 上月最后一天
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 上月第一天
    }

    const prevRecords = history.filter((record) => {
      const recordDate = new Date(record.createTime);
      return recordDate >= prevStartDate && recordDate <= prevEndDate;
    });

    if (prevRecords.length > 0) {
      const prevEmotionCount: Record<string, number> = {};
      prevRecords.forEach((record) => {
        const emotionName = getEmotionDisplayName(record.feedback.emotionTag);
        prevEmotionCount[emotionName] = (prevEmotionCount[emotionName] || 0) + 1;
      });
      const prevDominantEmotion = Object.entries(prevEmotionCount).sort((a, b) => b[1] - a[1])[0];
      const prevIntensities = prevRecords.map((r) => Math.abs(emotionIntensityMap[r.feedback.emotionTag] || 0));
      const prevAvgIntensity = prevIntensities.reduce((a, b) => a + b, 0) / prevIntensities.length;
      
      const prevNegativeCount = prevRecords.filter(r => negativeEmotions.includes(r.feedback.emotionTag)).length;
      const prevNegativeRate = (prevNegativeCount / prevRecords.length) * 100;
      const currentNegativeCount = weekdayNegativeCount + weekendNegativeCount;
      const currentNegativeRate = (currentNegativeCount / periodRecords.length) * 100;

      comparison = {
        prev_total_records: prevRecords.length,
        prev_dominant_emotion: prevDominantEmotion[0],
        prev_avg_intensity: prevAvgIntensity,
        prev_negative_rate: prevNegativeRate,
        records_change: prevRecords.length > 0 ? ((periodRecords.length - prevRecords.length) / prevRecords.length) * 100 : 0,
        intensity_change: avgIntensity - prevAvgIntensity,
        negative_rate_change: currentNegativeRate - prevNegativeRate,
      };
    }

    // 2. 角色偏好数据
    const roleCount: Record<string, number> = {};
    const emotionRoleMap: Record<string, Record<string, number>> = {};
    
    periodRecords.forEach((record) => {
      if (record.role && record.role !== 'quote') {
        const roleInfo = getRoleInfo(record.role);
        const roleName = roleInfo.name;
        roleCount[roleName] = (roleCount[roleName] || 0) + 1;
        
        // 统计情绪-角色关联
        const emotionName = getEmotionDisplayName(record.feedback.emotionTag);
        if (!emotionRoleMap[emotionName]) emotionRoleMap[emotionName] = {};
        emotionRoleMap[emotionName][roleName] = (emotionRoleMap[emotionName][roleName] || 0) + 1;
      }
    });

    let rolePreference = undefined;
    const roleEntries = Object.entries(roleCount).sort((a, b) => b[1] - a[1]);
    if (roleEntries.length > 0) {
      // 找出每种情绪最偏好的角色
      const emotionRolePattern: { emotion: string; preferred_role: string }[] = [];
      Object.entries(emotionRoleMap).forEach(([emotion, roles]) => {
        const sortedRoles = Object.entries(roles).sort((a, b) => b[1] - a[1]);
        if (sortedRoles.length > 0 && sortedRoles[0][1] >= 2) { // 至少选择2次才算偏好
          emotionRolePattern.push({ emotion, preferred_role: sortedRoles[0][0] });
        }
      });

      rolePreference = {
        most_used_role: roleEntries[0][0],
        most_used_role_count: roleEntries[0][1],
        role_distribution: roleCount,
        emotion_role_pattern: emotionRolePattern.length > 0 ? emotionRolePattern : undefined,
      };
    }

    // 3. 情绪修正数据
    const correctionMap: Record<string, number> = {};
    periodRecords.forEach((record) => {
      if (record.originalEmotionTag && record.originalEmotionTag !== record.feedback.emotionTag) {
        const fromName = getEmotionDisplayName(record.originalEmotionTag);
        const toName = getEmotionDisplayName(record.feedback.emotionTag);
        const key = `${fromName}→${toName}`;
        correctionMap[key] = (correctionMap[key] || 0) + 1;
      }
    });

    let emotionCorrection = undefined;
    const correctionEntries = Object.entries(correctionMap).sort((a, b) => b[1] - a[1]);
    if (correctionEntries.length > 0) {
      emotionCorrection = {
        total_corrections: correctionEntries.reduce((sum, [, count]) => sum + count, 0),
        correction_patterns: correctionEntries.slice(0, 5).map(([key, count]) => {
          const [from, to] = key.split('→');
          return { from, to, count };
        }),
      };
    }

    return {
      period,
      dominant_emotion: dominantEmotion[0],
      dominant_emotion_count: dominantEmotion[1],
      total_records: periodRecords.length,
      emotion_distribution: emotionCount,
      avg_intensity: avgIntensity,
      intensity_trend: intensityTrend,
      weekday_negative_count: weekdayNegativeCount,
      weekend_negative_count: weekendNegativeCount,
      weekday_total: weekdayTotal,
      weekend_total: weekendTotal,
      content_keywords: contentKeywords,
      sample_contents: sampleContents,
      // 闭环数据
      comparison,
      rolePreference,
      emotionCorrection,
    };
  };

  const recentSummaryData = useMemo(() => calculateSummaryData('recent'), [history, emotionIntensityMap]);
  const weekSummaryData = useMemo(() => calculateSummaryData('week'), [history, emotionIntensityMap]);
  const monthSummaryData = useMemo(() => calculateSummaryData('month'), [history, emotionIntensityMap]);

  // 生成 AI 总结
  const handleGenerateSummary = async () => {
    const summaryDataMap = {
      recent: recentSummaryData,
      week: weekSummaryData,
      month: monthSummaryData,
    };
    const summaryData = summaryDataMap[summaryPeriod];
    if (!summaryData) return;

    setSummaryLoading(true);
    try {
      const { getClientAIConfig } = await import('@/lib/clientConfig');
      const aiConfig = getClientAIConfig();
      
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryData, aiConfig }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '生成总结失败');
      }

      const data = await res.json();
      if (summaryPeriod === 'recent') {
        setRecentSummary(data.summary);
      } else if (summaryPeriod === 'week') {
        setWeekSummary(data.summary);
      } else {
        setMonthSummary(data.summary);
      }
    } catch (error: any) {
      console.error('生成总结失败：', error);
      alert(error.message || '生成总结失败，请稍后再试');
    } finally {
      setSummaryLoading(false);
    }
  };

  // 引导步骤内容
  const guideSteps = [
    {
      title: '欢迎来到统计页面！',
      description: '这里可以查看和分析你的心情记录，了解情绪变化趋势',
      icon: '👋',
    },
    {
      title: '📅 日历视图',
      description: '直观查看每天的心情状态，点击有记录的日期可以查看详情',
      highlight: 'calendar',
    },
    {
      title: '📊 线性统计',
      description: '查看情绪强度的变化趋势，支持按天、周、月切换',
      highlight: 'line',
    },
    {
      title: '🥧 扇形统计',
      description: '查看不同情绪的分布占比，了解情绪构成',
      highlight: 'pie',
    },
    {
      title: '🔍 AI 分析',
      description: 'AI 会根据你的数据生成智能文案和深度分析报告',
      highlight: 'ai',
    },
  ];

  // 处理引导完成
  const handleGuideComplete = () => {
    localStorage.setItem('has_visited_summary', 'true');
    setShowGuide(false);
    setGuideStep(0);
  };

  // 处理跳过引导
  const handleSkipGuide = () => {
    localStorage.setItem('has_visited_summary', 'true');
    setShowGuide(false);
    setGuideStep(0);
  };

  // 下一步
  const handleNextStep = () => {
    if (guideStep < guideSteps.length - 1) {
      setGuideStep(guideStep + 1);
    } else {
      handleGuideComplete();
    }
  };

  // 上一步
  const handlePrevStep = () => {
    if (guideStep > 0) {
      setGuideStep(guideStep - 1);
    }
  };

  return (
    <MainLayout>
      {/* 引导页面遮罩 */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-indigo-200 dark:border-indigo-800 p-8 max-w-lg w-full shadow-2xl animate-scaleIn">
            {/* 进度指示器 */}
            <div className="flex gap-2 mb-6 justify-center">
              {guideSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === guideStep
                      ? 'w-8 bg-indigo-600 dark:bg-indigo-400'
                      : index < guideStep
                      ? 'w-2 bg-indigo-300 dark:bg-indigo-600'
                      : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* 内容区域 */}
            <div className="text-center mb-8 min-h-[200px] flex flex-col items-center justify-center">
              {guideSteps[guideStep].icon && (
                <div className="text-6xl mb-4 animate-bounce">
                  {guideSteps[guideStep].icon}
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {guideSteps[guideStep].title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {guideSteps[guideStep].description}
              </p>
            </div>

            {/* 按钮区域 */}
            <div className="flex gap-3">
              {guideStep > 0 && (
                <button
                  onClick={handlePrevStep}
                  className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  上一步
                </button>
              )}
              <button
                onClick={handleSkipGuide}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                跳过
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all"
              >
                {guideStep === guideSteps.length - 1 ? '开始使用' : '下一步'}
              </button>
            </div>

            {/* 步骤指示 */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              {guideStep + 1} / {guideSteps.length}
            </p>
          </div>
        </div>
      )}

      <div className="py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-8">
          统计
        </h1>

        {/* 视图选择器和日期选择器 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                视图模式
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    viewMode === 'calendar'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  📅 日历视图
                </button>
                <button
                  onClick={() => setViewMode('line')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    viewMode === 'line'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  📊 线性统计
                </button>
                <button
                  onClick={() => setViewMode('pie')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    viewMode === 'pie'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  🥧 扇形统计
                </button>
                <button
                  onClick={() => setViewMode('trend')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    viewMode === 'trend'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  📈 周/月趋势
                </button>
              </div>
            </div>

            {viewMode === 'line' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  时间范围
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLinePeriod('day')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      linePeriod === 'day'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    天
                  </button>
                  <button
                    onClick={() => setLinePeriod('week')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      linePeriod === 'week'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    周
                  </button>
                  <button
                    onClick={() => setLinePeriod('month')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      linePeriod === 'month'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    月
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'pie' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  时间范围
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPiePeriod('day')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      piePeriod === 'day'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    天
                  </button>
                  <button
                    onClick={() => setPiePeriod('week')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      piePeriod === 'week'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    周
                  </button>
                  <button
                    onClick={() => setPiePeriod('month')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      piePeriod === 'month'
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    月
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 📅 日历视图 */}
        {viewMode === 'calendar' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 mb-6 border border-gray-200 dark:border-gray-700">
            {/* 日历容器 - 限制最大宽度，在大屏幕上居中显示 */}
            <div className="max-w-4xl mx-auto">
              {/* 左右布局：小屏幕上下排列，大屏幕左右排列 */}
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-16">
                {/* 左侧：日历主体 */}
                <div className="flex-1">
                  {/* 月份选择器 */}
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <button
                      onClick={() => {
                        const newMonth = new Date(calendarMonth);
                        newMonth.setMonth(newMonth.getMonth() - 1);
                        setCalendarMonth(newMonth);
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm"
                    >
                      ← 上月
                    </button>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {calendarMonth.getFullYear()}年 {calendarMonth.getMonth() + 1}月
                    </h2>
                    <button
                      onClick={() => {
                        const newMonth = new Date(calendarMonth);
                        newMonth.setMonth(newMonth.getMonth() + 1);
                        setCalendarMonth(newMonth);
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm"
                    >
                      下月 →
                    </button>
                  </div>

                  {/* 星期标题 */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
                    {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                      <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 py-1 sm:py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 日历网格 */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {calculateCalendarData.map((day, index) => {
                      const moodColors = {
                        none: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                        positive: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
                        negative: 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500',
                        neutral: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
                      };

                      return (
                        <div
                          key={index}
                          className={`aspect-square border-2 rounded-lg p-1 sm:p-2 flex flex-col items-center justify-center transition-all ${
                            moodColors[day.moodStatus]
                          } ${
                            !day.isCurrentMonth ? 'opacity-30' : ''
                          } ${
                            day.recordCount > 0 ? 'cursor-pointer hover:scale-105' : ''
                          }`}
                          onClick={() => {
                            if (day.recordCount > 0) {
                              setSelectedDate(day.dateStr);
                              setViewMode('line');
                              setLinePeriod('day');
                            }
                          }}
                        >
                          <span className={`text-xs sm:text-sm font-medium ${
                            day.isCurrentMonth 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-400 dark:text-gray-600'
                          }`}>
                            {day.date.getDate()}
                          </span>
                          {day.recordCount > 0 && (
                            <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                              {day.recordCount}条
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 右侧：颜色图例（大屏幕竖排，小屏幕横排） */}
                <div className="lg:w-48 flex lg:flex-col justify-center lg:justify-start items-start lg:pt-16">
                  <div className="lg:sticky lg:top-24">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 hidden lg:block">
                      颜色说明
                    </h3>
                    <div className="flex lg:flex-col gap-3 lg:gap-4 flex-wrap lg:flex-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded border-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">未记录</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded border-2 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">好情绪占比大</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded border-2 bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500 flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">坏情绪占比大</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded border-2 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 flex-shrink-0"></div>
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">不好不坏</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📊 线性统计 */}
        {viewMode === 'line' && (
          <>
            {/* 智能文案 */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 mb-4 border border-indigo-100 dark:border-indigo-900/30">
              <p className="text-gray-700 dark:text-gray-300 text-center">
                💡 {lineInsightText}
              </p>
            </div>

            {lineChartData.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  线性统计 - {linePeriod === 'day' ? '今天' : linePeriod === 'week' ? '本周' : '本月'}
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      label={{ value: linePeriod === 'day' ? '时间' : '日期', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      label={{ value: '情绪强度', angle: -90, position: 'insideLeft' }}
                      domain={[0, 'dataMax + 0.5']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => {
                        if (value == null) return ['强度: -', '']
                        return [`强度: ${value}`, '']
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return `${label} | 主导情绪: ${payload[0].payload.dominant_emotion} | 记录数: ${payload[0].payload.count}`;
                        }
                        return label;
                      }}
                    />
                    <Legend verticalAlign="bottom" align="right" />
                    <Line 
                      type="monotone" 
                      dataKey="intensity" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 5 }}
                      activeDot={{ r: 7 }}
                      name="情绪强度"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  {linePeriod === 'day' ? '今天' : linePeriod === 'week' ? '本周' : '本月'}暂无记录
                </p>
              </div>
            )}
          </>
        )}

        {/* 🥧 扇形统计 */}
        {viewMode === 'pie' && (
          <>
            {/* 智能文案 */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 mb-4 border border-indigo-100 dark:border-indigo-900/30">
              <p className="text-gray-700 dark:text-gray-300 text-center">
                💡 {pieInsightText}
              </p>
            </div>

            {pieChartData.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  扇形统计 - {piePeriod === 'day' ? '今天' : piePeriod === 'week' ? '本周' : '本月'}
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getEmotionColor(entry.emotionTag)} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`${value ?? 0} 次`, '出现次数']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700 mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  {piePeriod === 'day' ? '今天' : piePeriod === 'week' ? '本周' : '本月'}暂无记录
                </p>
              </div>
            )}
          </>
        )}

        {/* 3️⃣ 周/月趋势 */}
        {viewMode === 'trend' && trendData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              情绪趋势分析（周/月）
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: '日期', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: '平均强度', angle: -90, position: 'insideLeft' }}
                  domain={[0, 'dataMax + 0.5']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`平均强度: ${value ?? 0}`, '']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `日期: ${data.fullDate} | 主导情绪: ${data.dominant_emotion}`;
                    }
                    return `日期: ${label}`;
                  }}
                />
                <Legend verticalAlign="bottom" align="right" />
                <Line 
                  type="monotone" 
                  dataKey="avg_intensity" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={(props: any) => {
                    const data = trendData[props.payload.index];
                    const color = getEmotionColor(data?.dominant_emotion_tag || 'neutral');
                    return <circle cx={props.cx} cy={props.cy} r={5} fill={color} stroke="#fff" strokeWidth={1} />;
                  }}
                  activeDot={(props: any) => {
                    const data = trendData[props.payload.index];
                    const color = getEmotionColor(data?.dominant_emotion_tag || 'neutral');
                    return <circle cx={props.cx} cy={props.cy} r={7} fill={color} stroke="#fff" strokeWidth={2} />;
                  }}
                  name="平均强度"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI 总结卡片 */}
        {((summaryPeriod === 'recent' && recentSummaryData && recentSummaryData.total_records > 0) ||
          (summaryPeriod === 'week' && weekSummaryData && weekSummaryData.total_records > 0) ||
          (summaryPeriod === 'month' && monthSummaryData && monthSummaryData.total_records > 0)) && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 mb-6 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-700 dark:text-gray-300"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  分析
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSummaryPeriod('recent')}
                    disabled={summaryLoading}
                    className={`px-3 py-1 rounded-xl text-sm font-medium transition-all ${
                      summaryPeriod === 'recent'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                    }`}
                  >
                    近3天
                  </button>
                  <button
                    onClick={() => setSummaryPeriod('week')}
                    disabled={summaryLoading}
                    className={`px-3 py-1 rounded-xl text-sm font-medium transition-all ${
                      summaryPeriod === 'week'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                    }`}
                  >
                    本周
                  </button>
                  <button
                    onClick={() => setSummaryPeriod('month')}
                    disabled={summaryLoading}
                    className={`px-3 py-1 rounded-xl text-sm font-medium transition-all ${
                      summaryPeriod === 'month'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                    }`}
                  >
                    本月
                  </button>
                </div>
              </div>
              {summaryLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  AI 正在分析...
                </div>
              )}
            </div>
            
            {((summaryPeriod === 'recent' && recentSummary) || (summaryPeriod === 'week' && weekSummary) || (summaryPeriod === 'month' && monthSummary)) ? (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 dark:border-gray-700/50">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-base whitespace-pre-line">
                  {summaryPeriod === 'recent' ? recentSummary : summaryPeriod === 'week' ? weekSummary : monthSummary}
                </p>
              </div>
            ) : (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 dark:border-gray-700/50 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {summaryPeriod === 'recent' 
                    ? `近3天共有 ${recentSummaryData?.total_records || 0} 条记录`
                    : summaryPeriod === 'week' 
                    ? `本周共有 ${weekSummaryData?.total_records || 0} 条记录`
                    : `本月共有 ${monthSummaryData?.total_records || 0} 条记录`}
                </p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="px-6 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50"
                >
                  {summaryLoading ? '分析中...' : `生成${summaryPeriod === 'recent' ? '近期' : summaryPeriod === 'week' ? '本周' : '本月'}统计`}
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                基于 {summaryPeriod === 'recent' 
                  ? (recentSummaryData?.total_records || 0)
                  : summaryPeriod === 'week' 
                  ? (weekSummaryData?.total_records || 0)
                  : (monthSummaryData?.total_records || 0)} 条记录分析
              </span>
              {((summaryPeriod === 'recent' && recentSummary) || (summaryPeriod === 'week' && weekSummary) || (summaryPeriod === 'month' && monthSummary)) && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
                >
                  重新生成
                </button>
              )}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {viewMode === 'trend' && trendData.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">暂无趋势数据</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

