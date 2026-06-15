import dynamic from 'next/dynamic';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingHero } from '@/components/landing/landing-hero';

// 首屏后组件懒加载 - 减少初始包体积
const LandingFeatures = dynamic(
  () => import('@/components/landing/landing-features').then((mod) => mod.LandingFeatures),
  { 
    loading: () => <div className="h-[600px] bg-gradient-to-b from-white via-[#f8f5ff]/30 to-white animate-pulse" />
  }
);

const LandingHowItWorks = dynamic(
  () => import('@/components/landing/landing-how-it-works').then((mod) => mod.LandingHowItWorks),
  { 
    loading: () => <div className="h-[700px] bg-gradient-to-b from-white via-[#f8f5ff]/50 to-white animate-pulse" />
  }
);

const LandingProductPreview = dynamic(
  () => import('@/components/landing/landing-product-preview').then((mod) => mod.LandingProductPreview),
  { 
    loading: () => <div className="h-[600px] bg-gradient-to-b from-white via-[#f8f5ff]/30 to-white animate-pulse" />
  }
);

const LandingUseCases = dynamic(
  () => import('@/components/landing/landing-use-cases').then((mod) => mod.LandingUseCases),
  { 
    loading: () => <div className="h-[500px] bg-gradient-to-b from-white via-[#f8f5ff]/30 to-white animate-pulse" />
  }
);

const LandingFAQ = dynamic(
  () => import('@/components/landing/landing-faq').then((mod) => mod.LandingFAQ),
  { 
    loading: () => <div className="h-[500px] bg-gradient-to-b from-white via-[#f8f5ff]/30 to-white animate-pulse" />
  }
);

const LandingFooter = dynamic(
  () => import('@/components/landing/landing-footer').then((mod) => mod.LandingFooter),
  { 
    loading: () => <div className="h-[400px] bg-gradient-to-b from-white via-[#f8f5ff]/60 to-[#f2eeff] animate-pulse" />
  }
);

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingProductPreview />
      <LandingUseCases />
      <LandingFAQ />
      <LandingFooter />
    </>
  );
}
