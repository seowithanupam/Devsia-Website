"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./index";
import { loadWishlist, saveWishlist } from "./persistence";
import { hydrate } from "./wishlistSlice";

/**
 * Creates one store per browser session, reads the saved wishlist after the first render
 * (so server and client markup match), and writes changes back to localStorage.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  useEffect(() => {
    store.dispatch(hydrate(loadWishlist()));
    let last = store.getState().wishlist.slugs;
    return store.subscribe(() => {
      const state = store.getState().wishlist;
      if (state.hydrated && state.slugs !== last) {
        last = state.slugs;
        saveWishlist(state.slugs);
      }
    });
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
