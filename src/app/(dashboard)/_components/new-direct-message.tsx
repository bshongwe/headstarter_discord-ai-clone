import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { SidebarGroupAction } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const NewDM = () => {
  const [open, setOpen] = useState(false);
  const createDirectMessage = useMutation(api.functions.dm.create);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const id = await createDirectMessage({
        username: e.currentTarget.username.value,
      });
      setOpen(false);
      router.push(`/dms/${id}`);
    } catch (error) {
      toast.error("Failed to create DM", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarGroupAction>
          <PlusIcon />
          <span className="sr-only">New Direct Message</span>
        </SidebarGroupAction>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">New Direct Message</DialogTitle>
          <DialogDescription className="text-center">
            Enter a username to start a direct message.
          </DialogDescription>
        </DialogHeader>
        <form className="contents" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" />
          </div>
          <DialogFooter>
            <Button className="w-full">Send DM</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
