'use client'

// TODO: This component needs travelPayoutService implementation
// Temporarily disabled to fix TypeScript errors

interface PriceTrendsProps {
  origin: string;
  destination: string;
  currency: string;
}

export default function PriceTrends(_props: PriceTrendsProps) {
  return (
    <div className="p-4">
      <p>This feature is temporarily unavailable. TravelPayout service integration pending.</p>
    </div>
  )
}
