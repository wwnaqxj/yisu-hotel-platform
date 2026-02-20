import React, { createContext, useContext, useMemo, useState } from 'react';

const SearchContext = createContext(null);

const defaultState = {
  city: '北京',
  keyword: '',
  checkInDate: null,
  checkOutDate: null,
  stars: [], // 选中的星级数组，如 [3,4]
  priceMin: 0,
  priceMax: 1000,
  tags: [], // 如 ['亲子酒店', '豪华']
};

export function SearchProvider({ children }) {
  const [state, setState] = useState(defaultState);

  const api = useMemo(
    () => ({
      state,
      setCity(city) {
        setState((s) => ({ ...s, city }));
      },
      setKeyword(keyword) {
        setState((s) => ({ ...s, keyword }));
      },
      setDates(checkInDate, checkOutDate) {
        setState((s) => ({ ...s, checkInDate, checkOutDate }));
      },
      setStars(stars) {
        setState((s) => ({ ...s, stars }));
      },
      setPriceRange(min, max) {
        setState((s) => ({ ...s, priceMin: min, priceMax: max }));
      },
      toggleTag(tag) {
        setState((s) =>
          s.tags.includes(tag)
            ? { ...s, tags: s.tags.filter((t) => t !== tag) }
            : { ...s, tags: [...s.tags, tag] }
        );
      },
      reset() {
        setState(defaultState);
      },
    }),
    [state]
  );

  return <SearchContext.Provider value={api}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return ctx;
}

