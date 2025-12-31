'use client';

import { useState, useEffect, useMemo } from 'react';
import { EMOTION_TAGS } from '@/lib/analyzeMood';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import MainLayout from '@/components/MainLayout';

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
  role: 'mother' | 'teacher' | 'friend';
  feedback: MoodAnalysisResult;
  createTime: string;
};

type ViewMode = 'daily' | 'overview' | 'trend';

export default function SummaryPage() {
  const [history, setHistory] = useState<MoodRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [summaryPeriod, setSummaryPeriod] = useState<'week' | 'month'>('week');
  const [weekSummary, setWeekSummary] = useState<string>('');
  const [monthSummary, setMonthSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('mood_history') || '[]') as MoodRecord[];
    setHistory(savedHistory);
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

  // 情绪颜色映射
  const emotionColorMap: Record<string, string> = {
    joy: '#fbbf24',
    satisfaction: '#10b981',
    calm: '#3b82f6',
    hope: '#8b5cf6',
    sadness: '#6366f1',
    anger: '#ef4444',
    anxiety: '#f59e0b',
    fear: '#dc2626',
    frustration: '#7c3aed',
    tired: '#64748b',
    surprise: '#ec4899',
    neutral: '#94a3b8',
  };

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

  // 1️⃣ 当天视图（Detail View）
  const dailyDetailData = useMemo(() => {
    if (!selectedDate) return [];
    
    const dayRecords = history
      .filter((record) => {
        const recordDate = new Date(record.createTime).toISOString().split('T')[0];
        return recordDate === selectedDate;
      })
      .sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime());

    return dayRecords.map((record) => {
      const date = new Date(record.createTime);
      const timeWindow = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      const intensity = Math.abs(emotionIntensityMap[record.feedback.emotionTag] || 0);
      const emotionTagInfo = Object.values(EMOTION_TAGS).find(
        (tag) => tag.en === record.feedback.emotionTag
      );
      
      return {
        timeWindow,
        intensity,
        dominant_emotion: emotionTagInfo?.zh || record.feedback.emotionTag,
        emotionTag: record.feedback.emotionTag,
      };
    });
  }, [history, selectedDate]);

  // 2️⃣ 单日概览
  const dailyOverviewData = useMemo(() => {
    if (!selectedDate) return [];
    
    const dayRecords = history.filter((record) => {
      const recordDate = new Date(record.createTime).toISOString().split('T')[0];
      return recordDate === selectedDate;
    });

    const emotionCount: Record<string, number> = {};
    dayRecords.forEach((record) => {
      const emotionTagInfo = Object.values(EMOTION_TAGS).find(
        (tag) => tag.en === record.feedback.emotionTag
      );
      const emotionName = emotionTagInfo?.zh || record.feedback.emotionTag;
      emotionCount[emotionName] = (emotionCount[emotionName] || 0) + 1;
    });

    return Object.entries(emotionCount).map(([name, value]) => ({
      name,
      value,
      emotionTag: Object.values(EMOTION_TAGS).find(tag => tag.zh === name)?.en || name,
    }));
  }, [history, selectedDate]);

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
        const dominantEmotionInfo = Object.values(EMOTION_TAGS).find(tag => tag.en === dominantEmotion);
        
        const date = new Date(dateStr);
        return {
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          fullDate: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          avg_intensity: Math.round(avgIntensity * 10) / 10,
          dominant_emotion: dominantEmotionInfo?.zh || dominantEmotion,
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
  const calculateSummaryData = (period: 'week' | 'month') => {
    const now = new Date();
    let startDate: Date;
    
    if (period === 'week') {
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
      const emotionTagInfo = Object.values(EMOTION_TAGS).find(
        (tag) => tag.en === record.feedback.emotionTag
      );
      const emotionName = emotionTagInfo?.zh || record.feedback.emotionTag;
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
    };
  };

  const weekSummaryData = useMemo(() => calculateSummaryData('week'), [history, emotionIntensityMap]);
  const monthSummaryData = useMemo(() => calculateSummaryData('month'), [history, emotionIntensityMap]);

  // 生成 AI 总结
  const handleGenerateSummary = async () => {
    const summaryData = summaryPeriod === 'week' ? weekSummaryData : monthSummaryData;
    if (!summaryData) return;

    setSummaryLoading(true);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryData }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '生成总结失败');
      }

      const data = await res.json();
      if (summaryPeriod === 'week') {
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

  return (
    <MainLayout>
      <div className="py-8">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">
          情绪总结
        </h1>

        {/* 视图选择器和日期选择器 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                视图模式
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'daily'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  📊 当天视图
                </button>
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'overview'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🥧 单日概览
                </button>
                <button
                  onClick={() => setViewMode('trend')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'trend'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  📈 周/月趋势
                </button>
              </div>
            </div>

            {(viewMode === 'daily' || viewMode === 'overview') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  选择日期
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {availableDates.map((date) => {
                    const d = new Date(date);
                    return (
                      <option key={date} value={date}>
                        {d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 1️⃣ 当天视图 */}
        {viewMode === 'daily' && dailyDetailData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              当天情绪变化详情
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dailyDetailData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="timeWindow" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: '时间窗口', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: '强度', angle: -90, position: 'insideLeft' }}
                  domain={[0, 'dataMax + 0.5']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`强度: ${value}`, '']}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `时间: ${label} | 主导情绪: ${payload[0].payload.dominant_emotion}`;
                    }
                    return `时间: ${label}`;
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
        )}

        {/* 2️⃣ 单日概览 */}
        {viewMode === 'overview' && dailyOverviewData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              单日情绪占比
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={dailyOverviewData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dailyOverviewData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={emotionColorMap[entry.emotionTag] || '#94a3b8'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value} 次`, '出现次数']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 3️⃣ 周/月趋势 */}
        {viewMode === 'trend' && trendData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50">
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
                  formatter={(value: number) => [`平均强度: ${value}`, '']}
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
                    const color = emotionColorMap[data?.dominant_emotion_tag] || '#8b5cf6';
                    return <circle cx={props.cx} cy={props.cy} r={5} fill={color} stroke="#fff" strokeWidth={1} />;
                  }}
                  activeDot={(props: any) => {
                    const data = trendData[props.payload.index];
                    const color = emotionColorMap[data?.dominant_emotion_tag] || '#8b5cf6';
                    return <circle cx={props.cx} cy={props.cy} r={7} fill={color} stroke="#fff" strokeWidth={2} />;
                  }}
                  name="平均强度"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI 总结卡片 */}
        {((summaryPeriod === 'week' && weekSummaryData && weekSummaryData.total_records > 0) ||
          (summaryPeriod === 'month' && monthSummaryData && monthSummaryData.total_records > 0)) && (
          <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30 rounded-2xl shadow-xl p-6 mb-6 border-2 border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  情绪总结
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSummaryPeriod('week')}
                    disabled={summaryLoading}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      summaryPeriod === 'week'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80'
                    }`}
                  >
                    本周
                  </button>
                  <button
                    onClick={() => setSummaryPeriod('month')}
                    disabled={summaryLoading}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      summaryPeriod === 'month'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80'
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
            
            {((summaryPeriod === 'week' && weekSummary) || (summaryPeriod === 'month' && monthSummary)) ? (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 dark:border-gray-700/50">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-base whitespace-pre-line">
                  {summaryPeriod === 'week' ? weekSummary : monthSummary}
                </p>
              </div>
            ) : (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/50 dark:border-gray-700/50 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {summaryPeriod === 'week' 
                    ? `本周共有 ${weekSummaryData?.total_records || 0} 条记录`
                    : `本月共有 ${monthSummaryData?.total_records || 0} 条记录`}
                </p>
                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {summaryLoading ? '生成中...' : `生成${summaryPeriod === 'week' ? '本周' : '本月'}总结`}
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                基于 {summaryPeriod === 'week' 
                  ? (weekSummaryData?.total_records || 0)
                  : (monthSummaryData?.total_records || 0)} 条记录分析
              </span>
              {((summaryPeriod === 'week' && weekSummary) || (summaryPeriod === 'month' && monthSummary)) && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors disabled:opacity-50"
                >
                  重新生成
                </button>
              )}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {((viewMode === 'daily' && dailyDetailData.length === 0) ||
          (viewMode === 'overview' && dailyOverviewData.length === 0) ||
          (viewMode === 'trend' && trendData.length === 0)) && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-gray-600 dark:text-gray-400">
              {viewMode === 'daily' || viewMode === 'overview'
                ? '所选日期暂无记录'
                : '暂无趋势数据'}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

