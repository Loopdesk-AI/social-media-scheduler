import { useState } from "react";
import { Edit2, Trash2, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PostCardProps {
  post: any;
  onEdit?: (post: any) => void;
  onDelete?: (postId: string) => void;
  onDuplicate?: (post: any) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, post: any) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function PostCard({
  post,
  onEdit,
  onDelete,
  onDuplicate,
  draggable = false,
  onDragStart,
  onDragEnd,
}: PostCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getStatusVariant = (state: string) => {
    switch (state) {
      case "PUBLISHED":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
      case "QUEUE":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "ERROR":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case "PUBLISHED":
        return "✓";
      case "QUEUE":
        return "⏱";
      case "ERROR":
        return "⚠";
      default:
        return "•";
    }
  };

  return (
    <TooltipProvider>
      <Card
        draggable={draggable}
        onDragStart={(e) => onDragStart?.(e, post)}
        onDragEnd={onDragEnd}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        className="group relative hover:border-primary/50 transition-all duration-200 cursor-pointer hover:shadow-md"
      >
        <CardContent className="p-3">
          {/* Platform Icon & Time */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-5 w-5">
              <AvatarImage
                src={post.integration.picture}
                alt={post.integration.name}
              />
              <AvatarFallback className="text-[8px]">
                {post.integration.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-[11px] font-medium">
              {new Date(post.publishDate).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>

            {/* Status Badge */}
            <Badge
              variant="outline"
              className={`ml-auto text-[10px] px-2 py-0 h-5 ${getStatusVariant(post.state)}`}
            >
              {getStatusIcon(post.state)} {post.state}
            </Badge>
          </div>

          {/* Content Preview */}
          <p className="text-sm font-medium line-clamp-2 mb-2">
            {post.content}
          </p>

          {/* Quick Actions */}
          {showActions && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {post.releaseURL && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(post.releaseURL, "_blank");
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View post</TooltipContent>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 bg-background hover:bg-primary hover:text-primary-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(post);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
              )}
              {onDuplicate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 bg-background hover:bg-green-500 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(post);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate</TooltipContent>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 bg-background hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this post?")) {
                          onDelete(post.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Error Message */}
          {post.state === "ERROR" && post.error && (
            <p className="text-destructive text-[10px] mt-2 font-medium truncate">
              {post.error}
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
