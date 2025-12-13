'use client'

import { useAuth } from "@/hooks/useAuth"
import HeroSection from "@/components/home/HeroSection"
import FeaturesSection from "@/components/home/FeaturesSection"
import PopularDestinationSection from "@/components/home/PopularDestinationSection"
import FooterSection from "@/components/home/FooterSection"
import GuideFeed from "@/components/home/GuideFeed"

const HomePage = () => {
  const { isAuthenticated, isLoading } = useAuth()

  // Show GuideFeed when user is logged in
  if (!isLoading && isAuthenticated) {
    return <GuideFeed />
  }

  // Show landing page when not logged in
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PopularDestinationSection />
      <FooterSection />
    </>
  )
}

export default HomePage