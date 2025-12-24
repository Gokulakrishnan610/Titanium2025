"use client";

import { useState, useCallback } from "react";

export interface Question {
  id: string;
  label: string;
  question_type: string;
  required: boolean;
  help_text: string;
  order: number;
  options: string[];
}

export interface FormBuilderState {
  requireRegistrationForm: boolean;
  questions: Question[];
}

const QUESTION_TYPES = [
  "short_text",
  "long_text",
  "number",
  "email",
  "phone",
  "date",
  "single_choice",
  "multiple_choice",
  "file",
];

export function useFormBuilder(initialState?: Partial<FormBuilderState>) {
  const [state, setState] = useState<FormBuilderState>({
    requireRegistrationForm: false,
    questions: [],
    ...initialState,
  });

  const toggleRegistrationForm = useCallback(async (enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      requireRegistrationForm: enabled,
      // Clear questions if disabling registration form
      questions: enabled ? prev.questions : [],
    }));
  }, []);

  const addQuestion = useCallback(
    (questionType: string = "short_text") => {
      const newQuestion: Question = {
        id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: "",
        question_type: questionType,
        required: false,
        help_text: "",
        order: state.questions.length,
        options:
          questionType === "single_choice" || questionType === "multiple_choice"
            ? [""]
            : [],
      };

      setState((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
      }));
    },
    [state.questions.length]
  );

  const updateQuestion = useCallback(
    (questionId: string, updates: Partial<Question>) => {
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q
        ),
      }));
    },
    []
  );

  const deleteQuestion = useCallback((questionId: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((q) => q.id !== questionId)
        .map((q, index) => ({ ...q, order: index })),
    }));
  }, []);

  const duplicateQuestion = useCallback(
    (questionId: string) => {
      const questionToDuplicate = state.questions.find(
        (q) => q.id === questionId
      );
      if (!questionToDuplicate) return;

      const duplicatedQuestion: Question = {
        ...questionToDuplicate,
        id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: `${questionToDuplicate.label} (Copy)`,
        order: state.questions.length,
        options: [...questionToDuplicate.options],
      };

      setState((prev) => ({
        ...prev,
        questions: [...prev.questions, duplicatedQuestion],
      }));
    },
    [state.questions]
  );

  const reorderQuestions = useCallback(
    (startIndex: number, endIndex: number) => {
      setState((prev) => {
        const questions = [...prev.questions];
        const [removed] = questions.splice(startIndex, 1);
        questions.splice(endIndex, 0, removed);

        // Update order property
        const reorderedQuestions = questions.map((q, index) => ({
          ...q,
          order: index,
        }));

        return {
          ...prev,
          questions: reorderedQuestions,
        };
      });
    },
    []
  );

  const addOption = useCallback((questionId: string) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, ""] } : q
      ),
    }));
  }, []);

  const updateOption = useCallback(
    (questionId: string, optionIndex: number, value: string) => {
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                options: q.options.map((opt, idx) =>
                  idx === optionIndex ? value : opt
                ),
              }
            : q
        ),
      }));
    },
    []
  );

  const removeOption = useCallback(
    (questionId: string, optionIndex: number) => {
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                options: q.options.filter((_, idx) => idx !== optionIndex),
              }
            : q
        ),
      }));
    },
    []
  );

  const getFormData = useCallback(() => {
    return {
      requireRegistrationForm: state.requireRegistrationForm,
      questions: state.questions.map((q) => ({
        label: q.label,
        question_type: q.question_type,
        required: q.required,
        help_text: q.help_text,
        order: q.order,
        options: q.options.filter((opt) => opt.trim() !== ""), // Filter out empty options
      })),
    };
  }, [state]);

  return {
    state,
    toggleRegistrationForm,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
    addOption,
    updateOption,
    removeOption,
    getFormData,
    QUESTION_TYPES,
  };
}
