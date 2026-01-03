'use client';

import { useState, useEffect } from 'react';

interface PrivacyAgreementProps {
  onAccept?: () => void;
}

export default function PrivacyAgreement({ onAccept }: PrivacyAgreementProps) {
  const [showModal, setShowModal] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  useEffect(() => {
    // 检查用户是否已同意隐私协议
    const hasAgreed = localStorage.getItem('privacy_agreement_accepted');
    if (!hasAgreed) {
      setShowModal(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('privacy_agreement_accepted', 'true');
    setShowModal(false);
    // 触发回调，让 AppProviders 知道用户已同意
    if (onAccept) {
      onAccept();
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-lg w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            欢迎使用 Mood Mirror
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            在开始之前，请阅读并同意我们的隐私政策
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 max-h-96 overflow-y-auto">
          {!showFullText ? (
            <>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">隐私保护承诺</h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span><strong>零服务器存储</strong>：所有数据仅存储在您的浏览器本地，不上传到任何服务器</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span><strong>完全可控</strong>：您可以随时导出、删除或清除所有数据</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span><strong>AI 调用</strong>：仅在您主动记录心情时调用 AI 服务进行分析</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span><strong>本地优先</strong>：推荐使用 Ollama 本地模型，数据完全不离开设备</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span><strong>匿名使用</strong>：无需注册账号，无需提供个人信息</span>
                </li>
              </ul>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">完整隐私政策</h3>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">1. 数据存储</h4>
                  <p>Mood Mirror 采用完全本地化的数据存储方案。所有心情记录、自定义角色、设置选项等数据均存储在您的浏览器 localStorage 中，不会上传到任何远程服务器。这意味着：</p>
                  <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                    <li>数据仅存在于您当前使用的设备和浏览器中</li>
                    <li>我们无法访问、查看或收集您的任何数据</li>
                    <li>切换设备或浏览器时数据不会自动同步</li>
                    <li>清除浏览器数据会同时清除应用数据</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">2. AI 服务调用</h4>
                  <p>当您使用 AI 功能时（如情绪分析、生成统计），应用会将您输入的文字内容发送到您配置的 AI 服务提供商（OpenAI API 或 Ollama 本地模型）。我们建议：</p>
                  <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                    <li>优先使用 Ollama 本地模型，数据完全不离开设备</li>
                    <li>使用 OpenAI API 时，请参阅 OpenAI 的隐私政策</li>
                    <li>您可以在调试页面随时切换 AI 模式</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">3. 数据安全</h4>
                  <p>我们采取以下措施保护您的隐私：</p>
                  <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                    <li>不收集任何个人身份信息</li>
                    <li>不使用第三方分析工具</li>
                    <li>不设置追踪 Cookie</li>
                    <li>开源透明，代码可审查</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">4. 数据导出与删除</h4>
                  <p>您拥有数据的完全控制权：</p>
                  <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                    <li>可随时导出所有数据（JSON/Markdown 格式）</li>
                    <li>可随时删除单条或所有记录</li>
                    <li>可随时清除所有应用数据</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">5. 政策更新</h4>
                  <p>我们可能会不定期更新隐私政策。重大变更时，我们会在应用内通知您。继续使用应用即表示您接受更新后的政策。</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleAccept}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
          >
            我已阅读并同意
          </button>
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
          >
            {showFullText ? '收起隐私政策' : '查看完整隐私政策'}
          </button>
        </div>

        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
          继续使用即表示您同意我们的隐私政策和服务条款
        </p>
      </div>
    </div>
  );
}

