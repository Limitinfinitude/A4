'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EMOTION_TAGS } from '@/lib/analyzeMood';
import { getRoleInfo, getRoleColor } from '@/lib/roleUtils';
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
  role: string; // 角色ID（固定角色或自定义角色）
  feedback: MoodAnalysisResult;
  createTime: string;
};

type TimeFilter = '3days' | 'week' | 'month';

export default function HistoryPage() {
  const [history, setHistory] = useState<MoodRecord[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterEmotion, setFilterEmotion] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const router = useRouter();

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('mood_history') || '[]') as MoodRecord[];
    setHistory(savedHistory);
  }, []);

  // 按时间筛选记录
  const timeFilteredHistory = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (timeFilter === '3days') {
      startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    } else if (timeFilter === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return history.filter((record) => {
      const recordDate = new Date(record.createTime);
      return recordDate >= startDate && recordDate <= now;
    });
  }, [history, timeFilter]);

  // 过滤记录（角色和情绪）
  const filteredHistory = timeFilteredHistory.filter((record) => {
    if (filterRole !== 'all' && record.role !== filterRole) return false;
    if (filterEmotion !== 'all' && record.feedback.emotionTag !== filterEmotion) return false;
    return true;
  });

  // 删除记录
  const handleDelete = (id: number) => {
    if (confirm('确定要删除这条记录吗？')) {
      const newHistory = history.filter((record) => record.id !== id);
      setHistory(newHistory);
      localStorage.setItem('mood_history', JSON.stringify(newHistory));
    }
  };

  // 清空所有记录
  const handleClearAll = () => {
    if (confirm('确定要清空所有记录吗？此操作不可恢复！')) {
      setHistory([]);
      localStorage.setItem('mood_history', '[]');
    }
  };

  if (history.length === 0) {
    return (
      <MainLayout>
        <div className="py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">还没有情绪记录</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">去首页记录你的第一份心情吧～</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              去记录心情
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-8">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8">
          历史记录
        </h1>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">总记录数</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{history.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">本月记录</p>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {history.filter((record) => {
                const recordDate = new Date(record.createTime);
                const now = new Date();
                return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">当前筛选</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredHistory.length}</p>
          </div>
        </div>

        {/* 时间筛选和角色/情绪筛选 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 时间筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                时间范围
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setTimeFilter('3days')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeFilter === '3days'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  近3天
                </button>
                <button
                  onClick={() => setTimeFilter('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeFilter === 'week'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  近一周
                </button>
                <button
                  onClick={() => setTimeFilter('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeFilter === 'month'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  本月
                </button>
              </div>
            </div>

            {/* 角色筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                筛选角色
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">全部角色</option>
                {Array.from(new Set(history.map(r => r.role))).map((roleId) => {
                  const roleInfo = getRoleInfo(roleId);
                  return (
                    <option key={roleId} value={roleId}>
                      {roleInfo.emoji} {roleInfo.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 情绪筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                筛选情绪
              </label>
              <select
                value={filterEmotion}
                onChange={(e) => setFilterEmotion(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">全部情绪</option>
                {Object.values(EMOTION_TAGS).map((tag) => (
                  <option key={tag.en} value={tag.en}>
                    {tag.zh} ({tag.en})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 清空按钮 */}
          {(filterRole !== 'all' || filterEmotion !== 'all' || timeFilter !== 'week') && (
            <button
              onClick={() => {
                setFilterRole('all');
                setFilterEmotion('all');
                setTimeFilter('week');
              }}
              className="mt-4 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* 记录列表 */}
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-gray-600 dark:text-gray-400">没有找到匹配的记录</p>
            </div>
          ) : (
            filteredHistory.map((record) => {
              const emotionTagInfo = Object.values(EMOTION_TAGS).find(
                (tag) => tag.en === record.feedback.emotionTag
              );
              const emotionTagZh = emotionTagInfo ? emotionTagInfo.zh : record.feedback.emotionTag;
              const roleInfo = getRoleInfo(record.role);
              const roleColors = getRoleColor(record.role);

              return (
                <div
                  key={record.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{roleInfo.emoji}</span>
                      <div>
                        <p className={`font-semibold ${roleColors.text}`}>
                          {roleInfo.name}的回应
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(record.createTime).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* 原始日记内容 */}
                  <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                      {record.content}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {record.feedback.keyWords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                      {emotionTagZh}
                    </span>
                  </div>

                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {record.feedback.feedback}
                    </p>
                  </div>

                  <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-xl text-center">
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">✨ 治愈系金句</p>
                    <p className="text-base font-semibold text-purple-700 dark:text-purple-300">
                      {record.feedback.slogan}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/feedback?id=${record.id}`)}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all"
                  >
                    查看详情
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* 清空所有记录按钮 */}
        {history.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={handleClearAll}
              className="px-6 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              清空所有记录
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
