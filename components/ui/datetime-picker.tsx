"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  showLabels?: boolean;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}

export function DateTimePicker({ 
  showLabels = false, 
  value, 
  onChange 
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Format time from Date object to HH:MM:SS string
  const getTimeString = (date: Date | undefined) => {
    if (!date) return "10:30:00";
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange?.(undefined);
      setOpen(false);
      return;
    }

    // If there's an existing value, preserve the time
    if (value) {
      const newDate = new Date(selectedDate);
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      newDate.setSeconds(value.getSeconds());
      onChange?.(newDate);
    } else {
      // Set default time to 10:30:00
      const newDate = new Date(selectedDate);
      newDate.setHours(10);
      newDate.setMinutes(30);
      newDate.setSeconds(0);
      onChange?.(newDate);
    }
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    const [hours, minutes, seconds] = timeValue.split(":").map(Number);
    
    // If there's an existing date, update the time
    if (value) {
      const newDate = new Date(value);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      newDate.setSeconds(seconds || 0);
      onChange?.(newDate);
    } else {
      // Create a new date with today's date and the selected time
      const newDate = new Date();
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      newDate.setSeconds(seconds || 0);
      onChange?.(newDate);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        {showLabels ? (
          <Label htmlFor="date-picker" className="px-1">
            Date
          </Label>
        ) : null}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="date-picker"
              className="w-32 justify-between font-normal"
            >
              {value ? value.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              captionLayout="dropdown"
              onSelect={handleDateChange}
              fromYear={new Date().getFullYear()}
              toYear={new Date().getFullYear() + 10}
              className="min-h-[330px]"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        {showLabels ? (
          <Label htmlFor="time-picker" className="px-1">
            Time
          </Label>
        ) : null}
        <Input
          type="time"
          id="time-picker"
          step="1"
          value={getTimeString(value)}
          onChange={handleTimeChange}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}