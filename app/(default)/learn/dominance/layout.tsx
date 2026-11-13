import { DominanceProvider } from 'components/viz/dominance/shared';

export default function DominanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DominanceProvider>{children}</DominanceProvider>;
}
