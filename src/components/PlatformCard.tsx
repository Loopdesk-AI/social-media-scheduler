// React import not required with the automatic JSX runtime
import { Platform } from '../types';

type PlatformCardProps = {
  platform: Platform;
  onClick: () => void;
};
export function PlatformCard({
  platform,
  onClick
}: PlatformCardProps) {
  return <button onClick={onClick} className="bg-[#1a1a1a] rounded-lg p-5 flex flex-col items-center hover:bg-[#252525] transition-all text-center relative border border-transparent hover:border-gray-700/50">
      {platform.isPro && <div className="absolute top-3 right-3 bg-[#2a2a2a] text-[10px] font-semibold text-gray-300 px-2 py-1 rounded-md uppercase tracking-wide">
          Pro
        </div>}
      <div className="w-12 h-12 flex items-center justify-center mb-3">
        <img src={platform.icon} alt={platform.name} className="w-10 h-10 object-contain" />
      </div>
      <div className="text-white font-semibold text-sm mb-1">
        {platform.name}
      </div>
      <div className="text-gray-500 text-xs">{platform.description}</div>
    </button>;
}