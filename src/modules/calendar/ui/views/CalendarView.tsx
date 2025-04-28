'use client';

import {
  Badge,
  Box,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
  rem
} from '@mantine/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

// Types
interface Event {
  id: string;
  title: string;
  date: Date;
  color?: string;
  description?: string;
  time?: string;
}

// Helper functions
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
};

const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'long'
  });
};

// Helper to generate current month events
const getCurrentMonthEvents = (): Event[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Generate some sample events for the current month
  return [
    {
      id: '1',
      title: 'Team Meeting',
      date: new Date(currentYear, currentMonth, 12),
      color: 'blue',
      description: 'Quarterly planning session',
      time: '10:00 AM'
    },
    {
      id: '2',
      title: 'Product Launch',
      date: new Date(currentYear, currentMonth, 15),
      color: 'green',
      description: 'New feature release',
      time: '2:00 PM'
    },
    {
      id: '3',
      title: 'Client Presentation',
      date: new Date(currentYear, currentMonth, 18),
      color: 'red',
      description: 'Stakeholder review',
      time: '11:30 AM'
    },
    {
      id: '4',
      title: 'Workshop',
      date: new Date(currentYear, currentMonth, 22),
      color: 'grape',
      description: 'Design thinking session',
      time: '9:00 AM'
    },
    {
      id: '5',
      title: 'Conference Call',
      date: new Date(currentYear, currentMonth, 22),
      color: 'orange',
      description: 'Partner sync-up',
      time: '3:30 PM'
    },
    {
      id: '6',
      title: 'Deadline',
      date: new Date(currentYear, currentMonth, today.getDate()),
      color: 'cyan',
      description: 'Project submission',
      time: '5:00 PM'
    }
  ];
};

// Components
const CalendarHeader = ({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth 
}: { 
  currentDate: Date; 
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isMobile: boolean;
}) => {
  return (
    <Group justify="apart" mb="md" wrap="wrap">
      <Title order={3}>{formatMonthYear(currentDate)}</Title>
      <Group gap="xs">
        <UnstyledButton onClick={onPrevMonth}>
          <ChevronLeft size={20} />
        </UnstyledButton>
        <UnstyledButton onClick={onNextMonth}>
          <ChevronRight size={20} />
        </UnstyledButton>
      </Group>
    </Group>
  );
};

const WeekdayHeader = ({ weekdays }: { weekdays: string[] }) => {
  return (
    <Flex mb="sm">
      {weekdays.map(day => (
        <Box key={day} w="14.28%" p="xs">
          <Text fw={700} ta="center" size="sm">
            {day}
          </Text>
        </Box>
      ))}
    </Flex>
  );
};

const CalendarEventBadge = ({ 
  event, 
  isMobile = false,
  isTablet = false
}: { 
  event: Event; 
  isMobile?: boolean;
  isTablet?: boolean;
}) => {
  return (
    <Tooltip 
      label={`${event.title}${event.time ? ` - ${event.time}` : ''}\n${event.description || ''}`}
      position="bottom"
      withArrow
    >
      <Badge 
        color={event.color || 'blue'}
        style={{ cursor: 'pointer' }}
        fullWidth
        size="xs"
      >
        {isMobile || isTablet ? 
          (event.title.length > 6 ? `${event.title.substring(0, 5)}...` : event.title) :
          (event.title.length > 12 ? `${event.title.substring(0, 11)}...` : event.title)
        }
      </Badge>
    </Tooltip>
  );
};

const EventDot = ({ color = 'blue' }: { color?: string }) => {
  return (
    <Box 
      w={8}
      h={8}
      style={{ 
        borderRadius: '50%', 
        backgroundColor: `var(--mantine-color-${color}-filled)`
      }}
    />
  );
};

const DayCell = ({ 
  day, 
  month, 
  year, 
  events, 
  isTablet
}: { 
  day: number; 
  month: number; 
  year: number; 
  events: Event[];
  isTablet: boolean;
}) => {
  const isToday = new Date().getDate() === day && 
                  new Date().getMonth() === month && 
                  new Date().getFullYear() === year;
                  
  return (
    <Box w="14.28%" p={rem(4)}>
      <Paper 
        p={rem(8)}
        h={isTablet ? rem(80) : rem(120)}
        withBorder 
        style={{ 
          overflow: 'hidden',
          backgroundColor: isToday ? 'var(--mantine-color-blue-0)' : undefined
        }}
      >
        <Text fw={isToday ? 700 : 600} mb={5} size="sm">{day}</Text>
        <Stack gap={rem(4)}>
          {events.length > 0 && (
            <>
              {events.slice(0, isTablet ? 2 : 3).map(event => (
                <CalendarEventBadge 
                  key={event.id} 
                  event={event} 
                  isTablet={isTablet} 
                />
              ))}
              {events.length > (isTablet ? 2 : 3) && (
                <Text size="xs" ta="center" c="dimmed">+{events.length - (isTablet ? 2 : 3)} more</Text>
              )}
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

const EmptyCell = ({ index }: { index: number }) => {
  return <Box key={`empty-${index}`} w="14.28%" p={rem(8)} />;
};

const CalendarGrid = ({ 
  year, 
  month, 
  firstDayOfMonth,
  daysInMonth,
  events,
  isTablet
}: { 
  year: number; 
  month: number;
  firstDayOfMonth: number;
  daysInMonth: number;
  events: Event[];
  isTablet: boolean;
}) => {
  const days: JSX.Element[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<EmptyCell key={`empty-${i}`} index={i} />);
  }
  
  // Add cells for each day in the month
  for (let day = 1; day <= daysInMonth; day++) {
    // Find events for this day
    const dayEvents = events.filter(
      event => event.date.getDate() === day
    );
    
    days.push(
      <DayCell 
        key={`day-${day}`}
        day={day}
        month={month}
        year={year}
        events={dayEvents}
        isTablet={isTablet}
      />
    );
  }
  
  return <Flex wrap="wrap">{days}</Flex>;
};

const MobileEventItem = ({ event }: { event: Event }) => {
  return (
    <Group key={event.id} gap="xs">
      <EventDot color={event.color} />
      <Text size="sm">
        {event.title}
        {event.time && <Text component="span" size="xs" c="dimmed"> - {event.time}</Text>}
      </Text>
    </Group>
  );
};

const MobileDayCard = ({ 
  day, 
  month, 
  year, 
  events 
}: { 
  day: number; 
  month: number; 
  year: number; 
  events: Event[];
}) => {
  const date = new Date(year, month, day);
  const isToday = new Date().getDate() === day && 
                  new Date().getMonth() === month && 
                  new Date().getFullYear() === year;
  
  return (
    <Paper 
      p="sm" 
      withBorder 
      radius="md"
      style={{ 
        backgroundColor: isToday ? 'var(--mantine-color-blue-0)' : undefined 
      }}
    >
      <Text fw={700} mb="xs">{formatFullDate(date)}</Text>
      {events.length > 0 ? (
        <Stack gap="xs">
          {events.map(event => (
            <MobileEventItem key={event.id} event={event} />
          ))}
        </Stack>
      ) : (
        <Text c="dimmed" size="sm">No events</Text>
      )}
    </Paper>
  );
};

const MobileCalendarView = ({ 
  year, 
  month, 
  daysInMonth,
  events
}: { 
  year: number; 
  month: number;
  daysInMonth: number;
  events: Event[];
}) => {
  return (
    <Stack>
      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
        const dayEvents = events.filter(
          event => event.date.getDate() === day
        );
        
        return (
          <MobileDayCard 
            key={`mobile-day-${day}`}
            day={day}
            month={month}
            year={year}
            events={dayEvents}
          />
        );
      })}
    </Stack>
  );
};

// Main component
export default function MonthlyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  
  // Use CSS media query for responsive design
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  
  // Handling month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  // Get necessary calendar calculations
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get events for the current month
  const SAMPLE_EVENTS = getCurrentMonthEvents();
  const eventsThisMonth = SAMPLE_EVENTS.filter(event => 
    event.date.getMonth() === month && event.date.getFullYear() === year
  );
  
  return (
    <Box p={isMobile ? rem(8) : rem(16)}>
      <Paper p={isMobile ? rem(8) : rem(16)} withBorder radius="md">
        <CalendarHeader 
          currentDate={currentDate} 
          onPrevMonth={prevMonth} 
          onNextMonth={nextMonth}
          isMobile={isMobile}
        />
        
        {isMobile ? (
          <MobileCalendarView 
            year={year}
            month={month}
            daysInMonth={daysInMonth}
            events={eventsThisMonth}
          />
        ) : (
          <>
            <WeekdayHeader weekdays={weekdays} />
            <CalendarGrid 
              year={year}
              month={month}
              firstDayOfMonth={firstDayOfMonth}
              daysInMonth={daysInMonth}
              events={eventsThisMonth}
              isTablet={isTablet}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}