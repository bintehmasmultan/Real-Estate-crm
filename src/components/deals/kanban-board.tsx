"use client";

import { useOptimistic, useTransition } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { updateDealStage } from "@/app/actions/deals";
import { formatCurrency, fullName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type DealCard = {
  id: string;
  title: string;
  value: number;
  probability: number;
  stageId: string;
  contact?: { firstName: string; lastName: string } | null;
  property?: { title: string } | null;
  agent?: { name: string } | null;
};

type Stage = {
  id: string;
  name: string;
  color: string;
  deals: DealCard[];
};

export function KanbanBoard({ stages }: { stages: Stage[] }) {
  const [optimistic, setOptimistic] = useOptimistic(stages);
  const [, startTransition] = useTransition();

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const next = optimistic.map((stage) => ({
      ...stage,
      deals: [...stage.deals],
    }));
    const from = next.find((s) => s.id === source.droppableId);
    const to = next.find((s) => s.id === destination.droppableId);
    if (!from || !to) return;

    const [moved] = from.deals.splice(source.index, 1);
    if (!moved) return;
    moved.stageId = to.id;
    to.deals.splice(destination.index, 0, moved);

    startTransition(async () => {
      setOptimistic(next);
      try {
        await updateDealStage(draggableId, destination.droppableId);
      } catch {
        toast.error("Could not update deal stage");
      }
    });
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:gap-4 sm:px-0">
        {optimistic.map((stage) => (
          <Droppable droppableId={stage.id} key={stage.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-[82vw] max-w-72 shrink-0 snap-start rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/60 sm:w-72"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="text-sm font-semibold">{stage.name}</h3>
                  </div>
                  <Badge variant="secondary">{stage.deals.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stage.deals.map((deal, index) => (
                    <Draggable draggableId={deal.id} index={index} key={deal.id}>
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                          <p className="text-sm font-medium">{deal.title}</p>
                          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(deal.value)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {deal.contact
                              ? fullName(deal.contact.firstName, deal.contact.lastName)
                              : "No contact"}
                            {deal.property ? ` · ${deal.property.title}` : ""}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <Badge variant="info">{deal.probability}%</Badge>
                            <span className="text-[11px] text-slate-500">
                              {deal.agent?.name || "Unassigned"}
                            </span>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
