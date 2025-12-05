'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
}

interface RecurrenceSelectorProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

const dayNames = [
  { value: 0, label: 'D', fullLabel: 'Domingo' },
  { value: 1, label: 'L', fullLabel: 'Lunes' },
  { value: 2, label: 'M', fullLabel: 'Martes' },
  { value: 3, label: 'X', fullLabel: 'Miércoles' },
  { value: 4, label: 'J', fullLabel: 'Jueves' },
  { value: 5, label: 'V', fullLabel: 'Viernes' },
  { value: 6, label: 'S', fullLabel: 'Sábado' },
];

export function RecurrenceSelector({ value, onChange }: RecurrenceSelectorProps) {
  const [frequency, setFrequency] = useState<RecurrenceRule['frequency']>(
    value?.frequency || 'daily'
  );
  const [interval, setInterval] = useState(value?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(value?.daysOfWeek || [1, 2, 3, 4, 5]);
  const [dayOfMonth, setDayOfMonth] = useState(value?.dayOfMonth || 1);
  const [endDate, setEndDate] = useState(value?.endDate || '');

  useEffect(() => {
    const rule: RecurrenceRule = {
      frequency,
      interval,
    };

    if (frequency === 'weekly') {
      rule.daysOfWeek = daysOfWeek;
    }

    if (frequency === 'monthly') {
      rule.dayOfMonth = dayOfMonth;
    }

    if (endDate) {
      rule.endDate = endDate;
    }

    onChange(rule);
  }, [frequency, interval, daysOfWeek, dayOfMonth, endDate, onChange]);

  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort((a, b) => a - b));
    }
  };

  const getDescription = () => {
    switch (frequency) {
      case 'daily':
        if (interval === 1) return 'Se repite todos los días';
        return `Se repite cada ${interval} días`;

      case 'weekly':
        const selectedDays = daysOfWeek.map((d) => dayNames[d].fullLabel).join(', ');
        if (interval === 1) return `Se repite cada semana: ${selectedDays}`;
        return `Se repite cada ${interval} semanas: ${selectedDays}`;

      case 'monthly':
        if (interval === 1) return `Se repite cada mes el día ${dayOfMonth}`;
        return `Se repite cada ${interval} meses el día ${dayOfMonth}`;
    }
  };

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      {/* Frequency selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Frecuencia</Label>
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as RecurrenceRule['frequency'])}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diaria</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm">Cada</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="number"
              min={1}
              max={99}
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">
              {frequency === 'daily' && (interval === 1 ? 'día' : 'días')}
              {frequency === 'weekly' && (interval === 1 ? 'semana' : 'semanas')}
              {frequency === 'monthly' && (interval === 1 ? 'mes' : 'meses')}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly: Day selection */}
      {frequency === 'weekly' && (
        <div>
          <Label className="text-sm">Días de la semana</Label>
          <div className="flex gap-1 mt-2">
            {dayNames.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={cn(
                  'w-9 h-9 rounded-full text-sm font-medium transition-colors',
                  daysOfWeek.includes(day.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
                title={day.fullLabel}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly: Day of month */}
      {frequency === 'monthly' && (
        <div>
          <Label className="text-sm">Día del mes</Label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">El día</span>
            <Input
              type="number"
              min={1}
              max={31}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">de cada mes</span>
          </div>
        </div>
      )}

      {/* End date */}
      <div>
        <Label className="text-sm">Fecha de fin (opcional)</Label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="mt-1 w-48"
        />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground bg-background px-3 py-2 rounded">
        {getDescription()}
      </p>
    </div>
  );
}
