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
  UnstyledButton
} from '@mantine/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';


// Sample event data - in a real app, this would come from an API or database
interface Event {
  id: string;
  title: string;
  date: Date;
  color?: string;
  description?: string;
}

const SAMPLE_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    date: new Date(2025, 3, 12), // April 12, 2025
    color: 'blue',
    description: 'Quarterly planning session'
  },
  {
    id: '2',
    title: 'Product Launch',
    date: new Date(2025, 3, 15), // April 15, 2025
    color: 'green',
    description: 'New feature release'
  },
  {
    id: '3',
    title: 'Client Presentation',
    date: new Date(2025, 3, 18), // April 18, 2025
    color: 'red',
    description: 'Stakeholder review'
  },
  {
    id: '4',
    title: 'Workshop',
    date: new Date(2025, 3, 22), // April 22, 2025
    color: 'grape',
    description: 'Design thinking session'
  },
  {
    id: '5',
    title: 'Conference Call',
    date: new Date(2025, 3, 22), // April 22, 2025 (same day as Workshop)
    color: 'orange',
    description: 'Partner sync-up'
  }
];

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

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  
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
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<Box key={`empty-${i}`} w="14.28%" p="md" />);
    }
    
    // Add cells for each day in the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Find events for this day
      const dayDate = new Date(year, month, day);
      const dayEvents = eventsThisMonth.filter(
        event => event.date.getDate() === day
      );
      
      days.push(
        <Box key={`day-${day}`} w="14.28%" p="xs">
          <Paper 
            p="xs" 
            h={120} 
            withBorder 
            style={{ overflow: 'hidden' }}
          >
            <Text fw={600} mb={5}>{day}</Text>
            <Stack spacing={5}>
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
                  >
                    {event.title}
                  </Badge>
                </Tooltip>
              ))}
            </Stack>
          </Paper>
        </Box>
      );
    }
    
    return days;
  };
  
  return (
    <Box p="xl">
      <Paper p="lg" withBorder radius="md">
        {/* Calendar Header */}
        <Group justify="apart" mb="md">
          <Title order={2}>{formatMonthYear(currentDate)}</Title>
          <Group gap="xs">
            <UnstyledButton onClick={prevMonth}>
              <ChevronLeft size={20} />
            </UnstyledButton>
            <UnstyledButton onClick={nextMonth}>
              <ChevronRight size={20} />
            </UnstyledButton>
          </Group>
        </Group>
        
        {/* Weekday Headers */}
        <Flex mb="sm">
          {weekdays.map(day => (
            <Box key={day} w="14.28%" p="xs">
              <Text fw={700} ta="center">{day}</Text>
            </Box>
          ))}
        </Flex>
        
        {/* Calendar Grid */}
        <Flex wrap="wrap">
          {generateCalendarGrid()}
        </Flex>
      </Paper>
    </Box>
  );
}