"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FormBuilderToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => Promise<void>;
}

export default function FormBuilderToggle({
  isEnabled,
  onToggle,
}: FormBuilderToggleProps) {
  const handleToggle = async () => {
    const newState = !isEnabled;
    if (isEnabled) {
      if (
        window.confirm(
          "⚠️ Warning: Disabling the registration form will permanently delete all current questions. This action cannot be undone. Are you sure you want to proceed?"
        )
      ) {
        await onToggle(newState);
      }
    } else {
      await onToggle(newState);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3">
        <Label
          htmlFor="registration-form-toggle"
          className="text-sm font-medium text-white cursor-pointer"
        >
          Require Registration Form
        </Label>
        <Switch
          id="registration-form-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-primary"
        />
      </div>
      {isEnabled && (
        <div className="flex items-center px-3 py-2 rounded-md bg-amber-950/50 border border-amber-900/50">
          <p className="text-xs text-amber-400/90">
            ⚠️ Caution: Turning off the registration form will permanently
            delete all current questions with no way to recover them.
          </p>
        </div>
      )}
    </div>
  );
}
