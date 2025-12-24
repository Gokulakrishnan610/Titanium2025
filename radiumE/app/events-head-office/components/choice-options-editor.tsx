"use client"

import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"

interface ChoiceOptionsEditorProps {
  options: string[]
  onAddOption: () => void
  onUpdateOption: (index: number, value: string) => void
  onRemoveOption: (index: number) => void
}

export default function ChoiceOptionsEditor({
  options,
  onAddOption,
  onUpdateOption,
  onRemoveOption
}: ChoiceOptionsEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">Options</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddOption}
          className="h-8 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Option
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={option}
              onChange={(e) => onUpdateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-1 h-8 px-3 py-2 border border-border rounded-md bg-card text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveOption(index)}
              className="h-8 w-8 p-0 text-white hover:text-destructive"
              disabled={options.length <= 1}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}