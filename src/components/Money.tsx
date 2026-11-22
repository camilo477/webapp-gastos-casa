import { formatDemoAmount } from '../lib/format';

export function Money({ amountCOP, showCurrency = false, className = '' }: { amountCOP: number; showCurrency?: boolean; className?: string }) {
  return <span className={`amount ${className}`}>$ <span className="money-number">{formatDemoAmount(amountCOP)}</span>
    {showCurrency && <> <span className="currency">COP</span></>}
  </span>;
}
