'use client';

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="py-8 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-8">
          隐私说明 & 情绪安全边界
        </h1>

        {/* 隐私说明 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span>🔒</span>
            隐私保护
          </h2>

          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                数据存储
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>本地存储</strong>：所有情绪记录、自定义角色等数据仅存储在您的浏览器本地（localStorage），不会上传到任何服务器。
                </li>
                <li>
                  <strong>无云端同步</strong>：我们不会收集、存储或传输您的任何个人数据到云端服务器。
                </li>
                <li>
                  <strong>数据所有权</strong>：您拥有所有数据的完全控制权，可以随时导出、删除或清空数据。
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                AI 分析服务
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>API 调用</strong>：情绪分析功能需要调用 OpenAI API，您的心情内容会临时发送到 OpenAI 服务器进行分析。
                </li>
                <li>
                  <strong>API 密钥</strong>：您需要自行配置 OpenAI API 密钥，密钥仅存储在您的本地环境变量中，我们无法访问。
                </li>
                <li>
                  <strong>数据使用</strong>：根据 OpenAI 的使用政策，您的数据可能被用于模型训练，但不会用于识别个人身份。
                </li>
                <li>
                  <strong>建议</strong>：如果您对隐私有极高要求，建议在输入时避免包含真实姓名、地址、电话号码等敏感信息。
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                数据安全
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>浏览器安全</strong>：数据存储在浏览器本地，受浏览器安全机制保护。
                </li>
                <li>
                  <strong>备份建议</strong>：建议定期使用导出功能备份数据，以防浏览器数据被清除。
                </li>
                <li>
                  <strong>多设备使用</strong>：不同设备之间的数据不会自动同步，如需迁移数据，请使用导出/导入功能。
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 情绪安全边界 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span>🛡️</span>
            情绪安全边界
          </h2>

          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                ⚠️ 重要提示
              </h3>
              <p>
                Mood Mirror 是一个情绪记录和 AI 反馈工具，<strong>不能替代专业的心理健康服务</strong>。
                如果您正在经历严重的情绪困扰、抑郁、焦虑或其他心理健康问题，请寻求专业帮助。
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                适用场景
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>日常情绪记录和反思</li>
                <li>获得不同视角的情绪反馈</li>
                <li>情绪趋势的自我观察</li>
                <li>情绪表达的练习和探索</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                不适用场景
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>紧急情况</strong>：如果您有自伤、自杀念头或紧急心理危机，请立即联系：
                  <ul className="list-circle list-inside ml-6 mt-2 space-y-1">
                    <li>全国心理危机干预热线：400-161-9995</li>
                    <li>北京危机干预热线：010-82951332</li>
                    <li>上海心理援助热线：021-6428-8888</li>
                    <li>或拨打 110、120 寻求紧急帮助</li>
                  </ul>
                </li>
                <li>
                  <strong>严重心理问题</strong>：如抑郁症、焦虑症、创伤后应激障碍等，需要专业心理治疗师或精神科医生的帮助。
                </li>
                <li>
                  <strong>医疗诊断</strong>：本工具不提供任何医疗诊断或治疗建议。
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                使用建议
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>保持理性</strong>：AI 反馈仅供参考，不应作为决策的唯一依据。
                </li>
                <li>
                  <strong>自我觉察</strong>：关注自己的情绪变化，如果发现情绪持续恶化，请及时寻求专业帮助。
                </li>
                <li>
                  <strong>隐私保护</strong>：虽然数据存储在本地，但建议不要在记录中包含过于敏感的个人信息。
                </li>
                <li>
                  <strong>定期备份</strong>：使用导出功能定期备份数据，以防数据丢失。
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 免责声明 */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 sm:p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span>📋</span>
            免责声明
          </h2>
          <div className="text-gray-700 dark:text-gray-300 space-y-2">
            <p>
              1. Mood Mirror 是一个开源的情绪记录工具，不对用户使用本工具产生的任何后果承担责任。
            </p>
            <p>
              2. AI 生成的内容仅供参考，不应作为医疗、法律或专业建议的依据。
            </p>
            <p>
              3. 用户应自行承担使用本工具的风险，包括但不限于数据丢失、隐私泄露等。
            </p>
            <p>
              4. 开发者不对 OpenAI API 的服务质量、可用性或数据使用政策承担责任。
            </p>
            <p>
              5. 如因使用本工具导致任何损失，开发者不承担任何责任。
            </p>
          </div>
        </div>

        {/* 联系方式 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span>📧</span>
            反馈与支持
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            如果您对本工具的隐私政策或使用有任何疑问，欢迎通过项目仓库提交 Issue 或 Pull Request。
          </p>
        </div>

        {/* 返回按钮 */}
        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

