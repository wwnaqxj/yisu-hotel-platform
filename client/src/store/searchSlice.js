import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  city: '',
  keyword: '',
  checkIn: '',
  checkOut: '',
  tags: [],
  filters: {
    star: '',
    priceRange: '',
  },
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearch(state, action) {
      return { ...state, ...action.payload };
    },
    resetSearch() {
      return initialState;
    },
  },
});

export const { setSearch, resetSearch } = searchSlice.actions;
export default searchSlice.reducer;
