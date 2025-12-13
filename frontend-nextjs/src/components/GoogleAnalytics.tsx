import { GoogleAnalytics as GA } from '@next/third-parties/google';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalytics() {
  console.log('GoogleAnalytics - GA_ID:', GA_ID);

  if (!GA_ID) {
    console.log('GoogleAnalytics - GA_ID is not set, skipping');
    return null;
  }

  return <GA gaId={GA_ID} />;
}
