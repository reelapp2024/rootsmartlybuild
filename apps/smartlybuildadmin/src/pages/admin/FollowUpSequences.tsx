import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit2, Plus, Trash2, GripVertical, MessageCircle, Mail, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SequenceStep {
  id: string;
  type: "trigger" | "whatsapp" | "email";
  content: string;
  delay: number;
  delayUnit: "hours" | "days";
}

interface Sequence {
  id: string;
  title: string;
  enabled: boolean;
  steps: SequenceStep[];
}

export default function FollowUpSequences() {
  const [sequences, setSequences] = useState<Sequence[]>([
    {
      id: "hot-lead",
      title: "Hot Lead Sequence",
      enabled: true,
      steps: [
        {
          id: "step-1",
          type: "trigger",
          content: "lead.created",
          delay: 0,
          delayUnit: "hours",
        },
        {
          id: "step-2",
          type: "whatsapp",
          content: "Welcome message template",
          delay: 1,
          delayUnit: "hours",
        },
        {
          id: "step-3",
          type: "email",
          content: "Follow-up email template",
          delay: 24,
          delayUnit: "hours",
        },
        {
          id: "step-4",
          type: "whatsapp",
          content: "Reminder message template",
          delay: 3,
          delayUnit: "days",
        },
      ],
    },
    {
      id: "warm-lead",
      title: "Warm Lead Sequence",
      enabled: true,
      steps: [
        {
          id: "step-1",
          type: "trigger",
          content: "lead.created",
          delay: 0,
          delayUnit: "hours",
        },
        {
          id: "step-2",
          type: "whatsapp",
          content: "Initial contact template",
          delay: 2,
          delayUnit: "hours",
        },
        {
          id: "step-3",
          type: "email",
          content: "Information email template",
          delay: 1,
          delayUnit: "days",
        },
      ],
    },
    {
      id: "cold-lead",
      title: "Cold Lead Sequence",
      enabled: false,
      steps: [
        {
          id: "step-1",
          type: "trigger",
          content: "lead.no-response",
          delay: 0,
          delayUnit: "hours",
        },
        {
          id: "step-2",
          type: "email",
          content: "Re-engagement email template",
          delay: 7,
          delayUnit: "days",
        },
        {
          id: "step-3",
          type: "whatsapp",
          content: "Final follow-up template",
          delay: 14,
          delayUnit: "days",
        },
      ],
    },
  ]);

  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleSequence = (sequenceId: string) => {
    setSequences((prev) =>
      prev.map((seq) =>
        seq.id === sequenceId ? { ...seq, enabled: !seq.enabled } : seq
      )
    );
  };

  const handleEditSequence = (sequence: Sequence) => {
    setEditingSequence({ ...sequence });
    setIsEditorOpen(true);
  };

  const handleSaveSequence = () => {
    if (editingSequence) {
      setSequences((prev) =>
        prev.map((seq) =>
          seq.id === editingSequence.id ? editingSequence : seq
        )
      );
      setIsEditorOpen(false);
      setEditingSequence(null);
    }
  };

  const handleAddStep = () => {
    if (editingSequence) {
      const newStep: SequenceStep = {
        id: `step-${Date.now()}`,
        type: "whatsapp",
        content: "",
        delay: 0,
        delayUnit: "hours",
      };
      setEditingSequence({
        ...editingSequence,
        steps: [...editingSequence.steps, newStep],
      });
    }
  };

  const handleDeleteStep = (stepId: string) => {
    if (editingSequence) {
      setEditingSequence({
        ...editingSequence,
        steps: editingSequence.steps.filter((step) => step.id !== stepId),
      });
    }
  };

  const handleUpdateStep = (stepId: string, updates: Partial<SequenceStep>) => {
    if (editingSequence) {
      setEditingSequence({
        ...editingSequence,
        steps: editingSequence.steps.map((step) =>
          step.id === stepId ? { ...step, ...updates } : step
        ),
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && editingSequence && active.id !== over.id) {
      const oldIndex = editingSequence.steps.findIndex(
        (step) => step.id === active.id
      );
      const newIndex = editingSequence.steps.findIndex(
        (step) => step.id === over.id
      );

      setEditingSequence({
        ...editingSequence,
        steps: arrayMove(editingSequence.steps, oldIndex, newIndex),
      });
    }
  };

  function SortableStepItem({ step }: { step: SequenceStep }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: step.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 p-4 border rounded-lg bg-white dark:bg-gray-800"
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1 grid grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-gray-500">Type</Label>
            <Select
              value={step.type}
              onValueChange={(value) =>
                handleUpdateStep(step.id, {
                  type: value as "trigger" | "whatsapp" | "email",
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trigger">Trigger</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Content</Label>
            {step.type === "trigger" ? (
              <Select
                value={step.content}
                onValueChange={(value) =>
                  handleUpdateStep(step.id, { content: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead.created">Lead Created</SelectItem>
                  <SelectItem value="lead.no-response">No Response</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="mt-1"
                value={step.content}
                onChange={(e) =>
                  handleUpdateStep(step.id, { content: e.target.value })
                }
                placeholder={
                  step.type === "whatsapp"
                    ? "WhatsApp template"
                    : "Email template"
                }
              />
            )}
          </div>
          <div>
            <Label className="text-xs text-gray-500">Delay</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                value={step.delay}
                onChange={(e) =>
                  handleUpdateStep(step.id, {
                    delay: parseInt(e.target.value) || 0,
                  })
                }
                className="w-20"
              />
              <Select
                value={step.delayUnit}
                onValueChange={(value) =>
                  handleUpdateStep(step.id, {
                    delayUnit: value as "hours" | "days",
                  })
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteStep(step.id)}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-0 py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-9 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-5 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Sequences Cards Skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ml-4"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-0 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Follow-up Sequences</h1>
        <p className="text-gray-500 mt-2">
          Automate follow-up messages for your leads
        </p>
      </div>

      <div className="space-y-4">
        {sequences.map((sequence) => (
          <Card key={sequence.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle>{sequence.title}</CardTitle>
                  <Badge
                    variant={sequence.enabled ? "default" : "outline"}
                    className={sequence.enabled ? "bg-green-500" : ""}
                  >
                    {sequence.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`toggle-${sequence.id}`}>
                      {sequence.enabled ? "On" : "Off"}
                    </Label>
                    <Switch
                      id={`toggle-${sequence.id}`}
                      checked={sequence.enabled}
                      onCheckedChange={() =>
                        handleToggleSequence(sequence.id)
                      }
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleEditSequence(sequence)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Sequence
                  </Button>
                </div>
              </div>
              <CardDescription>
                {sequence.steps.length} steps configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sequence.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      {step.type === "trigger" ? (
                        <Clock className="h-4 w-4 text-gray-400" />
                      ) : step.type === "whatsapp" ? (
                        <MessageCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium capitalize">{step.type}</p>
                      <p className="text-sm text-gray-500">{step.content}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Delay: {step.delay} {step.delayUnit}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Editor Modal */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sequence: {editingSequence?.title}</DialogTitle>
            <DialogDescription>
              Configure the steps for this follow-up sequence. Drag to reorder.
            </DialogDescription>
          </DialogHeader>
          {editingSequence && (
            <div className="space-y-4 py-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={editingSequence.steps.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {editingSequence.steps.map((step) => (
                      <SortableStepItem key={step.id} step={step} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button onClick={handleAddStep} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditorOpen(false);
                    setEditingSequence(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveSequence}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

