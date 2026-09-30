import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "@/components/ui";

describe("Button", () => {
  it("renders a button that is type=button by default", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("btn", "primary");
  });

  it("supports type=submit for forms", () => {
    render(<Button type="submit">Send enquiry</Button>);
    expect(screen.getByRole("button", { name: "Send enquiry" })).toHaveAttribute("type", "submit");
  });

  it.each(["primary", "red", "outline", "ghost", "onRed"] as const)("applies the %s variant", (variant) => {
    render(<Button variant={variant}>Go</Button>);
    expect(screen.getByRole("button")).toHaveClass(variant);
  });

  it("applies size and width classes", () => {
    render(
      <Button size="sm" fullWidth>
        Small
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("sm", "fullWidth");
  });

  it("is disabled and busy while loading", () => {
    render(<Button loading>Sending…</Button>);
    const button = screen.getByRole("button", { name: "Sending…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("is not busy when idle", () => {
    render(<Button>Idle</Button>);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-busy");
  });

  it("respects the disabled prop", () => {
    render(<Button disabled>Off</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("ButtonLink", () => {
  it("renders an anchor with the given href and button styling", () => {
    render(
      <ButtonLink href="/enquire" variant="outline">
        Post your enquiry
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "Post your enquiry" });
    expect(link).toHaveAttribute("href", "/enquire");
    expect(link).toHaveClass("btn", "outline");
  });

  it("supports tel: links", () => {
    render(<ButtonLink href="tel:+911414000900">Call</ButtonLink>);
    expect(screen.getByRole("link", { name: "Call" })).toHaveAttribute("href", "tel:+911414000900");
  });
});
