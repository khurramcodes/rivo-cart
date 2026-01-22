import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import addressReducer from "./slices/addressSlice";
import loadingReducer from "./slices/loadingSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  addresses: addressReducer,
  loading: loadingReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


