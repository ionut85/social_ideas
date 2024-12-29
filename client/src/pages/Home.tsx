import { useCallback, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import IdeaCard from "@/components/IdeaCard";
import NewIdeaDialog from "@/components/NewIdeaDialog";
import PlatformFilter from "@/components/PlatformFilter";
import type { Idea } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: ideas = [], refetch } = useQuery<Idea[]>({
    queryKey: ["/api/ideas"],
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (updates: { id: number; order: number }[]) => {
      const res = await fetch("/api/ideas/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error("Failed to update order");
    },
    onSuccess: () => refetch(),
  });

  const moveIdea = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const draggedIdea = ideas[dragIndex];
      const newOrder = [...ideas];
      newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, draggedIdea);

      const updates = newOrder.map((idea, index) => ({
        id: idea.id,
        order: newOrder.length - index,
      }));

      updateOrderMutation.mutate(updates);
    },
    [ideas, updateOrderMutation]
  );

  const filteredIdeas = selectedPlatform
    ? ideas.filter((idea) => idea.platform === selectedPlatform)
    : ideas;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Social Media Ideas
          </h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Idea
          </Button>
        </div>

        <PlatformFilter
          selected={selectedPlatform}
          onSelect={setSelectedPlatform}
        />

        <DndProvider backend={HTML5Backend}>
          <motion.div
            className="space-y-4 mt-8"
            layout
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence>
              {filteredIdeas.map((idea, index) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  index={index}
                  moveIdea={moveIdea}
                  onUpdate={() => refetch()}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </DndProvider>

        <NewIdeaDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => {
            refetch();
            toast({
              title: "Success",
              description: "New idea created successfully!",
            });
          }}
        />
      </div>
    </div>
  );
}