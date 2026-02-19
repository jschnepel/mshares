import type { MarketData, ShareType } from '@/types';

function formatDollar(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function formatNumber(val: number): string {
  return val.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function generateExecutiveSummary(data: MarketData, shareType: ShareType): string {
  const sothebys = data.sothebysData;
  if (!sothebys) {
    return `Market data for ${data.marketName} has been processed. Russ Lyon Sotheby's International Realty was not found in this dataset.`;
  }

  const share = shareType === 'dollar' ? sothebys.marketShareDollar : sothebys.marketShareUnits;
  const shareLabel = shareType === 'dollar' ? 'dollar volume' : 'units sold';

  // Find #2 brokerage for the selected share type
  const sorted = [...data.brokerages].sort((a, b) =>
    shareType === 'dollar'
      ? b.marketShareDollar - a.marketShareDollar
      : b.marketShareUnits - a.marketShareUnits
  );

  const second = sorted.find(b => !b.isSothebys);
  const gap = second
    ? (shareType === 'dollar'
        ? sothebys.marketShareDollar - second.marketShareDollar
        : sothebys.marketShareUnits - second.marketShareUnits)
    : 0;

  const parts: string[] = [];

  // Opening — market position
  parts.push(
    `Russ Lyon Sotheby's International Realty commands ${share.toFixed(1)}% of the ${data.marketName} market by ${shareLabel}`
  );

  if (shareType === 'dollar' && sothebys.dollarVolume > 0) {
    parts[0] += ` (${formatDollar(sothebys.dollarVolume)})`;
  }

  if (second && gap > 0) {
    parts[0] += `, leading ${second.name} by ${gap.toFixed(1)} percentage points.`;
  } else {
    parts[0] += '.';
  }

  // Performance metrics
  const metrics: string[] = [];
  if (sothebys.avgPrice > 0) {
    metrics.push(`an average sale price of ${formatDollar(sothebys.avgPrice)}`);
  }
  if (sothebys.daysOnMarket > 0) {
    metrics.push(`${Math.round(sothebys.daysOnMarket)} average days on market`);
  }
  if (sothebys.pricePerSqFt > 0) {
    metrics.push(`${formatDollar(sothebys.pricePerSqFt)}/sqft`);
  }

  if (metrics.length > 0) {
    parts.push(`With ${metrics.join(', ')}, RLSIR maintains a premium market position among the top brokerages.`);
  }

  // Total market context
  if (sothebys.totalSales > 0) {
    parts.push(
      `Across ${formatNumber(Math.round(sothebys.totalSales))} total transactions, the firm demonstrates consistent market leadership in the ${data.marketName} area.`
    );
  }

  return parts.join(' ');
}
