'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EMOTION_TAGS, type Role } from '@/lib/analyzeMood';
import MainLayout from '@/components/MainLayout';

// 和 analyzeMood.ts 中的类型对齐
type MoodAnalysisResult = {
  keyWords: string[];
  emotionTag: string;
  feedback: string;
  slogan: string;
};

type MoodRecord = {
  id: number;
  content: string;
  role: Role;
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
  const { feedback, role } = record;

  const roleNames = {
    mother: '慈母',
    teacher: '严师',
    friend: '老友',
  };

  const roleBgColors = {
    mother: 'bg-pink-50 dark:bg-pink-900/20',
    teacher: 'bg-blue-50 dark:bg-blue-900/20',
    friend: 'bg-green-50 dark:bg-green-900/20',
  };

  const roleBorderColors = {
    mother: 'border-pink-200 dark:border-pink-700',
    teacher: 'border-blue-200 dark:border-blue-700',
    friend: 'border-green-200 dark:border-green-700',
  };

  const roleTextColors = {
    mother: 'text-pink-600 dark:text-pink-400',
    teacher: 'text-blue-600 dark:text-blue-400',
    friend: 'text-green-600 dark:text-green-400',
  };

  const roleEmojis = {
    mother: '🤱',
    teacher: '👨‍🏫',
    friend: '👫',
  };

  // 获取情绪标签的中文显示
  const emotionTagInfo = Object.values(EMOTION_TAGS).find(tag => tag.en === feedback.emotionTag);
  const emotionTagZh = emotionTagInfo ? emotionTagInfo.zh : feedback.emotionTag;

  return (
    <MainLayout>
      <div className="py-8 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          你的情绪镜像
        </h1>

        {/* 情绪关键词 */}
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

        {/* AI 分析的情绪标签 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-gray-200/50 dark:border-gray-700/50 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">AI 分析的情绪</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{emotionTagZh}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">({feedback.emotionTag})</p>
        </div>

        {/* 角色反馈 */}
        <div className={`${roleBgColors[role]} rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border-2 ${roleBorderColors[role]}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{roleEmojis[role]}</span>
            <div>
              <p className={`font-semibold text-lg ${roleTextColors[role]}`}>
                {roleNames[role]}的回应
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {role === 'mother' && '温柔包容，给予情感支持'}
                {role === 'teacher' && '理性客观，提供成长建议'}
                {role === 'friend' && '真诚共情，分享相似经历'}
              </p>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
            {feedback.feedback}
          </p>
        </div>

        {/* 治愈系金句 */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-purple-200 dark:border-purple-700 text-center">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-3">✨ 治愈系金句</p>
          <p className="text-xl font-bold text-purple-700 dark:text-purple-300 leading-relaxed">
            {feedback.slogan}
          </p>
        </div>

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