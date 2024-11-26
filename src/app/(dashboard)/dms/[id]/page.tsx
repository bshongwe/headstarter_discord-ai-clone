"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import {
  LoaderIcon,
  MoreVerticalIcon,
  PlusIcon,
  SendIcon,
  TrashIcon,
} from "lucide-react";
import Image from "next/image";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import React from "react";

export default function MessagePage({
  params,
}: {
  params: Promise<{ id: Id<"directMessages"> }>;
}) {
  const { id } = use(params);

  const user = useQuery(api.functions.user.get);
  const directMessage = useQuery(api.functions.dm.get, { id });
  const messages: Message[] =
    useQuery(api.functions.message.list, { directMessage: id }) || [];

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // check if sender is current user
    const isSender =
      messages.length > 0
        ? messages[messages.length - 1].sender?._id === user!._id
        : false;

    // get dynamically created scroll area
    const scrollArea = document.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    // scroll to bottom if sender is current user
    if (isSender && scrollArea) {
      scrollArea.scrollTo({
        top: scrollArea.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  if (!directMessage) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 divide-y max-h-screen">
      <header className="flex items-center gap-2 p-4">
        <Avatar className="size-8 border">
          <AvatarImage src={directMessage.user.image} />
          <AvatarFallback></AvatarFallback>
        </Avatar>
        <h1 className="font-semibold">{directMessage.user.username}</h1>
      </header>
      <ScrollArea ref={scrollAreaRef} className="h-full py-4" id="scroll-area">
        {messages?.map((message) => (
          <MessageItem key={message._id} message={message} />
        ))}
      </ScrollArea>
      <MessageInput directMessage={id} />
    </div>
  );
}

function TypingIndicator({
  directMessage,
}: {
  directMessage: Id<"directMessages">;
}) {
  const usernames = useQuery(api.functions.typing.list, { directMessage });

  if (!usernames || usernames.length === 0) return null;

  return (
    <div className="text-sm text-muted-foreground px-4 py-2">
      {usernames.join(", ")} is typing...
    </div>
  );
}

type Message = FunctionReturnType<typeof api.functions.message.list>[number];

// Doc<"messages"> represents a message
function MessageItem({ message }: { message: Message }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Avatar className="size-8 border">
        {message.sender && <AvatarImage src={message.sender.image} />}
        <AvatarFallback />
      </Avatar>
      <div className="flex flex-col mr-auto">
        <p className="text-xs text-muted-foreground">
          {message.sender?.username ?? "Deleted User "}
        </p>
        {message.deleted ? (
          <p className="text-sm text-destructive">
            This message was deleted.{" "}
            {message.deletedReason && (
              <span>Reason: {message.deletedReason}</span>
            )}
          </p>
        ) : (
          <>
            <p className="text-sm ">{message.content}</p>
            {message.attachment && (
              <Image
                src={message.attachment}
                alt="Attachment"
                width={300}
                height={300}
                className="rounded border overflow-hidden"
              />
            )}
          </>
        )}
      </div>
      <MessageActions message={message} />
    </div>
  );
}
function MessageActions({ message }: { message: Message }) {
  const user = useQuery(api.functions.user.get);
  const removeMutation = useMutation(api.functions.message.remove);

  if (!user || message.sender!._id !== user._id) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <MoreVerticalIcon className="size-4 text-muted-foreground" />
        <span className="sr-only">Message Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => removeMutation({ id: message._id })}
        >
          <TrashIcon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MessageInput({
  directMessage,
}: {
  directMessage: Id<"directMessages">;
}) {
  const [content, setContent] = useState("");
  const sendMessage = useMutation(api.functions.message.create);
  const sendTypingIndicator = useMutation(api.functions.typing.upsert);

  const generateUploadUrl = useMutation(
    api.functions.message.generateUploadUrl
  );
  // create a variable with type Id<"_storage"> and default value undefined -- end with "()"
  const removeAttachment = useMutation(api.functions.storage.remove);
  const [attachment, setAttachment] = useState<Id<"_storage">>();
  const [file, setFile] = useState<File>();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setIsUploading(true);
    const url = await generateUploadUrl();
    const res = await fetch(url, {
      method: "POST",
      body: file,
    });
    const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
    setAttachment(storageId);
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sendMessage({ directMessage, attachment, content });
      setContent("");
      setAttachment(undefined);
      setFile(undefined);
    } catch {
      toast.error("Failed to send message");
    }
  };

  return (
    <>
      <TypingIndicator directMessage={directMessage} />
      <form onSubmit={handleSubmit} className="flex items-end p-4 gap-2">
        <Button
          type="button" // not a "submit" button
          size="icon"
          onClick={() => {
            fileInputRef.current?.click();
          }}
        >
          <PlusIcon />
          <span className="sr-only">Attach</span>
        </Button>
        <div className="flew flex-col flex-1 gap-2">
          {file && (
            <ImagePreview
              file={file}
              isUploading={isUploading}
              onDelete={() => {
                if (attachment) {
                  removeAttachment({ storageId: attachment });
                }
                setAttachment(undefined);
                setFile(undefined);
              }}
            />
          )}
          <Input
            placeholder="Message"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (content.length > 0) {
                sendTypingIndicator({ directMessage });
              }
            }}
          />
        </div>
        <Button
          size="icon"
          disabled={content.length == 0 && attachment == null}
        >
          <SendIcon />
          <span className="sr-only">Send</span>
        </Button>
      </form>
      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        // either a function name or a lambda function
        onChange={handleImageUpload}
      />
    </>
  );
}

function ImagePreview({
  file,
  isUploading,
  onDelete,
}: {
  file: File;
  isUploading: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="relative size-40 rounded border overflow-hidden group">
      <Image
        src={URL.createObjectURL(file)}
        alt="Attachment"
        width={300}
        height={300}
      />
      {isUploading && (
        <div className="absoute inset-0 flex items-center justify-center bg-background/50">
          <LoaderIcon className="animate-spin size-8" />
        </div>
      )}
      <Button
        type="button"
        variant="destructive"
        className="absolute top-2 right-2 group-hover:opacity-100 opacity-0 transition-opacity"
        size="icon"
        onClick={onDelete}
      >
        <TrashIcon />
        <span className="sr-only">Delete</span>
      </Button>
    </div>
  );
}
