"use client";

import { useState } from "react";
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import QuestionCard from "./question-card";
import FormPreviewModal from "./form-preview-modal";
import type { Question } from "@/lib/hooks/useFormBuilder";

interface SortableQuestionCardProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableQuestionCard({
  question,
  onUpdate,
  onDelete,
  onDuplicate,
}: SortableQuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <QuestionCard
        question={question}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

interface FormBuilderPanelProps {
  questions: Question[];
  onAddQuestion: (type?: string) => void;
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onDuplicateQuestion: (id: string) => void;
  onReorderQuestions: (startIndex: number, endIndex: number) => void;
}

export default function FormBuilderPanel({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onReorderQuestions,
}: FormBuilderPanelProps) {
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((item) => item.id === active.id);
      const newIndex = questions.findIndex((item) => item.id === over.id);

      onReorderQuestions(oldIndex, newIndex);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Registration Form Questions
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button onClick={() => onAddQuestion()} size="sm" className="text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Question
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No questions added yet.</p>
          <p className="text-xs mt-1">Click "Add Question" to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 touch-none">
              {questions.map((question) => (
                <SortableQuestionCard
                  key={question.id}
                  question={question}
                  onUpdate={(updates) => onUpdateQuestion(question.id, updates)}
                  onDelete={() => onDeleteQuestion(question.id)}
                  onDuplicate={() => onDuplicateQuestion(question.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <FormPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        questions={questions}
      />
    </div>
  );
}
