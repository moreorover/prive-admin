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
  rem,
} from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
import dayjs, { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

// Types
interface Event {
  id: string;
  title: string;
  date: Dayjs;
  color?: string;
  description?: string;
  time?: string;
}

// Helper functions
const getDaysInMonth = (date: Dayjs): number => {
  return date.daysInMonth();
};

const getFirstDayOfMonth = (date: Dayjs): number => {
  return date.startOf('month').day();
};

const formatMonthYear = (date: Dayjs): string => {
  return date.format('MMMM YYYY');
};

const formatFullDate = (date: Dayjs): string => {
  return date.format('dddd, MMMM D');
};

// Helper to generate current month events
const getCurrentMonthEvents = (): Event[] => {  
  // Generate some sample events for the current month
  return [
    {
      id: '1',
      title: 'Team Meeting',
      date: dayjs().date(12).hour(10).minute(0),
      color: 'blue',
      description: 'Quarterly planning session',
      time: '10:00 AM'
    },
    {
      id: '2',
      title: 'Product Launch',
      date: dayjs().date(15).hour(14).minute(0),
      color: 'green',
      description: 'New feature release',
      time: '2:00 PM'
    },
    {
      id: '3',
      title: 'Client Presentation',
      date: dayjs().date(18).hour(11).minute(30),
      color: 'red',
      description: 'Stakeholder review',
      time: '11:30 AM'
    },
    {
      id: '4',
      title: 'Workshop',
      date: dayjs().date(22).hour(9).minute(0),
      color: 'grape',
      description: 'Design thinking session',
      time: '9:00 AM'
    },
    {
      id: '5',
      title: 'Conference Call',
      date: dayjs().date(22).hour(15).minute(30),
      color: 'orange',
      description: 'Partner sync-up',
      time: '3:30 PM'
    },
    {
      id: '6',
      title: 'Deadline',
      date: dayjs().hour(17).minute(0),
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
  currentDate: Dayjs; 
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
  date, 
  events, 
  isTablet
}: { 
  date: Dayjs; 
  events: Event[];
  isTablet: boolean;
}) => {
  const isToday = dayjs().isSame(date, 'day');
  const day = date.date();
                  
  return (
    <Box w="14.28%">
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
  currentDate,
  events,
  isTablet
}: { 
  currentDate: Dayjs;
  events: Event[];
  isTablet: boolean;
}) => {
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const daysInMonth = getDaysInMonth(currentDate);
  const days: JSX.Element[]= [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<EmptyCell key={`empty-${i}`} index={i} />);
  }
  
  // Add cells for each day in the month
  for (let day = 1; day <= daysInMonth; day++) {
    // Create date for this day
    const date = currentDate.date(day);
    
    // Find events for this day
    const dayEvents = events.filter(
      event => event.date.date() === day
    );
    
    days.push(
      <DayCell 
        key={`day-${day}`}
        date={date}
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
  date, 
  events 
}: { 
  date: Dayjs; 
  events: Event[];
}) => {
  const isToday = dayjs().isSame(date, 'day');
  
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
  currentDate,
  events
}: { 
  currentDate: Dayjs;
  events: Event[];
}) => {
  const daysInMonth = getDaysInMonth(currentDate);
  
  return (
    <Stack>
      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
        const date = currentDate.date(day);
        const dayEvents = events.filter(
          event => event.date.date() === day
        );
        
        return (
          <MobileDayCard 
            key={`mobile-day-${day}`}
            date={date}
            events={dayEvents}
          />
        );
      })}
    </Stack>
  );
};

// Main component
export default function MonthlyCalendar() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const { width } = useViewportSize();
  
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  
  // Handling month navigation
  const prevMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };
  
  const nextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };
  
  // Get necessary calendar calculations
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get events for the current month
  const SAMPLE_EVENTS = getCurrentMonthEvents();
  const eventsThisMonth = SAMPLE_EVENTS.filter(event => 
    event.date.month() === currentDate.month() && 
    event.date.year() === currentDate.year()
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
            currentDate={currentDate}
            events={eventsThisMonth}
          />
        ) : (
          <>
            <WeekdayHeader weekdays={weekdays} />
            <CalendarGrid 
              currentDate={currentDate}
              events={eventsThisMonth}
              isTablet={isTablet}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}