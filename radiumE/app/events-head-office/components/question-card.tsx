"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  GripVertical,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ChoiceOptionsEditor from "./choice-options-editor";
import type { Question } from "@/lib/hooks/useFormBuilder";

interface QuestionCardProps {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isDragDisabled?: boolean;
  dragHandleProps?: any;
}

const QUESTION_TYPE_LABELS = {
  short_text: "Short Text",
  long_text: "Long Text",
  number: "Number",
  email: "Email",
  phone: "Phone",
  date: "Date",
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  file: "File Upload",
};

const FILE_FORMATS = ["pdf", "ppt", "jpg", "png"];

export default function QuestionCard({
  question,
  onUpdate,
  onDelete,
  onDuplicate,
  isDragDisabled = false,
  dragHandleProps,
}: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const isChoiceQuestion =
    question.question_type === "single_choice" ||
    question.question_type === "multiple_choice";

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {!isDragDisabled && (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-white" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <input
              value={question.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Question label"
              className="text-sm font-medium border-none bg-card text-white p-0 h-auto focus:ring-0 w-full"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="h-8 w-8 p-0 text-white hover:text-foreground"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-white hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">
                Question Type
              </Label>
              <Select
                value={question.question_type}
                onChange={(e) =>
                  onUpdate({
                    question_type: e.target.value,
                    options:
                      e.target.value === "single_choice" ||
                      e.target.value === "multiple_choice"
                        ? [""]
                        : [],
                  })
                }
                className="h-9"
              >
                {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`required-${question.id}`}
                checked={question.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label
                htmlFor={`required-${question.id}`}
                className="text-sm font-medium text-white cursor-pointer"
              >
                Required
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Help Text</Label>
            <input
              value={question.help_text}
              onChange={(e) => onUpdate({ help_text: e.target.value })}
              placeholder="Optional help text"
              className="h-9 w-full px-3 py-2 border border-border rounded-md bg-card text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {isChoiceQuestion && (
            <ChoiceOptionsEditor
              options={question.options}
              onAddOption={() => {
                const newOptions = [...question.options, ""];
                onUpdate({ options: newOptions });
              }}
              onUpdateOption={(index, value) => {
                const newOptions = [...question.options];
                newOptions[index] = value;
                onUpdate({ options: newOptions });
              }}
              onRemoveOption={(index) => {
                const newOptions = question.options.filter(
                  (_, i) => i !== index
                );
                onUpdate({ options: newOptions });
              }}
            />
          )}

          {question.question_type === "file" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">
                Accepted Formats
              </Label>
              <div className="flex flex-wrap gap-2">
                {FILE_FORMATS.map((format) => (
                  <label
                    key={format}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={question.options.includes(format)}
                      onChange={(e) => {
                        const newOptions = e.target.checked
                          ? [...question.options, format]
                          : question.options.filter((opt) => opt !== format);
                        onUpdate({ options: newOptions });
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-white">.{format}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
