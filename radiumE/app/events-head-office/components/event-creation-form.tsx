"use client";
import type React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Globe,
  CalendarDays,
  Clock3,
  Ticket,
  Users,
  Camera,
  Palette,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useCreateEvent } from "@/lib/hooks/useEvents";
import { CreateEventData } from "@/lib/api/events";
import FormBuilder from "./form-builder";

function Pill({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground border border-border",
        onClick && "cursor-pointer hover:bg-secondary/80",
        className
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

function Row({
  leftIcon,
  label,
  children,
}: {
  leftIcon?: React.ReactNode;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-foreground/80">{leftIcon}</span>
        <span className="text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function CoverCard({
  imageFile,
  onImageChange,
  onImageRemove,
}: {
  imageFile: File | null;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Create object URL when imageFile changes and clean up previous one
  useEffect(() => {
    // Clean up previous object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Clear previous preview
    setImagePreview(null);

    if (imageFile) {
      // Create object URL for immediate preview
      objectUrlRef.current = URL.createObjectURL(imageFile);
      setImagePreview(objectUrlRef.current);
    }
  }, [imageFile]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageChange(file);
      // The useEffect will handle creating the preview
    }
  };

  const handleRemoveImage = () => {
    // Clean up object URL when removing image
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Clear preview state
    setImagePreview(null);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Notify parent component
    onImageRemove();
  };

  return (
    <div className="flex flex-col gap-4 mr-4">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card h-[280px] w-[280px] sm:h-[320px] sm:w-[320px] md:h-[360px] md:w-[360px]">
        {imagePreview ? (
          <>
            <Image
              src={imagePreview}
              alt="Event cover artwork"
              width={640}
              height={640}
              className="absolute inset-0 w-full h-full object-cover rounded-xl"
              priority
            />
            <button
              aria-label="Remove cover"
              onClick={handleRemoveImage}
              className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-red-500 text-white shadow hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div
            onClick={handleImageClick}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-xl p-4"
          >
            <Upload className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400 mb-4" />
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">
              Click to upload cover image
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              PNG, JPG up to 10MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload event cover image"
        />

        {imagePreview && (
          <button
            aria-label="Change cover"
            onClick={handleImageClick}
            className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground shadow hover:bg-secondary/80"
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card px-3 py-3">
          <div className="inline-flex h-8 w-10 items-center justify-center rounded-xl border border-border bg-secondary">
            <Palette className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Theme</div>
            <div className="truncate text-sm">Minimal</div>
          </div>
        </div>

        <button
          aria-label="Shuffle theme"
          className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-card/80"
        >
          {"\u21BB"}
        </button>
      </div>
    </div>
  );
}

function DateTimePills({
  eventData,
  onEventDataChange,
}: {
  eventData: Partial<
    CreateEventData & { start_date: string; end_date: string }
  >;
  onEventDataChange: (
    field: keyof (CreateEventData & { start_date: string; end_date: string }),
    value: string
  ) => void;
}) {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<"start_time" | "end_time">("start_time");

  const formatDate = (dateString: string) => {
    if (!dateString) return "Select Date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return "Select Time";
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleStartDateSelect = (date: string) => {
    onEventDataChange("start_date", date);
    setShowStartDatePicker(false);
  };

  const handleEndDateSelect = (date: string) => {
    onEventDataChange("end_date", date);
    setShowEndDatePicker(false);
  };

  const handleTimeSelect = (time: string) => {
    onEventDataChange(activeTimeField, time);
    setShowTimePicker(false);
  };

  const openTimePicker = (field: "start_time" | "end_time") => {
    setActiveTimeField(field);
    setShowTimePicker(true);
  };

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
      <div className="rounded-xl border border-border bg-card p-3 relative">
        <div className="flex items-start gap-3 sm:gap-5">
          <div className="flex flex-col items-center pt-1">
            <span className="text-xs text-muted-foreground">Start</span>
            <span className="my-1 h-6 w-px rounded bg-border" />
            <span className="text-xs text-muted-foreground">End</span>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Pill
                className="cursor-pointer hover:bg-secondary/80 text-xs sm:text-sm"
                onClick={() => setShowStartDatePicker(true)}
              >
                <CalendarDays color="white" className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">
                  {formatDate(eventData.start_date || "")}
                </span>
              </Pill>
              <Pill
                className="cursor-pointer hover:bg-secondary/80 text-xs sm:text-sm"
                onClick={() => openTimePicker("start_time")}
              >
                <Clock3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">
                  {formatTime(eventData.start_time || "")}
                </span>
              </Pill>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill
                className="cursor-pointer hover:bg-secondary/80 text-xs sm:text-sm"
                onClick={() => setShowEndDatePicker(true)}
              >
                <CalendarDays color="white" className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">
                  {formatDate(eventData.end_date || "")}
                </span>
              </Pill>
              <Pill
                className="cursor-pointer hover:bg-secondary/80 text-xs sm:text-sm"
                onClick={() => openTimePicker("end_time")}
              >
                <Clock3 className="h-3 w-3 sm:h-4 sm:w-4 !text-white" />
                <span className="truncate">
                  {formatTime(eventData.end_time || "")}
                </span>
              </Pill>
            </div>
          </div>
        </div>

        {/* Start Date Picker Modal */}
        <DatePickerModal
          isOpen={showStartDatePicker}
          onClose={() => setShowStartDatePicker(false)}
          value={eventData.start_date || ""}
          onChange={(value) => handleStartDateSelect(value)}
          title="Select Start Date"
        />

        {/* End Date Picker Modal */}
        <DatePickerModal
          isOpen={showEndDatePicker}
          onClose={() => setShowEndDatePicker(false)}
          value={eventData.end_date || ""}
          onChange={(value) => handleEndDateSelect(value)}
          title="Select End Date"
        />

        {/* Time Picker Modal */}
        <TimePickerModal
          isOpen={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          value={eventData[activeTimeField] || ""}
          onChange={(value) => handleTimeSelect(value)}
          title={`Select ${activeTimeField === "start_time" ? "Start" : "End"} Time`}
        />
      </div>

      {/* <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <div className="text-sm font-medium">GMT+05:30</div>
            <div className="text-xs text-muted-foreground">Asia/Kolkata</div>
          </div>
        </div>
      </div> */}
    </div>
  );
}

function CollapsedRow({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  // Truncate long titles for better UX
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  // Parse title for links enclosed in []
  const renderTitle = (text: string) => {
    const parts = text.split(/(\[.*?\])/);
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const linkText = part.slice(1, -1);
        // Check if it's a URL
        if (linkText.startsWith('http://') || linkText.startsWith('https://')) {
          return (
            <a
              key={index}
              href={linkText}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline hover:text-blue-700"
              onClick={(e) => e.stopPropagation()} // Prevent triggering onClick
            >
              {linkText}
            </a>
          );
        }
      }
      return part;
    });
  };

  const displayTitle = truncateText(title);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-3 sm:px-4 py-3 overflow-hidden",
        onClick && "cursor-pointer hover:bg-card/80"
      )}
      onClick={onClick}
    >
      <div className="text-sm font-medium break-all whitespace-normal">{renderTitle(displayTitle)}</div>
      {subtitle ? (
        <div className="text-xs text-muted-foreground break-all whitespace-normal">{subtitle}</div>
      ) : null}
    </div>
  );
}

function TimePickerModal({
  isOpen,
  onClose,
  value,
  onChange,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  title: string;
}) {
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);

  useEffect(() => {
    if (value) {
      const [time, period] = value.split(' ');
      if (time) {
        const [hourStr, minuteStr] = time.split(':');
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr) || 0;

        if (period === 'PM' && hour !== 12) {
          hour += 12;
        } else if (period === 'AM' && hour === 12) {
          hour = 0;
        }

        setSelectedHour(hour);
        setSelectedMinute(minute);
        setIsAM(period !== 'PM');
      }
    } else {
      setSelectedHour(9);
      setSelectedMinute(0);
      setIsAM(true);
    }
  }, [value, isOpen]);

  const formatTime = (hour: number, minute: number, am: boolean) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = am ? 'AM' : 'PM';
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatTimeValue = (hour: number, minute: number, am: boolean) => {
    const hour24 = am ? (hour === 12 ? 0 : hour) : (hour === 12 ? 12 : hour + 12);
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleTimeSelect = (hour: number, minute: number, am: boolean) => {
    const timeValue = formatTimeValue(hour, minute, am);
    onChange(timeValue);
    onClose();
  };

  const quickTimes = [
    { hour: 9, minute: 0, am: true },   // 9:00 AM
    { hour: 10, minute: 0, am: true },  // 10:00 AM
    { hour: 11, minute: 0, am: true },  // 11:00 AM
    { hour: 12, minute: 0, am: false }, // 12:00 PM
    { hour: 1, minute: 0, am: false },  // 1:00 PM
    { hour: 2, minute: 0, am: false },  // 2:00 PM
    { hour: 3, minute: 0, am: false },  // 3:00 PM
    { hour: 4, minute: 0, am: false },  // 4:00 PM
    { hour: 5, minute: 0, am: false },  // 5:00 PM
    { hour: 6, minute: 0, am: false },  // 6:00 PM
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md mx-auto bg-card border border-border rounded-xl shadow-lg">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {title}
          </h3>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Quick Select</h4>
            <div className="grid grid-cols-5 gap-2">
              {quickTimes.map((time, index) => (
                <button
                  key={index}
                  onClick={() => handleTimeSelect(time.hour, time.minute, time.am)}
                  className="p-2 text-xs bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                >
                  {formatTime(time.hour, time.minute, time.am)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Custom Time</h4>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">Hour</span>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setSelectedHour(prev => (prev + 1) % 24)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary"
                  >
                    ▲
                  </button>
                  <div className="w-12 h-12 flex items-center justify-center bg-secondary rounded-lg text-lg font-mono">
                    {selectedHour.toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => setSelectedHour(prev => prev === 0 ? 23 : prev - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary"
                  >
                    ▼
                  </button>
                </div>
              </div>

              <span className="text-2xl text-muted-foreground">:</span>

              {/* Minute Selector */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">Minute</span>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => setSelectedMinute(prev => (prev + 15) % 60)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary"
                  >
                    ▲
                  </button>
                  <div className="w-12 h-12 flex items-center justify-center bg-secondary rounded-lg text-lg font-mono">
                    {selectedMinute.toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => setSelectedMinute(prev => prev === 0 ? 45 : prev - 15)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary"
                  >
                    ▼
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-muted-foreground">Period</span>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setIsAM(true)}
                    className={cn(
                      "px-3 py-1 text-xs rounded",
                      isAM ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => setIsAM(false)}
                    className={cn(
                      "px-3 py-1 text-xs rounded",
                      !isAM ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <div className="text-lg font-mono bg-secondary/50 rounded-lg px-4 py-2 inline-block">
                {formatTime(selectedHour, selectedMinute, isAM)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleTimeSelect(selectedHour, selectedMinute, isAM)}
            className="text-sm sm:text-base"
          >
            Select Time
          </Button>
        </div>
      </div>
    </div>
  );
}

function DatePickerModal({
  isOpen,
  onClose,
  value,
  onChange,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  title: string;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSelecting(false);
      if (value) {
        // Parse date string directly without timezone conversion
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          setCurrentDate(new Date(date.getFullYear(), date.getMonth()));
        } else {
          // Invalid date, reset to today
          const today = new Date();
          setSelectedDate(null);
          setCurrentDate(today);
        }
      } else {
        // No value, start with today
        const today = new Date();
        setSelectedDate(null);
        setCurrentDate(today);
      }
    }
  }, [isOpen, value]); // Only depend on isOpen and value when modal opens

  const { days, monthNames, dayNames, today, year, month } = useMemo(() => {
    const today = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const daysArray: Date[] = [];
    const current = new Date(startDate);

    // Generate calendar days safely
    while (current <= endDate) {
      daysArray.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return { days: daysArray, monthNames, dayNames, today, year, month };
  }, [currentDate]);

  const handleDateSelect = useCallback(async (date: Date) => {
    if (isSelecting) return; // Prevent multiple clicks

    setIsSelecting(true);
    // Use local date to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // Update local state immediately for better UX
    setSelectedDate(date);

    // Call parent callback and close modal
    onChange(dateString);
    onClose();

    // Reset selecting state after a short delay
    setTimeout(() => setIsSelecting(false), 100);
  }, [isSelecting, onChange, onClose]);

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md mx-auto bg-card border border-border rounded-xl shadow-lg">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {title}
          </h3>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrevMonth();
              }}
              disabled={isSelecting}
              className={cn(
                "p-2 hover:bg-secondary rounded-lg transition-colors",
                isSelecting && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h4 className="text-lg font-semibold">
              {monthNames[month]} {year}
            </h4>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNextMonth();
              }}
              disabled={isSelecting}
              className={cn(
                "p-2 hover:bg-secondary rounded-lg transition-colors",
                isSelecting && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDateSelect(date);
                }}
                disabled={isSelecting}
                className={cn(
                  "h-10 w-10 text-sm rounded-lg transition-colors",
                  isCurrentMonth(date) ? "text-foreground hover:bg-secondary" : "text-muted-foreground",
                  isToday(date) && "ring-2 ring-primary ring-offset-1",
                  isSelected(date) && "bg-primary text-primary-foreground hover:bg-primary/90",
                  isSelecting && "opacity-50 cursor-not-allowed"
                )}
              >
                {date.getDate()}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Quick Select</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDateSelect(today);
                }}
                disabled={isSelecting}
                className={cn(
                  "p-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors",
                  isSelecting && "opacity-50 cursor-not-allowed"
                )}
              >
                Today
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  handleDateSelect(tomorrow);
                }}
                disabled={isSelecting}
                className={cn(
                  "p-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors",
                  isSelecting && "opacity-50 cursor-not-allowed"
                )}
              >
                Tomorrow
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-sm sm:text-base"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function TextInputModal({
  isOpen,
  onClose,
  value,
  onChange,
  title,
  placeholder = "Enter text",
  isTextarea = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  title: string;
  placeholder?: string;
  isTextarea?: boolean;
}) {
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(tempValue);
    onClose();
  };

  const handleCancel = () => {
    setTempValue(value);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-lg">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {title}
          </h3>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 sm:p-6">
          {isTextarea ? (
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              className="w-full min-h-[150px] sm:min-h-[200px] p-3 sm:p-4 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-sans text-sm sm:text-base"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              className="w-full p-3 sm:p-4 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-sans text-sm sm:text-base"
              autoFocus
            />
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="text-sm sm:text-base">
            Save {title}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EventOptions({
  eventData,
  onEventDataChange,
}: {
  eventData: Partial<CreateEventData>;
  onEventDataChange: (field: keyof CreateEventData, value: unknown) => void;
}) {
  return (
    <Card className="border border-border bg-secondary/40 rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm sm:text-base text-muted-foreground">
          Event Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row leftIcon={<Globe className="h-4 w-4" />} label="Event Type">
          <select
            value={eventData.event_type || "workshop"}
            onChange={(e) => onEventDataChange("event_type", e.target.value)}
            className="text-xs sm:text-sm bg-background border border-border rounded-lg px-2 py-1 hover:bg-secondary min-w-[120px]"
            aria-label="Select event type"
          >
            <option value="workshop">Workshop</option>
            <option value="seminar">Seminar</option>
            <option value="competition">Competition</option>
            <option value="hackathon">Hackathon</option>
            <option value="meetup">Meetup</option>
            <option value="conference">Conference</option>
            <option value="other">Other</option>
          </select>
        </Row>
        <Row leftIcon={<Users className="h-4 w-4" />} label="Participation">
          <select
            value={eventData.participation_type || "intra"}
            onChange={(e) =>
              onEventDataChange("participation_type", e.target.value)
            }
            className="text-xs sm:text-sm bg-background border border-border rounded-lg px-2 py-1 hover:bg-secondary min-w-[120px]"
            aria-label="Select participation type"
          >
            <option value="intra">Intra College</option>
            <option value="inter">Inter College</option>
          </select>
        </Row>
        <Row leftIcon={<Globe className="h-4 w-4" />} label="Event Mode">
          <select
            value={eventData.event_mode || "offline"}
            onChange={(e) => onEventDataChange("event_mode", e.target.value)}
            className="text-xs sm:text-sm bg-background border border-border rounded-lg px-2 py-1 hover:bg-secondary min-w-[120px]"
            aria-label="Select event mode"
          >
            <option value="offline">Offline</option>
            <option value="online">Online</option>
          </select>
        </Row>
        {eventData.event_mode === "online" && (
          <Row leftIcon={<Globe className="h-4 w-4" />} label="Meeting URL">
            <input
              type="url"
              value={eventData.meeting_url || ""}
              onChange={(e) => onEventDataChange("meeting_url", e.target.value)}
              placeholder="https://meet.google.com/..."
              className="text-xs sm:text-sm bg-background border border-border rounded-lg px-2 py-1 min-w-[200px] flex-1"
              aria-label="Meeting URL"
            />
          </Row>
        )}
        <Row leftIcon={<Ticket className="h-4 w-4" />} label="Tickets">
          <button
            className="text-xs sm:text-sm underline underline-offset-2 rounded-lg px-2 py-1 hover:bg-secondary"
            onClick={() =>
              onEventDataChange(
                "payment_type",
                eventData.payment_type === "free" ? "paid" : "free"
              )
            }
          >
            {eventData.payment_type === "free" ? "Free" : "Paid"}
          </button>
        </Row>
        {eventData.payment_type === "paid" && (
          <>
            <Row leftIcon={<Ticket className="h-4 w-4" />} label="Price">
              <input
                type="number"
                value={eventData.price || ""}
                onChange={(e) =>
                  onEventDataChange(
                    "price",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="Enter price"
                className="text-xs sm:text-sm bg-background border border-border rounded-lg px-2 py-1 hover:bg-secondary w-20 sm:w-24"
                min="0"
                step="0.01"
              />
            </Row>
            <Row leftIcon={<Ticket className="h-4 w-4" />} label="Payment Gateway">
              <select
                value={eventData.gateway_options || "cashfree"}
                onChange={(e) => onEventDataChange("gateway_options", e.target.value)}
                className="text-xs sm:text-sm bg-background border border-border rounded-lg px-2 py-1 hover:bg-secondary min-w-[120px]"
                aria-label="Select payment gateway"
              >
                <option value="cashfree">Cashfree</option>
                <option value="payu">PayU</option>
              </select>
            </Row>
          </>
        )}
        <Row leftIcon={<Users className="h-4 w-4" />} label="Capacity">
          <input
            type="number"
            value={eventData.max_participants || ""}
            onChange={(e) =>
              onEventDataChange(
                "max_participants",
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="Unlimited"
            className="text-xs sm:text-sm bg-background border border-border rounded-lg px-2 py-1 hover:bg-secondary w-20 sm:w-24"
            min="1"
          />
        </Row>
      </CardContent>
    </Card>
  );
}

interface EventCreationFormProps {
  onSuccess?: () => void;
}

export default function EventCreationForm({
  onSuccess,
}: EventCreationFormProps) {
  // State management for form data
  const [eventData, setEventData] = useState<
    Partial<CreateEventData & { start_date: string; end_date: string; registration_deadline_time: string }>
  >({
    event_name: "",
    description: "",
    event_date: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    event_type: "workshop",
    event_mode: "offline",
    payment_type: "free",
    participation_type: "intra",
    max_participants: 100,
    registration_deadline: "",
    registration_deadline_time: "",
    gateway_options: "cashfree",
    require_registration_form: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [showVenueModal, setShowVenueModal] = useState(false)
  const [showRegistrationDeadlinePicker, setShowRegistrationDeadlinePicker] = useState(false)
  const [showRegistrationDeadlineTimePicker, setShowRegistrationDeadlineTimePicker] = useState(false)
  const [formBuilderData, setFormBuilderData] = useState<{ questions?: { id: number; label: string; question_type: string; required: boolean; options?: string[] }[] } | null>(null)
  


  // API hooks
  const createEventMutation = useCreateEvent();



  const handleImageChange = (file: File) => {
    setImageFile(file);
    setEventData((prev) => ({ ...prev, event_image: file }));
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setEventData((prev) => ({ ...prev, event_image: undefined }));
  };

  const handleEventDataChange = (
    field: keyof (CreateEventData & { start_date: string; end_date: string; registration_deadline_time: string }),
    value: unknown
  ) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegistrationDeadlineSelect = (date: string) => {
    handleEventDataChange("registration_deadline", date);
    setShowRegistrationDeadlinePicker(false);
  }

  const handleRegistrationDeadlineTimeSelect = (time: string) => {
    handleEventDataChange("registration_deadline_time", time);
    setShowRegistrationDeadlineTimePicker(false);
  };



  const handleSubmitEvent = async () => {
    // Validate required fields with detailed feedback
    const missingFields = [];
    if (!eventData.event_name || eventData.event_name.trim() === '') missingFields.push('Event Name');
    if (!eventData.description || eventData.description.trim() === '') missingFields.push('Event Description');
    if (!eventData.start_date && !eventData.event_date) missingFields.push('Event Date');
    if (!eventData.start_time) missingFields.push('Start Time');
    if (!eventData.end_time) missingFields.push('End Time');
    if (!eventData.venue || eventData.venue.trim() === '') missingFields.push('Venue');
    if (!eventData.registration_deadline) missingFields.push('Registration Deadline Date');
    if (!eventData.registration_deadline_time) missingFields.push('Registration Deadline Time');

    if (missingFields.length > 0) {
      alert(
        `Please fill in the following required fields:\n\n${missingFields.join(
          "\n"
        )}`
      );
      return;
    }

    if (eventData.payment_type === 'paid' && (!eventData.price || eventData.price <= 0)) {
      alert("Please specify a valid price for paid events")
      return
    }



    // Ensure start_time and end_time are in HH:MM:SS format
    const formatTime = (t: string | undefined) => {
      if (!t) return undefined;
      return t.length === 5 ? t + ':00' : t;
    };

    // Validate dates
    const now = new Date()
    const eventDate = eventData.start_date || eventData.event_date || ""
    const eventDateTime = new Date(`${eventDate}T${formatTime(eventData.start_time)}`)
    const registrationDeadline = new Date(`${eventData.registration_deadline}T${formatTime(eventData.registration_deadline_time)}`)

    // Validate dates
    console.log("Date validation:", {
      now: now.toISOString(),
      eventDateTime: eventDateTime.toISOString(),
      registrationDeadline: registrationDeadline.toISOString(),
      eventDateInFuture: eventDateTime > now,
      deadlineBeforeEvent: registrationDeadline < eventDateTime,
      deadlineAtLeast1HourBefore: (eventDateTime.getTime() - registrationDeadline.getTime()) >= (60 * 60 * 1000)
    });

    if (eventDateTime <= now) {
      alert("Event date and time must be in the future")
      return
    }

    // Registration deadline should be before event date and time and at least 1 hour before
    if (registrationDeadline >= eventDateTime) {
      alert("Registration deadline must be before the event date and time")
      return
    }

    // Check that registration deadline is at least 1 hour before event start
    const timeDifference = eventDateTime.getTime() - registrationDeadline.getTime()
    const oneHourInMs = 60 * 60 * 1000
    if (timeDifference < oneHourInMs) {
      alert("Registration deadline must be at least 1 hour before the event starts")
      return
    }

    setIsLoading(true);
    try {
      // Ensure start_time and end_time are in HH:MM:SS format
      const formatTime = (t: string | undefined) => {
        if (!t) return undefined;
        return t.length === 5 ? t + ":00" : t;
      };

      // Validate dates
      const now = new Date();
      const eventDate = eventData.start_date || eventData.event_date || "";
      const eventDateTime = new Date(
        `${eventDate}T${formatTime(eventData.start_time)}`
      );
      const registrationDeadline = new Date(
        `${eventData.registration_deadline}T${formatTime(eventData.registration_deadline_time)}`
      );

      if (eventDateTime <= now) {
        alert("Event date and time must be in the future");
        return;
      }

      // Registration deadline should be before event date and time and at least 1 hour before
      if (registrationDeadline >= eventDateTime) {
        alert("Registration deadline must be before the event date and time");
        return;
      }

      // Check that registration deadline is at least 1 hour before event start
      const timeDifference = eventDateTime.getTime() - registrationDeadline.getTime();
      const oneHourInMs = 60 * 60 * 1000;
      if (timeDifference < oneHourInMs) {
        alert("Registration deadline must be at least 1 hour before the event starts");
        return;
      }

      // Registration deadline should be before event date and time (not just the date)
      if (registrationDeadline >= eventDateTime) {
        alert("Registration deadline must be before the event date and time");
        return;
      }

      // Convert date and time to proper datetime format for backend
      const toISODateTime = (date: string | undefined, time: string | undefined) => {
        if (!date) return undefined;
        const t = formatTime(time) || '00:00:00';
        // Create a proper Date object and use toISOString() like the test API
        const dateTime = new Date(`${date}T${t}`);
  
        // Check if the date is valid
        if (isNaN(dateTime.getTime())) {
          console.error("Invalid date created:", { date, time: t, result: dateTime });
          return undefined;
        }
  
        const isoString = dateTime.toISOString();
        console.log("Date conversion:", { input: { date, time: t }, output: isoString });
        return isoString;
      };
  
      // Convert date only (for event_end_date) to YYYY-MM-DD format
      const toDateOnly = (date: string | undefined) => {
        if (!date) return undefined;
        // Return just the date part in YYYY-MM-DD format
        return date;
      };

    // Build payload with proper typing - event_date should be datetime, not just date
    const formattedEventDateTime = toISODateTime(eventData.start_date || eventData.event_date, eventData.start_time);
    const formattedRegistrationDeadline = toISODateTime(eventData.registration_deadline, eventData.registration_deadline_time);

    if (!formattedEventDateTime) {
      alert("Invalid event date or time format. Please check your inputs.");
      return;
    }

    if (!formattedRegistrationDeadline) {
      alert("Invalid registration deadline format. Please check your inputs.");
      return;
    }

    const dataToSubmit: CreateEventData = {
      event_name: eventData.event_name!,
      description: eventData.description!,
      event_date: formattedEventDateTime,
      event_end_date: toDateOnly(eventData.end_date),
      start_time: formatTime(eventData.start_time)!,
      end_time: formatTime(eventData.end_time)!,
      venue: eventData.venue!,
      event_type: (eventData.event_type || "workshop") as CreateEventData['event_type'],
      event_mode: (eventData.event_mode || "offline") as CreateEventData['event_mode'],
      meeting_url: eventData.meeting_url || undefined,
      payment_type: (eventData.payment_type || "free") as CreateEventData['payment_type'],
      participation_type: (eventData.participation_type || "intra") as CreateEventData['participation_type'],
      max_participants: eventData.max_participants || 100,
      registration_deadline: formattedRegistrationDeadline
    };

    // Add optional time fields only if they have values
    if (eventData.start_time) {
      dataToSubmit.start_time = formatTime(eventData.start_time)!;
    }
    if (eventData.end_time) {
      dataToSubmit.end_time = formatTime(eventData.end_time)!;
    }

    // Handle form builder data
    const hasQuestions = formBuilderData?.questions && formBuilderData.questions.length > 0;
    if (hasQuestions) {
      dataToSubmit.require_registration_form = true;
      dataToSubmit.questions = formBuilderData.questions;
    }

      // Add price and gateway fields if payment type is paid
      if (eventData.payment_type === "paid") {
        if (eventData.price) {
          dataToSubmit.price = eventData.price;
        }
        if (eventData.gateway_options) {
          dataToSubmit.gateway_options = eventData.gateway_options;
        }
        if (eventData.gateway_credentials) {
          dataToSubmit.gateway_credentials = eventData.gateway_credentials;
        }
      }

      // Add image if present
      if (imageFile) {
        dataToSubmit.event_image = imageFile;
      }

      // Debug: Log the data being submitted
      console.log("=== EVENT CREATION DEBUG ===");
      console.log("Raw form data:", {
        event_name: eventData.event_name,
        description: eventData.description,
        start_date: eventData.start_date,
        event_date: eventData.event_date,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        venue: eventData.venue,
        registration_deadline: eventData.registration_deadline,
        event_type: eventData.event_type,
        payment_type: eventData.payment_type,
        participation_type: eventData.participation_type,
        max_participants: eventData.max_participants,
        price: eventData.price
      });
      console.log("Formatted dates:", {
        formattedEventDateTime,
        formattedRegistrationDeadline
      });
      console.log("Final payload:", JSON.stringify(dataToSubmit, null, 2));
      console.log("=== END DEBUG ===");

      await createEventMutation.mutateAsync(dataToSubmit);
      alert("Event created successfully!");

      // Reset form
      setEventData({
        event_name: "",
        description: "",
        event_date: "",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        venue: "",
        event_type: "workshop",
        payment_type: "free",
        participation_type: "intra",
        max_participants: 100,
        registration_deadline: "",
        registration_deadline_time: "",
        gateway_options: "cashfree",
        require_registration_form: false,
      });
      setImageFile(null);
      setFormBuilderData(null);

      // Call success callback if provided
      onSuccess?.();
    } catch (error: unknown) {
      // Debug: log the full error object for diagnosis
      console.error("Failed to create event (full error):", error);
      
      // Try to show backend validation errors if available
      let errorMsg = "Failed to create event. Please try again.";
      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as { response?: { data?: unknown } };
        if (apiError.response?.data) {
          const data = apiError.response.data;
          console.error("Parsing error data:", data);
          
          if (data && typeof data === 'object') {
            // Handle Django REST framework validation errors - try multiple formats
            if ('errors' in data) {
              const errorData = data as { errors?: Record<string, unknown> };
              if (errorData.errors) {
                errorMsg = Object.entries(errorData.errors)
                  .map(([field, msgs]) => `${field}: ${(Array.isArray(msgs) ? msgs.join(', ') : msgs)}`)
                  .join('\n');
              }
            } else if ('error' in data) {
              const errorData = data as { error?: string };
              if (errorData.error) {
                errorMsg = errorData.error;
              }
            } else if ('non_field_errors' in data) {
              const errorData = data as { non_field_errors?: string[] };
              if (errorData.non_field_errors) {
                errorMsg = errorData.non_field_errors.join('\n');
              }
            } else {
              // Handle field-level validation errors (Django REST framework format)
              const fieldErrors = Object.entries(data)
                .filter(([, value]) => Array.isArray(value) || typeof value === 'string')
                .map(([field, msgs]) => {
                  const msgStr = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
                  return `${field}: ${msgStr}`;
                })
                .join('\n');
              if (fieldErrors) {
                errorMsg = fieldErrors;
              } else {
                // If no specific field errors, show the raw data for debugging
                console.error("Unhandled error data structure:", data);
                errorMsg = `Invalid event data. Please check all fields are filled correctly.\n\nDebug info: ${JSON.stringify(data)}`;
              }
            }
          } else if (data && typeof data === "object" && "error" in data) {
            const errorData = data as { error?: string };
            if (errorData.error) {
              errorMsg = errorData.error;
            }
          } else if (typeof data === "string") {
            errorMsg = data;
          }
        }
      } else if (error && typeof error === "object" && "message" in error) {
        const err = error as { message: string };
        errorMsg = err.message;
      }
      
      console.error("Final error message:", errorMsg);
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state when fetching existing event data
  // if (isEditMode && isLoadingEvent) {
  //   return (
  //     <div className="flex items-center justify-center min-h-[400px]">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
  //         <p className="text-muted-foreground">Loading event data...</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[350px_1fr]">
      <CoverCard
        imageFile={imageFile}
        onImageChange={handleImageChange}
        onImageRemove={handleImageRemove}
      />

      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <input
            id="event-title"
            value={eventData.event_name || ""}
            onChange={(e) =>
              handleEventDataChange("event_name", e.target.value)
            }
            placeholder="Enter event name"
            className={`w-full text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight border-none bg-transparent p-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0`}
          />
        </div>

        <DateTimePills
          eventData={eventData}
          onEventDataChange={handleEventDataChange}
        />

        <CollapsedRow
          title={eventData.venue || "Add Event Location"}
          subtitle={
            eventData.event_mode === "online"
              ? "Online meeting medium(GMEET/ZOOM...)"
              : "Offline location or Online medium (gmeet/zoom..)"
          }
          onClick={() => setShowVenueModal(true)}
        />

        <div className="rounded-xl border border-border bg-card px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays color="white" className="h-4 w-4" />
            <div className="text-sm font-medium">Registration Deadline</div>
          </div>
          <div className="space-y-2">
            <Pill
              className="cursor-pointer hover:bg-secondary/80 text-sm w-full justify-start"
              onClick={() => setShowRegistrationDeadlinePicker(true)}
            >
              <CalendarDays color="white" className="h-4 w-4 mr-2" />
              <span className="truncate">
                {eventData.registration_deadline
                  ? new Date(eventData.registration_deadline).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "Select Date"}
              </span>
            </Pill>
            <Pill
              className="cursor-pointer hover:bg-secondary/80 text-sm w-full justify-start"
              onClick={() => setShowRegistrationDeadlineTimePicker(true)}
            >
              <Clock3 color="white" className="h-4 w-4 mr-2" />
              <span className="truncate">
                {eventData.registration_deadline_time || "Select Time"}
              </span>
            </Pill>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Registration must close at least 1 hour before event starts
          </div>
        </div>

        <CollapsedRow
          title={eventData.description || "Add Description"}
          onClick={() => setShowDescriptionModal(true)}
        />

        <EventOptions
          eventData={eventData}
          onEventDataChange={handleEventDataChange}
        />

        <FormBuilder onFormDataChange={setFormBuilderData} />

        <div className="mt-2">
          <Button
            onClick={handleSubmitEvent}
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-sm sm:text-base"
            aria-label="Create Event"
          >
            {isLoading ? "Creating Event..." : "Create Event"}
          </Button>
        </div>
      </div>

      <TextInputModal
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        value={eventData.description || ""}
        onChange={(value: string) =>
          handleEventDataChange("description", value)
        }
        title="Event Description"
        placeholder="Enter event description"
        isTextarea={true}
      />

      <TextInputModal
        isOpen={showVenueModal}
        onClose={() => setShowVenueModal(false)}
        value={eventData.venue || ""}
        onChange={(value: string) => handleEventDataChange("venue", value)}
        title="Event Location"
        placeholder={
          eventData.event_mode === "online"
            ? "Enter meeting medium (Google Meet, Zoom) or meeting URL"
            : "Enter event location or virtual address"
        }
        isTextarea={false}
      />

      {/* Registration Deadline Picker Modal */}
      <DatePickerModal
        isOpen={showRegistrationDeadlinePicker}
        onClose={() => setShowRegistrationDeadlinePicker(false)}
        value={eventData.registration_deadline || ""}
        onChange={(value) => handleRegistrationDeadlineSelect(value)}
        title="Select Registration Deadline"
      />

      {/* Registration Deadline Time Picker Modal */}
      <TimePickerModal
        isOpen={showRegistrationDeadlineTimePicker}
        onClose={() => setShowRegistrationDeadlineTimePicker(false)}
        value={eventData.registration_deadline_time || ""}
        onChange={(value) => handleRegistrationDeadlineTimeSelect(value)}
        title="Select Registration Deadline Time"
      />
    </div>
  );
}
