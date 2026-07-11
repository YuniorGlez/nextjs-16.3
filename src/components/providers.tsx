import { GoogleAnalytics } from "@/components/analytics";
import { CookieBanner } from "@/components/cookie-banner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GoogleAnalytics />
      <CookieBanner />
    </>
  );
}
