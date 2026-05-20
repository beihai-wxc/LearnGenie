import { LandingNavbar } from '@/components/landing/landing-navbar';
import { LandingHero } from '@/components/landing/landing-hero';
import { LandingFeatures } from '@/components/landing/landing-features';
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works';
import { LandingProductPreview } from '@/components/landing/landing-product-preview';
import { LandingUseCases } from '@/components/landing/landing-use-cases';
import { LandingFooter } from '@/components/landing/landing-footer';

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingProductPreview />
      <LandingUseCases />
      <LandingFooter />
    </>
  );
}
