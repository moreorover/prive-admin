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

// Sample event data - in a real app, this would come from an API or database
interface Event {
  id: string;
  title: string;
  date: Date;
  color?: string;
  description?: string;
  time?: string;
}

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

const SAMPLE_EVENTS: Event[] = getCurrentMonthEvents();

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

export default function MonthlyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  
  // Use CSS media query for responsive design
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

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
  
  // Filter events for the current month
  const eventsThisMonth = SAMPLE_EVENTS.filter(event => 
    event.date.getMonth() === month && event.date.getFullYear() === year
  );
  
  // Generate calendar grid
  const generateCalendarGrid = () => {
    const days: React.JSX.Element[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<Box key={`empty-${i}`} w="14.28%" p={{ base: 'xs', md: 'md' }} display={{ base: firstDayOfMonth > 3 ? 'none' : 'block', sm: 'block' }} />);
    }
    
    // Add cells for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Find events for this day
      const dayDate = new Date(year, month, day);
      const dayEvents = eventsThisMonth.filter(
        event => event.date.getDate() === day
      );
      
      const isToday = new Date().getDate() === day && 
                       new Date().getMonth() === month && 
                       new Date().getFullYear() === year;
      
      days.push(
        <Box key={`day-${day}`} w={{ base: '25%', sm: '14.28%' }} p={{ base: 'xxs', sm: 'xs' }}>
          <Paper 
            p={{ base: 'xxs', sm: 'xs' }}
            h={{ base: 80, sm: 100, md: 120 }}
            withBorder 
            style={{ 
              overflow: 'hidden',
              backgroundColor: isToday ? 'var(--mantine-color-blue-light)' : undefined
            }}
          >
            <Text fw={isToday ? 700 : 600} mb={5} size="sm">{day}</Text>
            <Stack gap="sm">
              {dayEvents.length > 0 && (
                <>
                  {/* Mobile view - just show indicator dots */}
                  <Group gap={4} display={{ base: 'flex', sm: 'none' }}>
                    {dayEvents.map(event => (
                      <Box 
                        key={event.id}
                        w={8}
                        h={8}
                        style={{ 
                          borderRadius: '50%', 
                          backgroundColor: `var(--mantine-color-${event.color || 'blue'}-filled)`
                        }}
                      />
                    ))}
                  </Group>
                  
                  {/* Tablet and desktop view - show full badges */}
                  <Box display={{ base: 'none', sm: 'block' }}>
                    {dayEvents.map(event => (
                      <Tooltip 
                        key={event.id} 
                        label={event.description || event.title}
                        position="bottom"
                        withArrow
                      >
                        <Badge 
                          color={event.color || 'blue'}
                          style={{ cursor: 'pointer' }}
                          fullWidth
                          size="xs"
                          mb={2}
                        >
                          {event.title.length > 10 
                            ? `${event.title.substring(0, 9)}...` 
                            : event.title}
                        </Badge>
                      </Tooltip>
                    ))}
                  </Box>
                </>
              )}
            </Stack>
          </Paper>
        </Box>
      );
    }
    
    return days;
  };
  
  return (
    <Box p={isMobile ? rem(8) : rem(16)}>
      <Paper p={isMobile ? rem(8) : rem(16)} withBorder radius="md">
        {/* Calendar Header */}
        <Group justify="apart" mb="md" wrap="wrap">
          <Title order={isMobile ? 3 : 2}>{formatMonthYear(currentDate)}</Title>
          <Group gap="xs">
            <UnstyledButton onClick={prevMonth}>
              <ChevronLeft size={20} />
            </UnstyledButton>
            <UnstyledButton onClick={nextMonth}>
              <ChevronRight size={20} />
            </UnstyledButton>
          </Group>
        </Group>
        
        {/* Mobile View - Single column list */}
        {isMobile ? (
          <Stack>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const date = new Date(year, month, day);
              const dayEvents = eventsThisMonth.filter(
                event => event.date.getDate() === day
              );
              const isToday = new Date().getDate() === day && 
                             new Date().getMonth() === month && 
                             new Date().getFullYear() === year;
              
              return (
                <Paper 
                  key={`mobile-day-${day}`} 
                  p="sm" 
                  withBorder 
                  radius="md"
                  style={{ 
                    backgroundColor: isToday ? 'var(--mantine-color-blue-0)' : undefined 
                  }}
                >
                  <Text fw={700} mb="xs">{formatFullDate(date)}</Text>
                  {dayEvents.length > 0 ? (
                    <Stack gap="xs">
                      {dayEvents.map(event => (
                        <Group key={event.id} gap="xs">
                          <Box 
                            w={12}
                            h={12}
                            style={{ 
                              borderRadius: '50%', 
                              backgroundColor: `var(--mantine-color-${event.color || 'blue'}-filled)`
                            }}
                          />
                          <Text size="sm">
                            {event.title}
                            {event.time && <Text component="span" size="xs" c="dimmed"> - {event.time}</Text>}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  ) : (
                    <Text c="dimmed" size="sm">No events</Text>
                  )}
                </Paper>
              );
            })}
          </Stack>
        ) : (
          // Desktop View - Calendar Grid
          <>
            {/* Weekday Headers */}
            <Flex mb="sm">
              {weekdays.map(day => (
                <Box key={day} w="14.28%" p="xs">
                  <Text fw={700} ta="center" size="sm">
                    {day}
                  </Text>
                </Box>
              ))}
            </Flex>
            
            {/* Calendar Grid */}
            <Flex wrap="wrap">
              {generateCalendarGrid()}
            </Flex>
          </>
        )}
      </Paper>
    </Box>
  );
}