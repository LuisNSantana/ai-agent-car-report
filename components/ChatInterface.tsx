"use client";

import { useEffect, useRef, useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ChatRequestBody, StreamMessageType } from "@/lib/types";
import WelcomeMessage from "@/components/WelcomeMessage";
import { createSSEParser } from "@/lib/SSEParser";
import { MessageBubble } from "@/components/MessageBubble";
import { ArrowRight, Car, FileText, Gamepad, Loader2, Menu, Sparkles } from "lucide-react";
import { getConvexClient } from "@/lib/convex";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/lib/context/navigation";

interface ChatInterfaceProps {
  chatId: Id<"chats">;
  initialMessages: Doc<"messages">[];
}

interface TopicButton {
  icon: React.ReactNode;
  label: string;
  description: string;
  prompt: string;
}

const topicButtons: TopicButton[] = [
  {
    icon: <FileText className="h-5 w-5" />,
    label: "Document Analysis",
    description: "Get summaries and insights from your documents",
    prompt: "I need help analyzing and summarizing documents. Can you assist me with that?"
  },
  {
    icon: <Car className="h-5 w-5" />,
    label: "Car Prices",
    description: "Check market values and price trends",
    prompt: "I'd like to know about car prices and market trends. Can you help me?"
  },
  {
    icon: <Gamepad className="h-5 w-5" />,
    label: "Gaming",
    description: "Get gaming tips and recommendations",
    prompt: "I want to discuss gaming topics, recommendations, or tips. Can you assist me?"
  }
];

export default function ChatInterface({
  chatId,
  initialMessages,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Doc<"messages">[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [currentTool, setCurrentTool] = useState<{
    name: string;
    input: unknown;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setIsMobileNavOpen } = useNavigation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamedResponse]);

  const formatToolOutput = (output: unknown): string => {
    if (typeof output === "string") return output;
    return JSON.stringify(output, null, 2);
  };

  const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (chunk: string) => Promise<void>
  ) => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await onChunk(new TextDecoder().decode(value));
      }
    } finally {
      reader.releaseLock();
    }
  };

  const formatTerminalOutput = (
    tool: string,
    input: unknown,
    output: unknown
  ) => {
    const terminalHtml = `<div class="bg-card/50 backdrop-blur-sm border border-border rounded-lg my-4 overflow-x-auto whitespace-normal max-w-[600px]">
      <div class="flex items-center gap-1.5 border-b border-border p-3">
        <span class="text-red-500">●</span>
        <span class="text-yellow-500">●</span>
        <span class="text-green-500">●</span>
        <span class="text-muted-foreground ml-2 text-sm font-mono">~/${tool}</span>
      </div>
      <div class="p-4 space-y-4">
        <div>
          <div class="text-muted-foreground text-sm mb-1">$ Input</div>
          <pre class="text-yellow-400/90 text-sm whitespace-pre-wrap overflow-x-auto">${formatToolOutput(input)}</pre>
        </div>
        <div>
          <div class="text-muted-foreground text-sm mb-1">$ Output</div>
          <pre class="text-green-400/90 text-sm whitespace-pre-wrap overflow-x-auto">${formatToolOutput(output)}</pre>
        </div>
      </div>
    </div>`;

    return `---START---\n${terminalHtml}\n---END---`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setInput("");
    setStreamedResponse("");
    setCurrentTool(null);
    setIsLoading(true);

    const optimisticUserMessage: Doc<"messages"> = {
      _id: `temp_${Date.now()}`,
      chatId,
      content: trimmedInput,
      role: "user",
      createdAt: Date.now(),
    } as Doc<"messages">;

    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const telegramMatch = trimmedInput.match(
        /send a telegram message to ((@\w+)|([+\d]+)) with text (.+)/i
      );
      if (telegramMatch) {
        const recipient = telegramMatch[1];
        const text = telegramMatch[4];

        let chat_id = null;
        const convex = getConvexClient();

        if (recipient.startsWith("@")) {
          const result = await convex.query(api.usersTelegram.findChatIdByNickname, {
            nickname: recipient.slice(1),
          });
          chat_id = result?.chat_id || null;
        } else {
          const response = await fetch(`/api/telegram/getChatId?phone=${recipient}`);
          const data = await response.json();
          chat_id = data?.chat_id || null;
        }

        if (!chat_id) {
          setMessages((prev) => [
            ...prev,
            {
              _id: `temp_${Date.now()}`,
              chatId,
              content: `Could not find a chat_id for ${recipient}. Ask them to link their Telegram account.`,
              role: "assistant",
              createdAt: Date.now(),
            } as Doc<"messages">,
          ]);
          return;
        }

        const response = await fetch("/api/telegram/sendMessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        await response.json();

        setMessages((prev) => [
          ...prev,
          {
            _id: `temp_assistant_${Date.now()}`,
            chatId,
            content: `Message sent successfully to ${recipient}: "${text}"`,
            role: "assistant",
            createdAt: Date.now(),
          } as Doc<"messages">,
        ]);
        return;
      }

      const requestBody: ChatRequestBody = {
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        newMessage: trimmedInput,
        chatId,
      };

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error("No response body available");

      const parser = createSSEParser();
      const reader = response.body.getReader();

      let fullResponse = "";

      await processStream(reader, async (chunk) => {
        const messages = parser.parse(chunk);

        for (const message of messages) {
          switch (message.type) {
            case StreamMessageType.Token:
              if ("token" in message) {
                fullResponse += message.token;
                setStreamedResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolStart:
              if ("tool" in message) {
                setCurrentTool({
                  name: message.tool,
                  input: message.input,
                });
                fullResponse += formatTerminalOutput(
                  message.tool,
                  message.input,
                  "Processing..."
                );
                setStreamedResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolEnd:
              if ("tool" in message && currentTool) {
                const lastTerminalIndex = fullResponse.lastIndexOf(
                  '<div class="bg-card'
                );
                if (lastTerminalIndex !== -1) {
                  fullResponse =
                    fullResponse.substring(0, lastTerminalIndex) +
                    formatTerminalOutput(
                      message.tool,
                      currentTool.input,
                      message.output
                    );
                  setStreamedResponse(fullResponse);
                }
                setCurrentTool(null);
              }
              break;

            case StreamMessageType.Error:
              if ("error" in message) {
                throw new Error(message.error);
              }
              break;

            case StreamMessageType.Done:
              const assistantMessage: Doc<"messages"> = {
                _id: `temp_assistant_${Date.now()}`,
                chatId,
                content: fullResponse,
                role: "assistant",
                createdAt: Date.now(),
              } as Doc<"messages">;

              const convex = getConvexClient();
              await convex.mutation(api.messages.store, {
                chatId,
                content: fullResponse,
                role: "assistant",
              });

              setMessages((prev) => [...prev, assistantMessage]);
              setStreamedResponse("");
              return;
          }
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== optimisticUserMessage._id)
      );
      setStreamedResponse(
        formatTerminalOutput(
          "error",
          "Failed to process message",
          error instanceof Error ? error.message : "Unknown error"
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicSelect = async (prompt: string) => {
    if (isLoading) return;
    
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    setInput("");
    setStreamedResponse("");
    setCurrentTool(null);
    setIsLoading(true);

    const optimisticUserMessage: Doc<"messages"> = {
      _id: `temp_${Date.now()}`,
      chatId,
      content: trimmedPrompt,
      role: "user",
      createdAt: Date.now(),
    } as Doc<"messages">;

    setMessages((prev) => [...prev, optimisticUserMessage]);

    try {
      const requestBody: ChatRequestBody = {
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        newMessage: trimmedPrompt,
        chatId,
      };

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error("No response body available");

      const parser = createSSEParser();
      const reader = response.body.getReader();

      let fullResponse = "";

      await processStream(reader, async (chunk) => {
        const messages = parser.parse(chunk);
        for (const message of messages) {
          switch (message.type) {
            case StreamMessageType.Token:
              if ("token" in message) {
                fullResponse += message.token;
                setStreamedResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolStart:
              if ("tool" in message) {
                setCurrentTool({
                  name: message.tool,
                  input: message.input,
                });
                fullResponse += formatTerminalOutput(
                  message.tool,
                  message.input,
                  "Processing..."
                );
                setStreamedResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolEnd:
              if ("tool" in message && currentTool) {
                const lastTerminalIndex = fullResponse.lastIndexOf(
                  '<div class="bg-card'
                );
                if (lastTerminalIndex !== -1) {
                  fullResponse =
                    fullResponse.substring(0, lastTerminalIndex) +
                    formatTerminalOutput(
                      message.tool,
                      currentTool.input,
                      message.output
                    );
                  setStreamedResponse(fullResponse);
                }
                setCurrentTool(null);
              }
              break;

            case StreamMessageType.Error:
              if ("error" in message) {
                throw new Error(message.error);
              }
              break;

            case StreamMessageType.Done:
              const assistantMessage: Doc<"messages"> = {
                _id: `temp_assistant_${Date.now()}`,
                chatId,
                content: fullResponse,
                role: "assistant",
                createdAt: Date.now(),
              } as Doc<"messages">;

              const convex = getConvexClient();
              await convex.mutation(api.messages.store, {
                chatId,
                content: fullResponse,
                role: "assistant",
              });

              setMessages((prev) => [...prev, assistantMessage]);
              setStreamedResponse("");
              return;
          }
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== optimisticUserMessage._id)
      );
      setStreamedResponse(
        formatTerminalOutput(
          "error",
          "Failed to process message",
          error instanceof Error ? error.message : "Unknown error"
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    let prompt = "";
    
    // Generate contextual follow-up questions based on the tag category
    if (['pdf', 'document', 'summary', 'analysis', 'report', 'text', 'file'].includes(tag.toLowerCase())) {
      prompt = `Tell me more about the document's ${tag} section.`;
    } else if (['price', 'model', 'vehicle', 'market', 'dealer', 'brand', 'automotive'].includes(tag.toLowerCase())) {
      prompt = `What are the latest trends for ${tag} in the automotive market?`;
    } else if (['game', 'player', 'console', 'level', 'score', 'achievement', 'gaming'].includes(tag.toLowerCase())) {
      prompt = `Can you provide more details about ${tag} in gaming?`;
    } else {
      prompt = `Tell me more about ${tag}.`;
    }

    handleTopicSelect(prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Mobile Menu Button */}
      <div className="md:hidden p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileNavOpen(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </div>

      {/* Messages section with custom scrollbar */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 scrollbar-track-transparent">
        <div className="relative max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages?.length === 0 ? (
            <div className="space-y-8">
              <WelcomeMessage />
              
              {/* Topic Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topicButtons.map((topic) => (
                  <button
                    key={topic.label}
                    onClick={() => handleTopicSelect(topic.prompt)}
                    disabled={isLoading}
                    className={cn(
                      "group p-4 rounded-xl border border-border/50",
                      "bg-card/50 hover:bg-card backdrop-blur-sm",
                      "transition-all duration-200",
                      "text-left space-y-3",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {topic.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {topic.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Start conversation</span>
                      <Sparkles className="h-4 w-4 ml-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages?.map((message: Doc<"messages">) => (
              <MessageBubble
                key={message._id}
                content={message.content}
                isUser={message.role === "user"}
                onTagClick={handleTagClick}
              />
            ))
          )}

          {streamedResponse && (
            <MessageBubble 
              content={streamedResponse} 
              onTagClick={handleTagClick}
            />
          )}
          <div ref={messagesEndRef} className="h-px" />
        </div>
      </div>

      {/* Input section with glass effect */}
      <div className="border-t border-border bg-background/50 backdrop-blur-xl p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Zynk..."
              className={cn(
                "flex-1 py-3 px-4 rounded-xl border bg-card/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "placeholder:text-muted-foreground text-foreground",
                "transition-all duration-200"
              )}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "rounded-xl px-4 h-12",
                "flex items-center gap-2 transition-all duration-200",
                input.trim()
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
