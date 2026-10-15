import { getWaitlistCount } from "@/lib/waitlist/actions";

// Live waitlist count — render per-request, not baked in at build time.
export const dynamic = "force-dynamic";
import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { Showcase } from "@/components/landing/showcase";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InclusiveSection } from "@/components/landing/inclusive-section";
import { Testimonials } from "@/components/landing/testimonials";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { WaitlistSection } from "@/components/landing/waitlist-section";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
import { SiteFooter } from "@/components/landing/site-footer";

export default async function LandingPage() {
  const waitlistCount = await getWaitlistCount();

  return (
    <div className="min-h-svh overflow-x-hidden bg-cream font-body text-ink">
      <SiteHeader />
      <Hero waitlistCount={waitlistCount} />
      <Marquee />
      <FeaturesGrid />
      <Showcase />
      <HowItWorks />
      <InclusiveSection />
      <Testimonials />
      <PricingTeaser />
      <WaitlistSection waitlistCount={waitlistCount} />
      <Faq />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
