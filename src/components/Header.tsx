import { Link } from 'react-router';
import { Icon } from './Icon';

export function Header({ contextual }: { contextual: boolean }) {
  const brand = <><span className="brand-mark"><Icon name="home" /></span>Mi Casa</>;
  return <header className="app-header">
    {contextual ? <span className="brand">{brand}</span> : <Link className="brand" to="/">{brand}</Link>}
    <span className="header-caption">Lo de casa, a tu ritmo.</span>
  </header>;
}
