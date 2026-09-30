import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { PropertyCard, cardSpecs, whatsappLinkFor } from "@/components/property/PropertyCard";
import { mockProperties } from "@/lib/services/mock/properties";
import { makeStore } from "@/store";
import { hydrate } from "@/store/wishlistSlice";

function renderCard() {
  const store = makeStore();
  store.dispatch(hydrate([]));
  const property = mockProperties[0];
  render(
    <Provider store={store}>
      <PropertyCard property={property} />
    </Provider>,
  );
  return { store, property };
}

describe("PropertyCard", () => {
  it("shows the reference code, type, location, title and price", () => {
    const { property } = renderCard();
    expect(screen.getByText(property.referenceCode)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: property.title })).toBeInTheDocument();
    expect(screen.getByText("₹26.4 L")).toBeInTheDocument();
  });

  it("links to the detail page and its enquiry form", () => {
    const { property } = renderCard();
    expect(screen.getByRole("link", { name: "View details" })).toHaveAttribute("href", `/properties/${property.slug}`);
    expect(screen.getByRole("link", { name: "Enquire" })).toHaveAttribute("href", `/properties/${property.slug}#enquire`);
  });

  it("saves and removes the listing from the wishlist", async () => {
    const { store, property } = renderCard();
    const button = screen.getByRole("button", { name: /save .* to wishlist/i });
    await userEvent.click(button);
    expect(store.getState().wishlist.slugs).toEqual([property.slug]);
    expect(screen.getByRole("button", { name: /remove .* from wishlist/i })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: /remove .* from wishlist/i }));
    expect(store.getState().wishlist.slugs).toEqual([]);
  });

  it("builds at most two spec cells and a WhatsApp link", () => {
    const property = mockProperties[0];
    expect(cardSpecs(property).length).toBeLessThanOrEqual(2);
    expect(whatsappLinkFor(property)).toContain("https://wa.me/");
  });
});
