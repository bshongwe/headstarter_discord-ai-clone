import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckIcon, MessageCircleIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PendingFriendsList() {
  const friends = useQuery(api.functions.friends.listPending);
  const updateStatus = useMutation(api.functions.friends.updateStatus);

  return (
    <div className="flex flex-col divide-y">
      <h2 className="text-xs font-weight-medium text-muted-foreground p-2.5 ">
        Pending Friends
      </h2>
      {friends?.length === 0 ? (
        <FriendsListEmpty>
          You dont have any pending friends requests
        </FriendsListEmpty>
      ) : (
        friends?.map((friend, index) => (
          <FriendItem
            key={index}
            username={friend.user.username}
            image={friend.user.image}
          >
            <IconButton
              icon={<CheckIcon />}
              className="bg-green-100"
              title="Accept Request"
              onClick={() => {
                // accept the friend request
                updateStatus({ id: friend._id, status: "accepted" });
              }}
            />
            <IconButton
              icon={<XIcon />}
              className="bg-red-100"
              title="Reject Request"
              onClick={() => {
                // reject the friend request
                updateStatus({ id: friend._id, status: "rejected" });
              }}
            />
          </FriendItem>
        ))
      )}
    </div>
  );
}

export function AcceptedFriendsList() {
  const friends = useQuery(api.functions.friends.listAccepted);
  const updateStatus = useMutation(api.functions.friends.updateStatus);

  return (
    <div className="flex flex-col divide-y">
      <h2 className="text-xs font-weight-medium text-muted-foreground p-2.5 ">
        Accepted Friends
      </h2>
      {friends?.length === 0 ? (
        <FriendsListEmpty>No accepted friends</FriendsListEmpty>
      ) : (
        friends?.map((friend, index) => (
          <FriendItem
            key={index}
            username={friend.user.username}
            image={friend.user.image}
          >
            <IconButton
              icon={<MessageCircleIcon />}
              className="bg-blue-100"
              title="Start DM"
              onClick={() => {
                // start a dm with the friend
              }}
            />
            <IconButton
              icon={<XIcon />}
              className="bg-red-100"
              title="Remove Friend"
              onClick={() => {
                // remove the friend (mark as rejected)
                updateStatus({ id: friend._id, status: "rejected" });
              }}
            />
          </FriendItem>
        ))
      )}
    </div>
  );
}

function FriendsListEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-muted/50 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function IconButton({
  icon,
  className,
  title: tooltip,
  onClick,
}: {
  icon: React.ReactNode;
  className: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      {/* Use the asChild property to pass the tooltip trigger to the first child element
      and prevent the tooltip from creating a button */}
      <TooltipTrigger asChild>
        <Button
          size="icon"
          className={cn("rounded-full", className)}
          variant="outline"
          onClick={onClick}
        >
          {icon}
          <span className="sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

// use composition to keep FriendItem generic and support both Pending and Accepted friends lists
function FriendItem({
  username,
  image,
  children,
}: {
  username: string;
  image: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 gap-2.5">
      <div className="flex items-center gap-2.5">
        <Avatar className="size-9 border">
          <AvatarImage src={image} />
          <AvatarFallback />
        </Avatar>
        <p className="text-sm font-medium">{username}</p>
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}
