import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FilterPanel } from "@/components/property/FilterPanel";
import { EMPTY_QUERY, computeFacets } from "@/lib/services/property-filters";
import { mockProperties } from "@/lib/services/mock/properties";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const facets = computeFacets(mockProperties, EMPTY_QUERY);

describe("FilterPanel", () => {
  beforeEach(() => push.mockClear());

  it("lists locations and types with counts", () => {
    render(<FilterPanel query={{ locations: [], types: [] }} facets={facets} />);
    expect(screen.getByLabelText(/Ajmer Road/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Farmhouse/)).toBeInTheDocument();
  });

  it("navigates with the chosen location and keeps the URL shareable", async () => {
    render(<FilterPanel query={{ locations: [], types: ["plot"] }} facets={facets} />);
    await userEvent.click(screen.getByLabelText(/Diggi Road/));
    expect(push).toHaveBeenCalledWith("/properties?type=plot&location=Diggi+Road");
  });

  it("applies the budget", async () => {
    render(<FilterPanel query={{ locations: [], types: [] }} facets={facets} />);
    await userEvent.type(screen.getByLabelText(/Max/), "3500000");
    await userEvent.click(screen.getByRole("button", { name: "Apply budget" }));
    expect(push).toHaveBeenCalledWith("/properties?maxPrice=3500000");
  });

  it("shows Reset only when filters are active and clears them", async () => {
    const { rerender } = render(<FilterPanel query={{ locations: [], types: [] }} facets={facets} />);
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
    rerender(<FilterPanel query={{ locations: ["Diggi Road"], types: [] }} facets={facets} />);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(push).toHaveBeenCalledWith("/properties");
  });

  it("has a Show / Hide filters toggle for phones that reports its state", async () => {
    render(<FilterPanel query={{ locations: [], types: [] }} facets={facets} />);
    const toggle = screen.getByRole("button", { name: "Show filters" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Hide filters" })).toHaveAttribute("aria-expanded", "true");
  });

  it("counts active filters on the toggle", () => {
    render(<FilterPanel query={{ locations: ["Diggi Road"], types: ["plot"], maxPrice: 3_500_000 }} facets={facets} />);
    expect(screen.getByRole("button", { name: "Show filters (3)" })).toBeInTheDocument();
  });
});
