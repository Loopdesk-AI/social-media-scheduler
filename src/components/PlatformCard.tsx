import { Platform } from '../types';

type PlatformCardProps = {
  platform: Platform;
  onClick: () => void;
};
export function PlatformCard({
  platform,
  onClick
}: PlatformCardProps) {
  return <button onClick={onClick} className="rounded-lg p-5 flex flex-col items-center transition-all text-center relative border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--muted))'} onMouseLeave={(e) => e.currentTarget.style.background = 'hsl(var(--card))'}>
      {platform.isPro && <div className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-1 rounded-md uppercase tracking-wide" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
          Pro
        </div>}
      <div className="w-12 h-12 flex items-center justify-center mb-3">
        <img src={platform.icon} alt={platform.name} className="w-10 h-10 object-contain" />
      </div>
      <div className="font-semibold text-sm mb-1" style={{ color: 'hsl(var(--card-foreground))' }}>
        {platform.name}
      </div>
      <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{platform.description}</div>
    </button>;
}