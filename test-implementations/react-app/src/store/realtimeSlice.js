import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  data: [],
  transformations: [],
  status: 'idle'
};

const realtimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    updateData: (state, action) => {
      state.data = action.payload;
    },
    transformData: (state) => {
      state.transformations = [...state.transformations, Date.now()];
    },
    clearTransformations: (state) => {
      state.transformations = [];
    }
  }
});

export const { updateData, transformData, clearTransformations } = realtimeSlice.actions;
export default realtimeSlice.reducer;
