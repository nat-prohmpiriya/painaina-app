/**
 * R2 Static Images
 *
 * All static images are hosted on Cloudflare R2 CDN
 * Base URL: https://pub-eb9816a6f9204df2a21a3d0a0f8152c1.r2.dev/static/img/
 */

const R2_BASE_URL = 'https://pub-eb9816a6f9204df2a21a3d0a0f8152c1.r2.dev/static/img';

export const r2Images = {
  // Destinations
  bangkok: `${R2_BASE_URL}/bangkok.webp`,
  bangkok2: `${R2_BASE_URL}/bangkok2.webp`,
  bangkok3: `${R2_BASE_URL}/bangkok3.webp`,
  chiangmai: `${R2_BASE_URL}/chiangmai.webp`,
  phuket: `${R2_BASE_URL}/phuket.webp`,
  krabi: `${R2_BASE_URL}/krabi.webp`,
  ayutthaya: `${R2_BASE_URL}/ayutthaya.webp`,
  huahin: `${R2_BASE_URL}/huahin.webp`,
  pattaya: `${R2_BASE_URL}/pattaya.webp`,

  // Interests / Activities
  beaches: `${R2_BASE_URL}/beaches.webp`,
  temples: `${R2_BASE_URL}/temples.webp`,
  thaifood: `${R2_BASE_URL}/thai-food.webp`,
  thaiMarket: `${R2_BASE_URL}/thai-market.webp`,
  thaiNature: `${R2_BASE_URL}/thai-nature.webp`,
  thaiMessage: `${R2_BASE_URL}/thai-message.webp`,
  nightlife: `${R2_BASE_URL}/nightlife.webp`,
  festivals: `${R2_BASE_URL}/festivals.webp`,
  historicalSite: `${R2_BASE_URL}/historical-site.webp`,
  shrines: `${R2_BASE_URL}/shrines.webp`,

  // UI / Features
  guideExplore: `${R2_BASE_URL}/guide-explore.webp`,
  travelPlannerDesktop: `${R2_BASE_URL}/travel-planner-desktop-size.webp`,

  // Logo
  logo64: `${R2_BASE_URL}/logo-64.webp`,
  logo128: `${R2_BASE_URL}/logo-128.webp`,
  logo256: `${R2_BASE_URL}/logo-256.webp`,
  logo512: `${R2_BASE_URL}/logo-512.webp`,

  // Features Section
  featureAddPlace: `${R2_BASE_URL}/01-add-place.webp`,
  featureCollaborate: `${R2_BASE_URL}/02-collaborate.webp`,
  featureAiGenerate: `${R2_BASE_URL}/03-ai-generate.webp`,
  featureIntraceMap: `${R2_BASE_URL}/04-intrace-map.webp`,
  featureOneClickBook: `${R2_BASE_URL}/05-one-click-book.webp`,
  featureOffline: `${R2_BASE_URL}/06-offline.webp`,
} as const;

// Default placeholder image (for development/fallback)
export const defaultImage = r2Images.bangkok;

// Type for image keys
export type R2ImageKey = keyof typeof r2Images;
