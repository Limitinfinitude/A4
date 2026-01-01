'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EMOTION_TAGS } from '@/lib/analyzeMood';
import { getRoleInfo, getRoleColor } from '@/lib/roleUtils';
import MainLayout from '@/components/MainLayout';

// 和 analyzeMood.ts 中的类型对齐
type MoodAnalysisResult = {
  keyWords: string[];
  emotionTag: string;
  feedback: string;
  slogan: string;
};

type RoleSnapshot = {
  name: string;
  emoji: string;
  description?: string;
};

type MoodRecord = {
  id: number;
  content: string;
  role: string; // 角色ID（固定角色或自定义角色）
  roleSnapshot?: RoleSnapshot; // 角色快照，用于角色被删除后仍能正确显示
  feedback: MoodAnalysisResult;
  createTime: string;
};

export default function FeedbackPage() {
  const [record, setRecord] = useState<MoodRecord | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  useEffect(() => {
    if (!id) {
      router.push('/');
      return;
    }
    const history = JSON.parse(localStorage.getItem('mood_history') || '[]') as MoodRecord[];
    const target = history.find(item => item.id === Number(id));
    if (!target) {
      router.push('/');
      return;
    }
    setRecord(target);
  }, [id, router]);

  if (!record) return <div className="p-8 text-center">加载中...</div>;
  const { feedback, role, content } = record;

  // 判断是否是名言模式
  const isQuoteMode = role === 'quote';

  // 获取角色信息（非名言模式才需要），优先使用 roleSnapshot
  const roleInfo = !isQuoteMode ? (record.roleSnapshot || getRoleInfo(role)) : null;
  const roleColors = !isQuoteMode ? getRoleColor(role) : null;

  // 获取情绪标签的中文显示（非名言模式才需要）
  const emotionTagInfo = !isQuoteMode 
    ? Object.values(EMOTION_TAGS).find(tag => tag.en === feedback.emotionTag)
    : null;
  const emotionTagZh = emotionTagInfo ? emotionTagInfo.zh : feedback.emotionTag;

  return (
    <MainLayout>
      <div className="py-8 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          {isQuoteMode ? '为你准备的一句话' : '你的情绪镜像'}
        </h1>

        {/* 名言模式：只显示名言 */}
        {isQuoteMode ? (
          <>
            <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900 dark:via-pink-900 dark:to-blue-900 rounded-2xl shadow-xl p-8 sm:p-12 mb-6 border-2 border-purple-200 dark:border-purple-700 text-center">
              <div className="text-6xl mb-6">{content}</div>
              <p className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300 leading-relaxed">
                {feedback.slogan}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* 情绪关键词 */}
            {feedback.keyWords.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">潜意识情绪关键词</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {feedback.keyWords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI 分析的情绪标签 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50 text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">AI 分析的情绪</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{emotionTagZh}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">({feedback.emotionTag})</p>
            </div>

            {/* 角色反馈 */}
            {feedback.feedback && (
              <div className={`${roleColors?.bg} rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border-2 ${roleColors?.border}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{roleInfo?.emoji}</span>
                  <div>
                    <p className={`font-semibold text-lg ${roleColors?.text}`}>
                      {roleInfo?.name}的回应
                    </p>
                    {roleInfo?.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {roleInfo.description}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                  {feedback.feedback}
                </p>
              </div>
            )}

            {/* 治愈系金句 */}
            {feedback.slogan && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-purple-200 dark:border-purple-700 text-center">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-3">✨ 一记一句</p>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300 leading-relaxed">
                  {feedback.slogan}
                </p>
              </div>
            )}
          </>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => router.push('/')}
          >
            返回首页
          </button>
          <button
            className="flex-1 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            onClick={() => router.push('/history')}
          >
            查看情绪记录
          </button>
        </div>
      </div>
    </MainLayout>
  );
}