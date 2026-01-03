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
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
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

  // 加载所有可用角色
  useEffect(() => {
    const { FIXED_ROLES } = require('@/lib/analyzeMood');
    const { getCustomRoles } = require('@/lib/customRoles');
    
    const fixedRolesArray = Object.entries(FIXED_ROLES).map(([id, role]: [string, any]) => ({
      id,
      name: role.name,
      emoji: role.emoji,
      avatar: role.avatar,
      description: role.description,
      isFixed: true,
    }));
    
    const customRoles = getCustomRoles().map((role: any) => ({
      ...role,
      isFixed: false,
    }));
    
    setAvailableRoles([...fixedRolesArray, ...customRoles]);
  }, []);

  // 处理角色切换并重新分析
  const handleRoleChange = async (newRoleId: string) => {
    if (!record) return;
    
    setIsReanalyzing(true);
    setShowRoleSelector(false);
    
    try {
      // 判断是否是图标记录
      const isIconRecord = record.content.length === 1 && /[\u{1F300}-\u{1F9FF}]/u.test(record.content);
      
      // 获取客户端 AI 配置
      const { getClientAIConfig } = await import('@/lib/clientConfig');
      const aiConfig = getClientAIConfig();
      
      // 调用相应的API进行重新分析
      const response = await fetch(isIconRecord ? '/api/quote' : '/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: record.content,
          role: newRoleId,
          aiConfig,
          moodIcon: isIconRecord ? record.content : undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error('重新分析失败');
      }
      
      const result = await response.json();
      
      // 更新记录
      const history = JSON.parse(localStorage.getItem('mood_history') || '[]') as MoodRecord[];
      const targetIndex = history.findIndex(item => item.id === record.id);
      
      if (targetIndex !== -1) {
        // 获取新角色的快照
        const newRoleInfo = getRoleInfo(newRoleId);
        
        history[targetIndex] = {
          ...history[targetIndex],
          role: newRoleId,
          roleSnapshot: {
            name: newRoleInfo.name,
            emoji: newRoleInfo.emoji,
            avatar: newRoleInfo.avatar,
            description: newRoleInfo.description,
          },
          feedback: isIconRecord ? result : result,
        };
        
        localStorage.setItem('mood_history', JSON.stringify(history));
        setRecord(history[targetIndex]);
      }
    } catch (error) {
      console.error('重新分析失败：', error);
      alert('重新分析失败，请稍后再试');
    } finally {
      setIsReanalyzing(false);
    }
  };

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

        {/* 角色切换提示 */}
        {!isReanalyzing && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              不满意？试试切换其他角色
            </p>
            {!showRoleSelector ? (
              <button
                onClick={() => setShowRoleSelector(true)}
                className="px-6 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-all"
              >
                切换角色
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {availableRoles.map((availableRole) => (
                    <button
                      key={availableRole.id}
                      onClick={() => handleRoleChange(availableRole.id)}
                      disabled={availableRole.id === role}
                      className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        availableRole.id === role
                          ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-60'
                          : 'bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {availableRole.avatar ? (
                        <img
                          src={availableRole.avatar}
                          alt={availableRole.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl">
                          {availableRole.emoji}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {availableRole.name}
                        </p>
                        {availableRole.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {availableRole.description}
                          </p>
                        )}
                      </div>
                      {availableRole.id === role && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">当前</span>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowRoleSelector(false)}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        )}

        {/* 重新分析提示 */}
        {isReanalyzing && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 p-6 mb-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-indigo-700 dark:text-indigo-300 font-medium">正在重新分析...</span>
            </div>
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
