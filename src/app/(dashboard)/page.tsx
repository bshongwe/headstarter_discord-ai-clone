"use client";

import {
  AcceptedFriendsList,
  PendingFriendsList,
} from "./_components/friends-list";
import { AddFriend } from "./_components/add-friend";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function friendsPage() {
  return (
    <div className="flex flex-1 flex-col divide-y">
      <header className="flex items-center justify-between p-4">
        <h1 className="font-semibold">Friends</h1>
        <AddFriend />
      </header>
      <div className="grid p-4 gap-4">
        <TooltipProvider delayDuration={0}>
          <PendingFriendsList />
          <AcceptedFriendsList />
        </TooltipProvider>
      </div>
    </div>
  );
}