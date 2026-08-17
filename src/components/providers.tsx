import { GoogleAnalytics } from "@/components/analytics";
import { CookieBanner } from "@/components/cookie-banner";
import type { AnalyticsSettings } from "@/lib/analytics";

export function Providers({ children, analytics }: { children: React.ReactNode; analytics: AnalyticsSettings }) {
  return (
    <>
      {children}
      <GoogleAnalytics settings={analytics} />
      <CookieBanner />
    </>
  );
}
