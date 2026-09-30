import { describe, expect, it } from "vitest";
import { makeStore } from "@/store";
import { clear, hydrate, remove, toggle } from "@/store/wishlistSlice";

describe("wishlist slice", () => {
  it("toggles a slug on and off", () => {
    const store = makeStore();
    store.dispatch(toggle("a"));
    expect(store.getState().wishlist.slugs).toEqual(["a"]);
    store.dispatch(toggle("a"));
    expect(store.getState().wishlist.slugs).toEqual([]);
  });
  it("merges saved slugs on hydrate without losing early clicks", () => {
    const store = makeStore();
    store.dispatch(toggle("early"));
    store.dispatch(hydrate(["saved", "early"]));
    const { slugs, hydrated } = store.getState().wishlist;
    expect([...slugs].sort()).toEqual(["early", "saved"]);
    expect(hydrated).toBe(true);
  });
  it("removes and clears", () => {
    const store = makeStore();
    store.dispatch(hydrate(["a", "b"]));
    store.dispatch(remove("a"));
    expect(store.getState().wishlist.slugs).toEqual(["b"]);
    store.dispatch(clear());
    expect(store.getState().wishlist.slugs).toEqual([]);
  });
});
