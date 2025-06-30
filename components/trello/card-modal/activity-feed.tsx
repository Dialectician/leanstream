"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import type { Card } from "@/lib/types";

interface ActivityFeedProps {
  card: Card;
  newComment: string;
  setNewComment: (comment: string) => void;
  handleAddComment: () => void;
}

export function ActivityFeed({
  card,
  newComment,
  setNewComment,
  handleAddComment,
}: ActivityFeedProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
        <MessageSquare className="h-5 w-5" />
        Activity
      </h3>
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="mb-3 resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 w-full min-w-0"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comment
            </Button>
          </div>
        </div>
        {card.comments.map((comment) => (
          <div
            key={comment.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {comment.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed ml-11 break-words">
              {comment.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
