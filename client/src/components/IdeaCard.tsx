import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2, GripVertical, Share2 } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Idea } from "@/lib/types";
import { getShareUrl, openShareWindow } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

interface Props {
  idea: Idea;
  index: number;
  moveIdea: (dragIndex: number, hoverIndex: number) => void;
  onUpdate: () => void;
}

export default function IdeaCard({ idea, index, moveIdea, onUpdate }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [{ handlerId }, drop] = useDrop({
    accept: "idea",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveIdea(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: "idea",
    item: () => ({ id: idea.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete idea");
    },
    onSuccess: () => {
      onUpdate();
      toast({
        title: "Success",
        description: "Idea deleted successfully!",
      });
    },
  });

  const handleShare = () => {
    const shareConfig = {
      text: idea.description ? `${idea.title}\n\n${idea.description}` : idea.title,
      title: idea.title,
    };

    const shareUrl = getShareUrl(idea.platform, shareConfig);
    if (shareUrl) {
      openShareWindow(shareUrl);
    } else {
      toast({
        title: "Cannot share directly",
        description: "This platform doesn't support direct sharing via URL",
        variant: "destructive",
      });
    }
  };

  dragPreview(drop(ref));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        ref={ref}
        data-handler-id={handlerId}
        className={`${
          isDragging ? "opacity-50" : ""
        } transition-all duration-200 hover:shadow-md`}
      >
        <CardHeader className="flex flex-row justify-between items-center">
          <div className="flex items-center gap-3">
            <div ref={drag} className="cursor-move">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{idea.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{idea.platform}</span>
                <span>•</span>
                <span>{format(new Date(idea.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleShare}
              title="Share to platform"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Idea</DialogTitle>
                </DialogHeader>
                {/* Add edit form here */}
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        {idea.description && (
          <CardContent>
            <p className="text-sm text-muted-foreground">{idea.description}</p>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}