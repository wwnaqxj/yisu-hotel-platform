import { useMemo } from 'react';
import { useSearch } from '../context/SearchContext.jsx';

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function useCalendar() {
  const {
    state: { checkInDate, checkOutDate },
    setDates,
  } = useSearch();

  const today = useMemo(() => startOfDay(new Date()), []);

  function selectDate(date) {
    const day = startOfDay(date);

    if (!checkInDate || (checkInDate && checkOutDate)) {
      setDates(day, null);
      return;
    }

    const inDay = startOfDay(checkInDate);
    if (day <= inDay) {
      setDates(day, inDay);
    } else {
      setDates(inDay, day);
    }
  }

  function quickToday() {
    const inDay = today;
    const outDay = addDays(today, 1);
    setDates(inDay, outDay);
  }

  function quickTomorrow() {
    const inDay = addDays(today, 1);
    const outDay = addDays(today, 2);
    setDates(inDay, outDay);
  }

  function quickWeekend() {
    const day = today.getDay(); // 0-6, 周日=0
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    const checkIn = addDays(today, daysUntilSat - 1); // 周五
    const checkOut = addDays(checkIn, 2); // 周日退房
    setDates(startOfDay(checkIn), startOfDay(checkOut));
  }

  return {
    today,
    checkInDate,
    checkOutDate,
    selectDate,
    quickToday,
    quickTomorrow,
    quickWeekend,
  };
}

