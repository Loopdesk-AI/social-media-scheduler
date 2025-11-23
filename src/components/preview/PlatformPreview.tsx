import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Repeat2, Share, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformPreviewProps {
  platform: 'twitter' | 'linkedin' | 'instagram';
  content: string;
  username?: string;
}

const previews = {
  twitter: {
    bg: 'bg-card',
    text: 'text-card-foreground',
    border: 'border-border',
  },
  linkedin: {
    bg: 'bg-card',
    text: 'text-card-foreground',
    border: 'border-border',
  },
  instagram: {
    bg: 'bg-gradient-to-tr from-purple-600 via-pink-500 to-yellow-500',
    text: 'text-white',
    border: 'border-none',
  },
};

export default function PlatformPreview({ platform, content, username = 'yourname' }: PlatformPreviewProps) {
  const style = previews[platform];

  return (
    <Card className={cn('w-full max-w-md overflow-hidden', style.bg, style.border)}>
      <CardContent className="p-0">
        {platform === 'twitter' && (
          <div className="p-4">
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold">{username}</span>
                  <span className="text-gray-500">@handle</span>
                </div>
                <p className="mt-2">{content}</p>
                <div className="flex gap-8 mt-4 text-muted-foreground">
                  <Button variant="ghost" size="sm"><MessageCircle className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="sm"><Repeat2 className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="sm"><Heart className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="sm"><Share className="h-5 w-5" /></Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {platform === 'linkedin' && (
          <div className="p-6">
            <div className="flex gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{username}</p>
                <p className="text-sm text-gray-600">Software Engineer | Open to work</p>
              </div>
            </div>
            <p className="mt-4">{content}</p>
            <div className="flex gap-4 mt-6 text-muted-foreground">
              <Button variant="ghost">Like</Button>
              <Button variant="ghost">Comment</Button>
              <Button variant="ghost">Repost</Button>
              <Button variant="ghost">Send</Button>
            </div>
          </div>
        )}

        {platform === 'instagram' && (
          <div className="relative">
            <div className="bg-black bg-opacity-30 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-white">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{username}</span>
              </div>
            </div>
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96" />
            <div className="p-4 flex justify-between text-card-foreground">
              <div className="flex gap-6">
                <Heart className="h-6 w-6" />
                <MessageCircle className="h-6 w-6" />
                <Share className="h-6 w-6" />
              </div>
              <Bookmark className="h-6 w-6" />
            </div>
            <p className="px-4 pb-4 text-card-foreground">{content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}