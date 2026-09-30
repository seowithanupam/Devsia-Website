"use client";

import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import type { AppDispatch, RootState } from "./index";
import { remove, toggle } from "./wishlistSlice";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/** Wishlist access for components. */
export function useWishlist() {
  const dispatch = useAppDispatch();
  const slugs = useAppSelector((state) => state.wishlist.slugs);
  const hydrated = useAppSelector((state) => state.wishlist.hydrated);
  return {
    slugs,
    hydrated,
    has: (slug: string) => slugs.includes(slug),
    toggle: useCallback((slug: string) => dispatch(toggle(slug)), [dispatch]),
    remove: useCallback((slug: string) => dispatch(remove(slug)), [dispatch]),
  };
}
