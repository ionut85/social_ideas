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
import { Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Idea } from "@/lib/types";
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

      moveIdea(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
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

  drag(drop(ref));

  return (
    <Card
      ref={ref}
      data-handler-id={handlerId}
      className={`${isDragging ? "opacity-50" : ""} cursor-move`}
    >
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{idea.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{idea.platform}</span>
            <span>•</span>
            <span>{format(new Date(idea.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
        <div className="flex gap-2">
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
  );
}
