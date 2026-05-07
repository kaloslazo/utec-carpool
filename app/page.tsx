import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import StatsSection from "@/components/landing/StatsSection";
import FooterSection from "@/components/landing/FooterSection";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <StatsSection />
      <FooterSection />
    </>
  );
}
