import { store } from "./store";
import { startLoading, stopLoading } from "./slices/loadingSlice";

export function beginLoading(key?: string) {
  store.dispatch(startLoading({ key }));
}

export function endLoading(key?: string) {
  store.dispatch(stopLoading({ key }));
}
