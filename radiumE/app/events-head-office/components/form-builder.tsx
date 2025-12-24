"use client";

import { useEffect } from "react";
import { useFormBuilder } from "@/lib/hooks/useFormBuilder";
import FormBuilderToggle from "./form-builder-toggle";
import FormBuilderPanel from "./form-builder-panel";

interface FormBuilderProps {
  onFormDataChange?: (data: any) => void;
  onToggleChange?: (enabled: boolean) => Promise<void>;
  initialQuestions?: any[];
}

export default function FormBuilder({
  onFormDataChange,
  onToggleChange,
  initialQuestions,
}: FormBuilderProps) {
  const {
    state,
    toggleRegistrationForm,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
    getFormData,
  } = useFormBuilder(
    initialQuestions !== undefined
      ? {
          requireRegistrationForm: Array.isArray(initialQuestions) && initialQuestions.length > 0,
          questions: (Array.isArray(initialQuestions) ? initialQuestions : []).map((q) => ({
            id: q.id.toString(),
            label: q.label,
            question_type: q.question_type,
            required: q.required,
            help_text: q.help_text,
            order: q.order,
            options: q.options || [],
          })),
        }
      : undefined
  );

  // Notify parent component when form data changes
  useEffect(() => {
    if (onFormDataChange) {
      const formData = getFormData();
      const currentFormString = JSON.stringify(formData);
      const initialFormString = JSON.stringify({
        requireRegistrationForm: Array.isArray(initialQuestions) && initialQuestions.length > 0,
        questions: initialQuestions || [],
      });

      if (currentFormString !== initialFormString) {
        onFormDataChange(formData);
      }
    }
  }, [
    state.requireRegistrationForm,
    state.questions,
    onFormDataChange,
    getFormData,
    initialQuestions,
  ]);

  return (
    <div className="space-y-6">
      <FormBuilderToggle
        isEnabled={state.requireRegistrationForm}
        onToggle={async (enabled) => {
          await toggleRegistrationForm(enabled);
          if (onToggleChange) {
            await onToggleChange(enabled);
          }
        }}
      />

      {state.requireRegistrationForm && (
        <FormBuilderPanel
          questions={state.questions}
          onAddQuestion={addQuestion}
          onUpdateQuestion={updateQuestion}
          onDeleteQuestion={deleteQuestion}
          onDuplicateQuestion={duplicateQuestion}
          onReorderQuestions={reorderQuestions}
        />
      )}
    </div>
  );
}
