import React, { useMemo } from 'react';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { useCalendar } from '../../hooks/useCalendar.js';

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function isBetween(d, start, end) {
  if (!start || !end) return false;
  const t = startOfDay(d).getTime();
  return t > startOfDay(start).getTime() && t < startOfDay(end).getTime();
}

function buildCalendarDays(today, totalDays = 60) {
  const days = [];
  const start = startOfDay(today);
  for (let i = 0; i < totalDays; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function DateRangeCalendar() {
  const { today, checkInDate, checkOutDate, selectDate, quickToday, quickTomorrow, quickWeekend } = useCalendar();

  const days = useMemo(() => buildCalendarDays(today, 90), [today]);

  const grouped = useMemo(() => {
    const map = new Map();
    days.forEach((d) => {
      const y = d.getFullYear();
      const m = d.getMonth(); // 0-11
      const key = `${y}-${m}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    });
    return Array.from(map.entries()).map(([key, value]) => {
      const [y, m] = key.split('-').map((x) => Number(x));
      return { year: y, month: m, days: value };
    });
  }, [days]);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button variant="outlined" size="small" onClick={quickToday}>
          今天入住
        </Button>
        <Button variant="outlined" size="small" onClick={quickTomorrow}>
          明天入住
        </Button>
        <Button variant="outlined" size="small" onClick={quickWeekend}>
          本周周末
        </Button>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="body2" sx={{ mb: 1 }}>
        已选：{checkInDate ? startOfDay(checkInDate).toLocaleDateString() : '请选择入住日期'}
        {checkOutDate ? ` - ${startOfDay(checkOutDate).toLocaleDateString()}` : ''}
      </Typography>

      <Stack spacing={2} sx={{ maxHeight: 360, overflowY: 'auto', pr: 1 }}>
        {grouped.map(({ year, month, days: monthDays }) => (
          <Box key={`${year}-${month}`}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {year}年 {month + 1}月
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 0.5,
                mb: 1.5,
              }}
            >
              {monthDays.map((d) => {
                const disabled = startOfDay(d) < startOfDay(today);
                const isStart = isSameDay(d, checkInDate);
                const isEnd = isSameDay(d, checkOutDate);
                const inRange = isBetween(d, checkInDate, checkOutDate);

                let bg = '#0f172a0d';
                let color = 'text.primary';
                if (inRange) {
                  bg = 'primary.light';
                  color = '#fff';
                }
                if (isStart || isEnd) {
                  bg = 'primary.main';
                  color = '#fff';
                }

                return (
                  <Box
                    key={d.toISOString()}
                    onClick={() => {
                      if (disabled) return;
                      selectDate(d);
                    }}
                    sx={{
                      borderRadius: 999,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      bgcolor: disabled ? '#e5e7eb' : bg,
                      color: disabled ? 'text.disabled' : color,
                      userSelect: 'none',
                    }}
                  >
                    {d.getDate()}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

