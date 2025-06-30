"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paperclip, X } from "lucide-react";
import type { Card } from "@/lib/types";

interface AttachmentManagerProps {
  card: Card;
  handleDeleteAttachment: (attachmentId: number) => void;
}

export function AttachmentManager({
  card,
  handleDeleteAttachment,
}: AttachmentManagerProps) {
  if (card.attachments.length === 0) return null;

  const imageAttachments = card.attachments.filter((att) =>
    att.mimeType?.startsWith("image/")
  );
  const fileAttachments = card.attachments.filter(
    (att) => !att.mimeType?.startsWith("image/")
  );

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        Attachments ({card.attachments.length})
      </h3>

      {imageAttachments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Images
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {imageAttachments.map((attachment, index) => (
              <div
                key={attachment.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="relative h-32">
                  <Image
                    src={attachment.fileUrl}
                    alt={attachment.fileName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                {index === 0 && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-blue-600 text-white text-xs">
                      Cover
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = attachment.fileUrl;
                        link.download = attachment.fileName;
                        link.click();
                      }}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteAttachment(attachment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">
                    {attachment.fileName}
                  </p>
                  {attachment.fileSize && (
                    <p className="text-white text-xs opacity-75">
                      {(attachment.fileSize / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {fileAttachments.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Files
          </h4>
          <div className="space-y-2">
            {fileAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Paperclip className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {attachment.fileName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {attachment.fileSize && (
                        <span>
                          {(attachment.fileSize / 1024).toFixed(1)} KB
                        </span>
                      )}
                      {attachment.mimeType && (
                        <span>
                          • {attachment.mimeType.split("/")[1].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = attachment.fileUrl;
                      link.download = attachment.fileName;
                      link.click();
                    }}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
