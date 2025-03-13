"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Sparkles, Trash2, X } from "lucide-react";
import TimeAgo from "react-timeago";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/lib/context/navigation";
import { useUser } from "@clerk/nextjs";

function ChatRow({
  chat,
  onDelete,
}: {
  chat: Doc<"chats">;
  onDelete: (id: Id<"chats">) => void;
}) {
  const router = useRouter();
  const { closeMobileNav } = useNavigation();
  const lastMessage = useQuery(api.messages.getLastMessage, {
    chatId: chat._id,
  });

  const handleClick = () => {
    router.push(`/dashboard/chat/${chat._id}`);
    closeMobileNav();
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-border/50",
        "bg-card/50 hover:bg-card backdrop-blur-sm",
        "transition-all duration-200 cursor-pointer",
        "hover:shadow-md hover:translate-x-1"
      )}
      onClick={handleClick}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">
              {lastMessage ? (
                <>
                  <span className="text-muted-foreground">
                    {lastMessage.role === "user" ? "You: " : "Zynk: "}
                  </span>
                  {lastMessage.content.replace(/\\n/g, "\n")}
                </>
              ) : (
                <span className="text-muted-foreground">Untitled Chat</span>
              )}
            </p>
            {lastMessage && (
              <p className="text-xs text-muted-foreground mt-1">
                <TimeAgo date={lastMessage.createdAt} />
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "opacity-0 group-hover:opacity-100 absolute top-2 right-2",
              "transition-all duration-200 h-7 w-7"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chat._id);
            }}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const { isMobileNavOpen, closeMobileNav } = useNavigation();
  const { user } = useUser();

  const chats = useQuery(api.chats.listChats);
  const createChat = useMutation(api.chats.createChat);
  const deleteChat = useMutation(api.chats.deleteChat);

  const handleNewChat = async () => {
    const chatId = await createChat({ 
      title: "Untitled Chat",
      userId: user?.id || "" 
    });
    router.push(`/dashboard/chat/${chatId}`);
    closeMobileNav();
  };

  const handleDeleteChat = async (id: Id<"chats">) => {
    await deleteChat({ id });
    if (window.location.pathname.includes(id)) {
      router.push("/dashboard");
    }
  };

  return (
    <>
      {/* Background Overlay for mobile */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobileNav}
        />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-16 md:top-0 z-50",
          "w-72 h-[calc(100vh-4rem)] md:h-screen",
          "bg-background/50 backdrop-blur-xl",
          "border-r border-border",
          "flex flex-col",
          "transform transition-transform duration-300 ease-in-out md:translate-x-0",
          "shadow-lg",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button and title */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <h2 className="font-medium bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Zynk Chats
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobileNav}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <Button
            onClick={handleNewChat}
            className={cn(
              "w-full bg-primary/10 hover:bg-primary/20",
              "text-primary border border-primary/20",
              "shadow-sm hover:shadow-md",
              "transition-all duration-200",
              "rounded-xl"
            )}
          >
            <Plus className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 scrollbar-track-transparent">
          {chats?.length === 0 && (
            <div className="text-center text-muted-foreground p-4 text-sm italic">
              No chats yet. Click "New Chat" to get started!
            </div>
          )}
          {chats?.map((chat) => (
            <ChatRow key={chat._id} chat={chat} onDelete={handleDeleteChat} />
          ))}
        </div>
      </aside>
    </>
  );
}