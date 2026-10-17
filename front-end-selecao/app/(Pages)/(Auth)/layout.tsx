import AuthPanel from '@/components/auth/AuthPanel';
import LanguageToggle from '@/components/i18n/LanguageToggle';
import ThemeToggle from '@/components/theme/ThemeToggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <AuthPanel />
      {children}
    </>
  );
}
