import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Wishlist state. The handover says the wishlist is Redux plus localStorage with nothing
 * saved server-side. Only slugs are stored; property details are fetched when the
 * wishlist page opens.
 */
export type WishlistState = {
  slugs: string[];
  /** False until localStorage has been read in the browser. */
  hydrated: boolean;
};

export const initialWishlistState: WishlistState = { slugs: [], hydrated: false };

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: initialWishlistState,
  reducers: {
    hydrate(state, action: PayloadAction<string[]>) {
      // Keep anything saved before hydration finished, then add what was in storage.
      const merged = new Set<string>([...action.payload, ...state.slugs]);
      state.slugs = [...merged];
      state.hydrated = true;
    },
    toggle(state, action: PayloadAction<string>) {
      const slug = action.payload;
      state.slugs = state.slugs.includes(slug) ? state.slugs.filter((s) => s !== slug) : [...state.slugs, slug];
    },
    remove(state, action: PayloadAction<string>) {
      state.slugs = state.slugs.filter((s) => s !== action.payload);
    },
    clear(state) {
      state.slugs = [];
    },
  },
});

export const { hydrate, toggle, remove, clear } = wishlistSlice.actions;
export const wishlistReducer = wishlistSlice.reducer;
