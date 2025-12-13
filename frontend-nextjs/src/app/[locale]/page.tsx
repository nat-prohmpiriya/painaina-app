'use client'

import { useAuth } from "@/hooks/useAuth"
import GuideFeed from "@/components/home/GuideFeed"
import {
  HeroSection,
  ValuePropsSection,
  HowItWorksSection,
  FeaturesSection,
  PopularGuidesSection,
  CTASection,
  FooterSection
} from "@/components/landing"

const HomePage = () => {
  const { isAuthenticated, isLoading } = useAuth()

  // Show GuideFeed when user is logged in
  if (!isLoading && isAuthenticated) {
    return <GuideFeed />
  }

  // Show landing page when not logged in
  // Destination-first approach: Guides นำ, Features รอง
  return (
    <>
      <HeroSection />
      <PopularGuidesSection />
      <ValuePropsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />
      <FooterSection />
    </>
  )
}

export default HomePage