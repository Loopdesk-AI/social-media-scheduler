import { Clock, Plus } from "lucide-react";
import { PostCard } from "./PostCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DayDetailModalProps {
  date: Date;
  posts: any[];
  onClose: () => void;
  onAddPost?: () => void;
  onEditPost?: (post: any) => void;
  onDeletePost?: (postId: string) => void;
  onDuplicatePost?: (post: any) => void;
}

export function DayDetailModal({
  date,
  posts,
  onClose,
  onAddPost,
  onEditPost,
  onDeletePost,
  onDuplicatePost,
}: DayDetailModalProps) {
  const sortedPosts = [...posts].sort(
    (a, b) =>
      new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime(),
  );

  const postsByHour = sortedPosts.reduce(
    (acc, post) => {
      const hour = new Date(post.publishDate).getHours();
      if (!acc[hour]) acc[hour] = [];
      acc[hour].push(post);
      return acc;
    },
    {} as Record<number, any[]>,
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  const publishedCount = posts.filter((p) => p.state === "PUBLISHED").length;
  const queuedCount = posts.filter((p) => p.state === "QUEUE").length;
  const platformCount = new Set(
    posts.map((p) => p.integration.providerIdentifier),
  ).size;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{formatDate(date)}</DialogTitle>
              <DialogDescription>
                {posts.length} {posts.length === 1 ? "post" : "posts"} scheduled
              </DialogDescription>
            </div>
            {onAddPost && (
              <Button onClick={onAddPost} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Post
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {sortedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg text-muted-foreground mb-4">
                No posts scheduled for this day
              </p>
              {onAddPost && (
                <Button onClick={onAddPost}>Schedule a Post</Button>
              )}
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {(Object.entries(postsByHour) as [string, any[]][])
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([hour, hourPosts]) => (
                  <div key={hour} className="relative">
                    {/* Hour Label */}
                    <div className="flex items-center gap-4 mb-3">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-3 w-3 text-primary" />
                        {formatHour(Number(hour))}
                      </Badge>
                      <Separator className="flex-1" />
                    </div>

                    {/* Posts for this hour */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-8">
                      {hourPosts.map((post: any) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onEdit={onEditPost}
                          onDelete={onDeletePost}
                          onDuplicate={onDuplicatePost}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer Stats */}
        <div className="flex-shrink-0 pt-4 border-t">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total Posts:</span>
              <span className="font-semibold">{posts.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Platforms:</span>
              <span className="font-semibold">{platformCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Published:</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                {publishedCount}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Queued:</span>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {queuedCount}
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
