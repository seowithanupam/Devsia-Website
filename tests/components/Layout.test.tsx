import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, Container, Label, Section, SectionHeading, Skeleton } from "@/components/ui";

describe("Container", () => {
  it("renders children and merges class names", () => {
    render(<Container className="extra">Content</Container>);
    expect(screen.getByText("Content")).toHaveClass("container", "extra");
  });
});

describe("Section", () => {
  it("has no tone class by default", () => {
    render(<Section>Body</Section>);
    const section = screen.getByText("Body");
    expect(section.className).toBe("section");
  });

  it.each(["tint", "navy", "red"] as const)("applies the %s tone", (tone) => {
    render(<Section tone={tone}>Body</Section>);
    expect(screen.getByText("Body")).toHaveClass(tone);
  });

  it("applies fixed spacing variants", () => {
    render(<Section spacing="snug">Body</Section>);
    expect(screen.getByText("Body")).toHaveClass("snug");
  });
});

describe("SectionHeading", () => {
  it("renders label, title and description with an h2 by default", () => {
    render(<SectionHeading label="Highlights" title="Three best-value properties" description="Shortlisted by advisors." />);
    expect(screen.getByRole("heading", { level: 2, name: "Three best-value properties" })).toBeInTheDocument();
    expect(screen.getByText("Highlights")).toBeInTheDocument();
    expect(screen.getByText("Shortlisted by advisors.")).toBeInTheDocument();
  });

  it("supports other heading levels and omits empty parts", () => {
    render(<SectionHeading title="Only a title" as="h1" />);
    expect(screen.getByRole("heading", { level: 1, name: "Only a title" })).toBeInTheDocument();
  });

  it("colors the label for navy sections", () => {
    render(<SectionHeading label="Why DevSia" labelTone="onNavy" title="Four things" />);
    expect(screen.getByText("Why DevSia")).toHaveClass("label", "onNavy");
  });
});

describe("Label", () => {
  it("defaults to the faint tone", () => {
    render(<Label>Residential plot</Label>);
    expect(screen.getByText("Residential plot")).toHaveClass("label");
    expect(screen.getByText("Residential plot")).not.toHaveClass("red");
  });
});

describe("Badge", () => {
  it.each(["navy", "tint", "ok", "red", "gold", "outline"] as const)("applies the %s tone", (tone) => {
    render(<Badge tone={tone}>Tag</Badge>);
    expect(screen.getByText("Tag")).toHaveClass("badge", tone);
  });
});

describe("Skeleton", () => {
  it("is hidden from assistive technology and sized by props", () => {
    const { container } = render(<Skeleton width={120} height={20} />);
    const block = container.firstElementChild as HTMLElement;
    expect(block).toHaveAttribute("aria-hidden", "true");
    expect(block.style.width).toBe("120px");
    expect(block.style.height).toBe("20px");
  });
});
