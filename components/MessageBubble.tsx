"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { Bot, File, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface MessageBubbleProps {
  content: string;
  isUser?: boolean;
  onTagClick?: (tag: string) => void;
}

interface KeywordTag {
  text: string;
  category: 'document' | 'car' | 'gaming' | 'general';
}

const formatMessage = (content: string): string => {
  let formatted = content.replace(/\\/g, "\\");
  formatted = formatted.replace(/\n/g, "<br/>");
  formatted = formatted.replace(/---START---\s*/g, "").replace(/\s*---END---/g, "");
  return formatted.trim();
};

const extractPdfUrl = (content: string): string | null => {
  const regex = /(https?:\/\/[^\s"]+(?:\.pdf|\/storage\/))/i;
  const match = content.match(regex);
  return match ? match[0] : null;
};

const extractKeywords = (content: string): KeywordTag[] => {
  // Common keywords for each category
  const categoryKeywords = {
    document: ['pdf', 'document', 'summary', 'analysis', 'report', 'text', 'file'],
    car: ['price', 'model', 'vehicle', 'market', 'dealer', 'brand', 'automotive'],
    gaming: ['game', 'player', 'console', 'level', 'score', 'achievement', 'gaming']
  };

  const keywords: KeywordTag[] = [];
  const words = content.toLowerCase().split(/\s+/);
  
  // Extract meaningful keywords and categorize them
  const uniqueWords = new Set(words);
  uniqueWords.forEach(word => {
    if (categoryKeywords.document.includes(word)) {
      keywords.push({ text: word, category: 'document' });
    } else if (categoryKeywords.car.includes(word)) {
      keywords.push({ text: word, category: 'car' });
    } else if (categoryKeywords.gaming.includes(word)) {
      keywords.push({ text: word, category: 'gaming' });
    } else if (word.length > 4 && !word.match(/^(https?:|www\.|[0-9])/)) {
      // Add other meaningful words as general tags
      keywords.push({ text: word, category: 'general' });
    }
  });

  // Limit to top 3-5 most relevant keywords
  return keywords.slice(0, Math.min(5, keywords.length));
};

const getTagStyles = (category: 'document' | 'car' | 'gaming' | 'general') => {
  const baseStyles = [
    "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium",
    "transition-all duration-300 hover:scale-105",
    "cursor-pointer backdrop-blur-sm",
    "border border-transparent",
    "shadow-sm hover:shadow-md",
    "animate-fadeIn"
  ];

  const categoryStyles = {
    document: [
      "bg-gradient-to-r from-blue-500/10 to-cyan-500/10",
      "text-blue-400 hover:text-blue-300",
      "hover:border-blue-500/20",
      "hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20",
      "hover:shadow-blue-500/10"
    ],
    car: [
      "bg-gradient-to-r from-emerald-500/10 to-green-500/10",
      "text-emerald-400 hover:text-emerald-300",
      "hover:border-emerald-500/20",
      "hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-green-500/20",
      "hover:shadow-emerald-500/10"
    ],
    gaming: [
      "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
      "text-purple-400 hover:text-purple-300",
      "hover:border-purple-500/20",
      "hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20",
      "hover:shadow-purple-500/10"
    ],
    general: [
      "bg-gradient-to-r from-primary/10 to-secondary/10",
      "text-primary hover:text-primary/90",
      "hover:border-primary/20",
      "hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20",
      "hover:shadow-primary/10"
    ]
  };

  return cn(...baseStyles, ...categoryStyles[category]);
};

export function MessageBubble({ content, isUser, onTagClick }: MessageBubbleProps) {
  const { user } = useUser();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<KeywordTag[]>([]);

  useEffect(() => {
    const url = extractPdfUrl(content);
    if (url) {
      setPdfUrl(url);
    }

    // Only extract keywords for AI responses
    if (!isUser) {
      setKeywords(extractKeywords(content));
    }
  }, [content, isUser]);

  return (
    <div className={cn("flex my-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative rounded-2xl px-6 py-4 max-w-[85%] md:max-w-[75%]",
          "transition-all duration-200",
          "shadow-lg hover:shadow-xl",
          isUser
            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-none ml-12"
            : "bg-gradient-to-br from-card to-card/95 text-card-foreground rounded-bl-none mr-12"
        )}
      >
        <div 
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: formatMessage(content) 
          }} 
        />

        {/* Keywords section for AI responses */}
        {!isUser && keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 w-full">
              <Tag className="h-3.5 w-3.5" />
              <span>Related topics:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <button
                  key={index}
                  onClick={() => onTagClick?.(keyword.text)}
                  className={getTagStyles(keyword.category)}
                >
                  <span className="relative">
                    <span className="relative z-10">{keyword.text}</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent blur opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {pdfUrl && (
          <div className="mt-4">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground px-4 py-2 rounded-lg hover:bg-accent/20 transition-colors"
            >
              <File className="h-5 w-5" />
              <span>Download Report (PDF)</span>
            </a>
          </div>
        )}

        <div
          className={cn(
            "absolute bottom-0",
            isUser
              ? "right-0 translate-x-1/2 translate-y-1/2"
              : "left-0 -translate-x-1/2 translate-y-1/2"
          )}
        >
          <div
            className={cn(
              "w-9 h-9 rounded-full border-2 flex items-center justify-center",
              "shadow-lg transition-transform duration-200 hover:scale-105",
              isUser 
                ? "bg-background border-border" 
                : "bg-primary border-background"
            )}
          >
            {isUser ? (
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Bot className="h-5 w-5 text-primary-foreground" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
