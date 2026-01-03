'use client';

import { useState, useEffect } from 'react';

interface GuideStep {
  title: string;
  content: string;
  icon: string;
}

const guideSteps: GuideStep[] = [
  {
    title: '欢迎使用 Mood Mirror',
    content: '这是一个基于 AI 的个性化情绪日记应用。通过多维度认知角色陪伴你记录心情，深入了解自己的情绪模式。让我们开始吧！',
    icon: '👋',
  },
  {
    title: '记录心情',
    content: '在首页可以选择文字输入或心情图标两种方式记录。选择一个陪伴角色，输入你的心情，AI 将给予温暖的反馈和情绪分析。',
    icon: '✍️',
  },
  {
    title: '查看历史',
    content: '历史记录页面展示所有心情记录。你可以筛选时间范围、搜索内容、编辑或删除记录。点击"查看"可以重温当时的心情卡片。',
    icon: '📖',
  },
  {
    title: '数据统计',
    content: '统计页面提供三种视图：日历视图查看全月情绪分布，线性统计展示情绪趋势，扇形统计分析情绪占比。还可以生成 AI 智能分析。',
    icon: '📊',
  },
  {
    title: '个性化设置',
    content: '设置页面可以管理自定义角色、导出/导入数据、清除历史记录。支持 JSON 和 Markdown 两种导出格式。',
    icon: '⚙️',
  },
  {
    title: '开始你的情绪之旅',
    content: '所有数据仅存储在你的浏览器本地，完全私密安全。现在，开始记录你的第一个心情吧！',
    icon: '🚀',
  },
];

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuide({ isOpen, onClose }: UserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // 标记用户已查看过引导
    localStorage.setItem('has_viewed_guide', 'true');
    onClose();
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const step = guideSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-md w-full shadow-2xl">
        {/* 进度指示器 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1.5">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-indigo-600 dark:bg-indigo-400'
                    : index < currentStep
                    ? 'w-1.5 bg-indigo-300 dark:bg-indigo-600'
                    : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            跳过
          </button>
        </div>

        {/* 内容 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{step.icon}</div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
            {step.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* 步骤指示 */}
        <div className="text-center mb-6">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentStep + 1} / {guideSteps.length}
          </span>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
              currentStep === 0
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            上一步
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
          >
            {currentStep === guideSteps.length - 1 ? '开始使用' : '下一步'}
          </button>
        </div>
      </div>
    </div>
  );
}

