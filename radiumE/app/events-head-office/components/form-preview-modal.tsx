"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { Question } from "@/lib/hooks/useFormBuilder";

interface FormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
}

export default function FormPreviewModal({
  isOpen,
  onClose,
  questions,
}: FormPreviewModalProps) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (
    questionId: string,
    value: any,
    questionType: string
  ) => {
    setFormData((prev) => ({ ...prev, [questionId]: value }));

    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }

    validateField(questionId, value, questionType);
  };

  const validateField = (
    questionId: string,
    value: any,
    questionType: string
  ) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    let error = "";

    if (question.required) {
      if (
        questionType === "single_choice" ||
        questionType === "multiple_choice"
      ) {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          error = "This field is required";
        }
      } else if (!value || value.toString().trim() === "") {
        error = "This field is required";
      }
    }

    if (value) {
      switch (questionType) {
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            error = "Please enter a valid email address";
          }
          break;
        case "phone":
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
            error = "Please enter a valid phone number";
          }
          break;
        case "number":
          if (isNaN(Number(value))) {
            error = "Please enter a valid number";
          }
          break;
      }
    }

    setErrors((prev) => ({ ...prev, [questionId]: error }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    questions.forEach((question) => {
      const value = formData[question.id];
      let error = "";

      if (question.required) {
        if (
          question.question_type === "single_choice" ||
          question.question_type === "multiple_choice"
        ) {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            error = "This field is required";
          }
        } else if (!value || value.toString().trim() === "") {
          error = "This field is required";
        }
      }

      if (value) {
        switch (question.question_type) {
          case "email":
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              error = "Please enter a valid email address";
            }
            break;
          case "phone":
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
              error = "Please enter a valid phone number";
            }
            break;
          case "number":
            if (isNaN(Number(value))) {
              error = "Please enter a valid number";
            }
            break;
        }
      }

      if (error) {
        newErrors[question.id] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreviewSubmit = () => {
    if (validateForm()) {
      alert(
        "Form validation passed! (This is a preview - no data was submitted)"
      );
    } else {
      alert("Please fix the validation errors before continuing.");
    }
  };

  const renderQuestionField = (question: Question) => {
    const baseClasses =
      "w-full p-3 border border-border rounded-lg bg-background text-white";

    const currentValue = formData[question.id] || "";
    const hasError = errors[question.id];

    switch (question.question_type) {
      case "short_text":
        return (
          <div>
            <input
              type="text"
              placeholder="Your answer"
              value={currentValue}
              onChange={(e) =>
                handleInputChange(
                  question.id,
                  e.target.value,
                  question.question_type
                )
              }
              className={`${baseClasses} ${hasError ? "border-red-500" : ""}`}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );

      case "long_text":
        return (
          <div>
            <textarea
              placeholder="Your answer"
              value={currentValue}
              onChange={(e) =>
                handleInputChange(
                  question.id,
                  e.target.value,
                  question.question_type
                )
              }
              className={`${baseClasses} min-h-[100px] resize-none text-white ${
                hasError ? "border-red-500" : ""
              }`}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );

      case "number":
        return (
          <div>
            <input
              type="number"
              placeholder="Your answer"
              value={currentValue}
              onChange={(e) =>
                handleInputChange(
                  question.id,
                  e.target.value,
                  question.question_type
                )
              }
              className={`${baseClasses} ${hasError ? "border-red-500" : ""}`}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );

      case "email":
        return (
          <div>
            <input
              type="email"
              placeholder="your@email.com"
              value={currentValue}
              onChange={(e) =>
                handleInputChange(
                  question.id,
                  e.target.value,
                  question.question_type
                )
              }
              className={`${baseClasses} ${hasError ? "border-red-500" : ""}`}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );

      case "phone":
        return (
          <div>
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={currentValue}
              onChange={(e) =>
                handleInputChange(
                  question.id,
                  e.target.value,
                  question.question_type
                )
              }
              className={`${baseClasses} ${hasError ? "border-red-500" : ""}`}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );

      case "date":
        return (
          <div>
            <input
              type="date"
              value={currentValue}
              onChange={(e) =>
                handleInputChange(
                  question.id,
                  e.target.value,
                  question.question_type
                )
              }
              className={`${baseClasses} ${hasError ? "border-red-500" : ""}`}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );

      case "single_choice":
        return (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <label
                key={index}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={currentValue === option}
                  onChange={(e) =>
                    handleInputChange(
                      question.id,
                      e.target.value,
                      question.question_type
                    )
                  }
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm text-white">
                  {option || `Option ${index + 1}`}
                </span>
              </label>
            ))}
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );

      case "multiple_choice":
        const selectedValues = Array.isArray(currentValue) ? currentValue : [];
        return (
          <div className="space-y-2">
            {question.options.map((option, index) => (
              <label
                key={index}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={option}
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = selectedValues.includes(option)
                      ? selectedValues.filter((v) => v !== option)
                      : [...selectedValues, option];
                    handleInputChange(
                      question.id,
                      newValues,
                      question.question_type
                    );
                  }}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm text-white">
                  {option || `Option ${index + 1}`}
                </span>
              </label>
            ))}
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );

      case "file":
        return (
          <div className="space-y-2">
            <input
              type="file"
              accept={question.options.map((format) => `.${format}`).join(",")}
              onChange={(e) =>
                handleInputChange(
                  question.id,
                  e.target.files?.[0] || null,
                  question.question_type
                )
              }
              className={baseClasses}
            />
            <p className="text-xs text-white">
              Accepted formats: {question.options.join(", ")}
            </p>
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );

      default:
        return (
          <div>
            <input
              type="text"
              placeholder="Your answer"
              value={currentValue}
              onChange={(e) =>
                handleInputChange(
                  question.id,
                  e.target.value,
                  question.question_type
                )
              }
              className={`${baseClasses} ${hasError ? "border-red-500" : ""}`}
            />
            {hasError && (
              <p className="text-red-500 text-xs mt-1">{hasError}</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-lg max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            Form Preview
          </h3>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Event Registration
              </h2>
              <p className="text-white">
                Please fill out the registration form below
              </p>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 text-white">
                <p>No questions configured for this form.</p>
              </div>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <Label className="text-sm font-medium text-white">
                    {index + 1}. {question.label}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>

                  {question.help_text && (
                    <p className="text-xs text-white">{question.help_text}</p>
                  )}

                  {renderQuestionField(question)}
                </div>
              ))
            )}

            <div className="pt-4 border-t border-border">
              <Button
                className="w-full"
                onClick={handlePreviewSubmit}
                disabled={false}
              >
                Test Form Validation
              </Button>
              <p className="text-xs text-white text-center mt-2">
                This is a preview - form submission is disabled, but you can
                test validation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
