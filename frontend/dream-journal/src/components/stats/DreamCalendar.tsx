import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface DreamCalendarProps {
  dreamDates: string[]; // ISO date strings (e.g., '2024-06-13')
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export const DreamCalendar: React.FC<DreamCalendarProps> = ({ dreamDates }) => {
  // Parse as local date to avoid timezone issues
  const dreamDays = dreamDates.map((d) => {
    const [year, month, day] = d.split('-').map(Number);
    return new Date(year, month - 1, day);
  });

  // Add a dot below days with dreams
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const hasDream = dreamDays.some((d) => isSameDay(d, date));
      if (hasDream) {
        return (
          <div style={{ textAlign: 'center', marginTop: 2 }}>
            <span
              className="block w-3 h-3 rounded-full bg-blue-600 dark:bg-black mx-auto"
            ></span>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-medium mb-4">Dream Calendar</h3>
      <Calendar
        tileContent={tileContent}
        calendarType="gregory"
      />
      <div className="mt-2 text-sm text-gray-500">Blue dots indicate days you recorded a dream.</div>
    </div>
  );
}; 