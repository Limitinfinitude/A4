'use client';

import { useEffect, useState } from 'react';
import PrivacyAgreement from './PrivacyAgreement';
import UserGuide from './UserGuide';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // 检查用户是否已同意隐私协议并查看过引导
    const hasAgreed = localStorage.getItem('privacy_agreement_accepted');
    const hasViewedGuide = localStorage.getItem('has_viewed_guide');
    
    // 如果已同意隐私协议但未查看过引导，自动打开引导
    if (hasAgreed && !hasViewedGuide) {
      setTimeout(() => {
        setShowGuide(true);
      }, 500);
    }
  }, []);

  // 隐私协议同意后的回调
  const handlePrivacyAccepted = () => {
    const hasViewedGuide = localStorage.getItem('has_viewed_guide');
    // 如果未查看过引导，立即打开引导
    if (!hasViewedGuide) {
      setTimeout(() => {
        setShowGuide(true);
      }, 300);
    }
  };

  return (
    <>
      {children}
      <PrivacyAgreement onAccept={handlePrivacyAccepted} />
      <UserGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </>
  );
}

