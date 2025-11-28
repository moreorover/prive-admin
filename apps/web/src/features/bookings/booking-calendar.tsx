// components/booking-calendar.tsx
"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  name: string;
  startsAt: Date;
  clientId: string;
}

interface BookingCalendarProps {
  bookings: Booking[];
  currentMonth: Date; // Controlled from parent
  onMonthChange: (date: Date) => void;
}

export function BookingCalendar({
  bookings,
  currentMonth,
  onMonthChange,
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calculate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Get bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking) =>
      isSameDay(new Date(booking.startsAt), day),
    );
  };

  // Get bookings for selected date
  const selectedDayBookings = selectedDate
    ? getBookingsForDay(selectedDate)
    : [];

  // Navigation handlers
  const previousMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    onMonthChange(new Date());
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center font-medium text-muted-foreground text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const dayBookings = getBookingsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[100px] rounded-lg border p-2 text-left transition-colors hover:bg-accent",
                    !isCurrentMonth && "bg-muted/50 text-muted-foreground",
                    isToday && "border-primary",
                    isSelected && "bg-accent",
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 font-medium text-sm",
                      isToday && "text-primary",
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex flex-row truncate rounded bg-primary/10 px-1 text-xs space-x-2"
                      >
                        <div className="font-medium">
                          {format(new Date(booking.startsAt), "HH:mm")}
                        </div>
                        <div className="truncate">{booking.name}</div>
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-muted-foreground text-xs">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day details dialog */}
      <Dialog
        open={!!selectedDate}
        onOpenChange={(open) => !open && setSelectedDate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDayBookings.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No bookings for this day
              </div>
            ) : (
              selectedDayBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Time
                        </div>
                        <div className="font-medium">
                          {format(new Date(booking.startsAt), "HH:mm")}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Booking
                        </div>
                        <div className="font-medium">{booking.name}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Client ID
                        </div>
                        <div className="font-medium">{booking.clientId}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
