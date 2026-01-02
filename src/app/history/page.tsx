'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EMOTION_TAGS } from '@/lib/analyzeMood';
import { getRoleInfo, getRoleColor } from '@/lib/roleUtils';
import { getEmotionColor } from '@/lib/emotionColors';
import MainLayout from '@/components/MainLayout';

// 类型定义
type RoleSnapshot = {
  name: string;
  emoji: string;
  avatar?: string;
  description?: string;
};

type MoodAnalysisResult = {
  emotionLabels?: string[]; // AI 判断的情绪标签（2-3个）
  keyWords?: string[]; // 兼容旧数据
  emotionTag: string;
  feedback: string;
  slogan: string;
};

type MoodRecord = {
  id: number;
  content: string;
  role: string; // 角色ID（固定角色或自定义角色）
  roleSnapshot?: RoleSnapshot; // 角色快照，用于角色被删除后仍能正确显示
  feedback: MoodAnalysisResult;
  createTime: string;
  originalEmotionTag?: string; // 原始情绪标签（用户修正前，用于闭环洞察）
};

type TimeFilter = 'today' | '3days' | 'week' | 'month';

export default function HistoryPage() {
  const [history, setHistory] = useState<MoodRecord[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editEmotionLabels, setEditEmotionLabels] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('mood_history') || '[]') as MoodRecord[];
    setHistory(savedHistory);
  }, []);

  // 按时间筛选记录
  const timeFilteredHistory = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (timeFilter === 'today') {
      // 今日：从今天的0点开始
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    } else if (timeFilter === '3days') {
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

  // 过滤记录（角色）
  const filteredHistory = useMemo(() => {
    if (!timeFilteredHistory) return [];
    return timeFilteredHistory.filter((record) => {
      if (filterRole !== 'all' && record.role !== filterRole) return false;
      return true;
    });
  }, [timeFilteredHistory, filterRole]);

  // 开始编辑记录
  const handleStartEdit = (record: MoodRecord) => {
    setEditingId(record.id);
    setEditContent(record.content);
    // 编辑AI返回的情绪标签（emotionLabels），如果没有则使用keyWords，再没有则使用emotionTag的中文
    const labelsToEdit = record.feedback.emotionLabels || record.feedback.keyWords;
    if (labelsToEdit && labelsToEdit.length > 0) {
      setEditEmotionLabels(labelsToEdit.join('、'));
    } else {
      const emotionTagInfo = Object.values(EMOTION_TAGS).find(
        (tag) => tag.en === record.feedback.emotionTag
      );
      setEditEmotionLabels(emotionTagInfo ? emotionTagInfo.zh : record.feedback.emotionTag);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditEmotionLabels('');
  };

  // 保存编辑
  const handleSaveEdit = (id: number) => {
    // 解析用户输入的情绪标签（支持中文顿号、逗号、空格分隔）
    const labelsArray = editEmotionLabels
      .split(/[、，, ]+/)
      .map(label => label.trim())
      .filter(label => label.length > 0);
    
    // 验证标签数量和字数
    if (labelsArray.length === 0) {
      alert('请输入至少1个情绪标签');
      return;
    }
    
    if (labelsArray.length > 5) {
      alert('最多只能输入5个情绪标签');
      return;
    }
    
    // 检查每个标签的字数
    const invalidLabels = labelsArray.filter(label => label.length > 10);
    if (invalidLabels.length > 0) {
      alert(`以下标签超过10字限制：${invalidLabels.join('、')}`);
      return;
    }
    
    const newHistory = history.map((record) => {
      if (record.id === id) {
        // 如果情绪标签被修改，且没有记录过原始标签，则记录原始标签
        const originalLabels = record.feedback.emotionLabels || record.feedback.keyWords || [];
        const isEmotionChanged = JSON.stringify(labelsArray) !== JSON.stringify(originalLabels);
        const originalEmotionTag = isEmotionChanged && !record.originalEmotionTag 
          ? record.feedback.emotionTag 
          : record.originalEmotionTag;
        
        return {
          ...record,
          content: editContent,
          feedback: {
            ...record.feedback,
            emotionLabels: labelsArray,
            // 保留原有的emotionTag，不修改
          },
          originalEmotionTag,
        };
      }
      return record;
    });
    setHistory(newHistory);
    localStorage.setItem('mood_history', JSON.stringify(newHistory));
    handleCancelEdit();
  };

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
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-8">
          历史记录
        </h1>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">总记录数</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{history.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">本月记录</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {history.filter((record) => {
                const recordDate = new Date(record.createTime);
                const now = new Date();
                return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">当前筛选</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{filteredHistory.length}</p>
          </div>
        </div>

        {/* 时间筛选和角色筛选 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 时间筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                时间范围
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setTimeFilter('today')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    timeFilter === 'today'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  今日
                </button>
                <button
                  onClick={() => setTimeFilter('3days')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    timeFilter === '3days'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  近3天
                </button>
                <button
                  onClick={() => setTimeFilter('week')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    timeFilter === 'week'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  近一周
                </button>
                <button
                  onClick={() => setTimeFilter('month')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    timeFilter === 'month'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
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
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300/20"
              >
                <option value="all">全部角色</option>
                {(() => {
                  // 收集唯一的角色，优先使用记录中的 roleSnapshot
                  const roleMap = new Map<string, { emoji: string; name: string }>();
                  history.forEach((record) => {
                    if (!roleMap.has(record.role)) {
                      // 优先使用 roleSnapshot，如果没有则回退到 getRoleInfo
                      const info = record.roleSnapshot || getRoleInfo(record.role);
                      roleMap.set(record.role, { emoji: info.emoji, name: info.name });
                    }
                  });
                  return Array.from(roleMap.entries()).map(([roleId, info]) => (
                    <option key={roleId} value={roleId}>
                      {info.emoji} {info.name}
                    </option>
                  ));
                })()}
              </select>
            </div>

          </div>

          {/* 清空按钮 */}
          {(filterRole !== 'all' || timeFilter !== 'today') && (
            <button
              onClick={() => {
                setFilterRole('all');
                setTimeFilter('today');
              }}
              className="mt-4 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* 记录列表 */}
        <div className="space-y-4">
          {!filteredHistory || filteredHistory.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400">没有找到匹配的记录</p>
            </div>
          ) : (
            filteredHistory?.map((record) => {
              const emotionTagInfo = Object.values(EMOTION_TAGS).find(
                (tag) => tag.en === record.feedback.emotionTag
              );
              const emotionTagZh = emotionTagInfo ? emotionTagInfo.zh : record.feedback.emotionTag;
              const emotionColors = getEmotionColor(record.feedback.emotionTag as any);
              // 优先使用 roleSnapshot，如果没有则回退到 getRoleInfo
              const roleInfo = record.roleSnapshot || getRoleInfo(record.role);
              const roleColors = getRoleColor(record.role);
              
              // 判断是否是心情图标记录（单个emoji字符）
              const isIconRecord = record.content.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(record.content);

              return (
                <div
                  key={record.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {roleInfo.avatar ? (
                        <img 
                          src={roleInfo.avatar} 
                          alt={roleInfo.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{roleInfo.emoji}</span>
                      )}
                      <div>
                        <p className={`font-semibold ${roleColors.text}`}>
                          {roleInfo.name}
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
                    <div className="flex items-center gap-2">
                      {editingId !== record.id && (
                        <>
                          <button
                            onClick={() => router.push(`/feedback?id=${record.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                          >
                            <span>📄</span>
                            <span>查看</span>
                          </button>
                          <button
                            onClick={() => handleStartEdit(record)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                          >
                            <span>✏️</span>
                            <span>编辑</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <span>🗑️</span>
                        <span>删除</span>
                      </button>
                    </div>
                  </div>

                  {/* 原始日记内容 - 编辑模式 */}
                  {editingId === record.id ? (
                    <div className="mb-4">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 leading-relaxed text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300/20"
                        rows={4}
                      />
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          情绪标签（用顿号、逗号或空格分隔，1-5个，每个最多10字）
                        </label>
                        <input
                          type="text"
                          value={editEmotionLabels}
                          onChange={(e) => setEditEmotionLabels(e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300/20"
                          placeholder="例如：开心、满足、平静"
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleSaveEdit(record.id)}
                          className="flex-1 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      {isIconRecord ? (
                        <div className="text-center">
                          <span className="text-6xl">{record.content}</span>
                        </div>
                      ) : (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
                          {record.content}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 角色回应 */}
                  <div className={`mb-4 p-4 ${emotionColors.bg} ${emotionColors.bgDark} rounded-xl border-2 ${emotionColors.border} ${emotionColors.borderDark}`}>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      {record.feedback.feedback}
                    </p>
                    
                    {/* 情绪标签和一记一句 */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">情绪标签：</p>
                        <div className="flex flex-wrap gap-2">
                          {(record.feedback.emotionLabels || record.feedback.keyWords || [emotionTagZh]).map((label, index) => (
                            <span
                              key={index}
                              className={`px-3 py-1 ${emotionColors.bg} ${emotionColors.bgDark} ${emotionColors.text} ${emotionColors.textDark} rounded-full text-xs font-medium border-2 ${emotionColors.border} ${emotionColors.borderDark}`}
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="sm:max-w-xs">
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          ✨ {record.feedback.slogan}
                        </p>
                      </div>
                    </div>
                  </div>
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
