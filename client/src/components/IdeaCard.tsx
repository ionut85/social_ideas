import { useState } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, GripVertical, Share2, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  platform: z.string().min(1, "Platform is required"),
  tags: z.array(z.string()).default([]),
});

interface Props {
  idea: Idea;
  index: number;
  moveIdea: (dragIndex: number, hoverIndex: number) => void;
  onUpdate: () => void;
}

export default function IdeaCard({ idea, index, moveIdea, onUpdate }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: idea.title,
      description: idea.description || "",
      platform: idea.platform,
      tags: idea.tags.map(tag => tag.name),
    },
  });

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

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // First update the idea details
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to update idea");

      // Then update the tags
      const tagsRes = await fetch(`/api/ideas/${idea.id}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: values.tags }),
      });
      if (!tagsRes.ok) throw new Error("Failed to update tags");
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      onUpdate();
      toast({
        title: "Success",
        description: "Idea updated successfully!",
      });
    },
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

  const handleAddTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && event.currentTarget.value) {
      event.preventDefault();
      const newTag = event.currentTarget.value.trim().toLowerCase();
      const currentTags = form.getValues('tags');

      if (newTag && !currentTags.includes(newTag)) {
        form.setValue('tags', [...currentTags, newTag]);
        event.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

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
              {idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {idea.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
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

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Idea</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your idea..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add more details..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="twitter">Twitter</SelectItem>
                              <SelectItem value="reddit">Reddit</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={() => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                placeholder="Type a tag and press Enter..."
                                onKeyPress={handleAddTag}
                              />
                              <div className="flex flex-wrap gap-2">
                                {form.watch('tags').map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {tag}
                                    <X
                                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                                      onClick={() => removeTag(tag)}
                                    />
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      Save Changes
                    </Button>
                  </form>
                </Form>
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