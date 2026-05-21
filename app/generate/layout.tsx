import { AccessCodeGuard } from '@/components/access-code-guard';

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  return <AccessCodeGuard>{children}</AccessCodeGuard>;
}
