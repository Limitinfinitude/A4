'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EMOTION_TAGS } from '@/lib/analyzeMood';
import { getRoleInfo, getRoleColor } from '@/lib/roleUtils';
import { getEmotionColor } from '@/lib/emotionColors';
import MainLayout from '@/components/MainLayout';

// 和 analyzeMood.ts 中的类型对齐
type MoodAnalysisResult = {
  emotionLabels?: string[]; // AI 判断的情绪标签（2-3个）
  keyWords?: string[]; // 兼容旧数据
  emotionTag: string;
  feedback: string;
  slogan: string;
};

type RoleSnapshot = {
  name: string;
  emoji: string;
  avatar?: string;
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

// 内部组件，使用 useSearchParams
function FeedbackContent() {
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

  // 获取角色信息，优先使用 roleSnapshot
  const roleInfo = record.roleSnapshot || getRoleInfo(role);
  const roleColors = getRoleColor(role);

  // 获取情绪标签的中文显示
  const emotionTagInfo = Object.values(EMOTION_TAGS).find(tag => tag.en === feedback.emotionTag);
  const emotionTagZh = emotionTagInfo ? emotionTagInfo.zh : feedback.emotionTag;
  const emotionColors = feedback.emotionTag 
    ? getEmotionColor(feedback.emotionTag as any)
    : null;

  return (
      <div className="py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
        你的情绪分析
        </h1>

      {/* 心情图标显示 */}
      {content.length === 1 && /[\u{1F300}-\u{1F9FF}]/u.test(content) && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-6 text-center">
          <div className="text-6xl mb-4">{content}</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">心情</p>
            </div>
      )}

      {/* AI 分析结果 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">情绪标签</p>
        <div className="flex flex-wrap gap-2">
          {(feedback.emotionLabels || feedback.keyWords || [emotionTagZh]).map((label, index) => (
                    <span
                      key={index}
              className={`px-4 py-2 ${emotionColors?.bg} ${emotionColors?.bgDark} ${emotionColors?.text} ${emotionColors?.textDark} rounded-xl text-sm font-medium border ${emotionColors?.border} ${emotionColors?.borderDark}`}
                    >
              {label}
                    </span>
                  ))}
                </div>
            </div>

            {/* 角色反馈 */}
            {feedback.feedback && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
              {roleInfo?.avatar ? (
                <img 
                  src={roleInfo.avatar} 
                  alt={roleInfo.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                />
              ) : null}
                  <div>
                <p className="font-semibold text-base text-gray-900 dark:text-white">
                  {roleInfo?.name}
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

      {/* 一记一句 */}
            {feedback.slogan && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 p-8 mb-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">✨ 一记一句</p>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  {feedback.slogan}
                </p>
              </div>
        )}

        {/* 操作按钮 */}
      <div className="flex justify-center">
          <button
          className="px-8 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-all"
            onClick={() => router.push('/history')}
          >
          返回
          </button>
        </div>
      </div>
  );
}

// 主页面组件，用 Suspense 包裹
export default function FeedbackPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="p-8 text-center">加载中...</div>}>
        <FeedbackContent />
      </Suspense>
    </MainLayout>
  );
}
