import { cn } from '@/lib/utils';

interface CharacterCounterProps {
  content: string;
  platform: string;
}

const limits: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
};

export default function CharacterCounter({ content, platform }: CharacterCounterProps) {
  const limit = limits[platform.toLowerCase()] || 280;
  const count = content.length;
  const percentage = (count / limit) * 100;

  return (
    <div className="flex items-center justify-between text-sm mt-2">
      <span
        className={cn(
          'font-medium',
          count > limit && 'text-red-500',
          percentage > 90 && percentage <= 100 && 'text-orange-500',
          percentage <= 90 && 'text-muted-foreground'
        )}
      >
        {count} / {limit}
      </span>
      {count > limit && (
        <span className="text-red-500 font-medium">Exceeded limit!</span>
      )}
      {percentage > 90 && percentage <= 100 && (
        <span className="text-orange-500">Approaching limit</span>
      )}
    </div>
  );
}