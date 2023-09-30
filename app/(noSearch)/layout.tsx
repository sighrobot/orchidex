import { HeaderLayout } from 'components/layouts';

export default function NoSearchLayout({ children }) {
  return <HeaderLayout hasSearch={false}>{children}</HeaderLayout>;
}
