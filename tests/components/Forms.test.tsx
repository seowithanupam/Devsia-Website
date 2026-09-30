import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssociateForm } from "@/components/forms/AssociateForm";
import { EnquiryForm } from "@/components/forms/EnquiryForm";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("EnquiryForm", () => {
  it("shows required-field errors and does not send an empty form", async () => {
    render(<EnquiryForm />);
    await userEvent.click(screen.getByRole("button", { name: /send enquiry/i }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  it("has the hidden honeypot field, out of reach of keyboards and screen readers", () => {
    const { container } = render(<EnquiryForm />);
    const trap = container.querySelector('input[name="website_url"]') as HTMLInputElement;
    expect(trap).not.toBeNull();
    expect(trap.tabIndex).toBe(-1);
    expect(trap.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("prefills the compact form from the listing", () => {
    render(
      <EnquiryForm variant="compact" defaults={{ propertyTypes: ["Plot"], preferredLocation: "Diggi Road, Jaipur", budgetBand: "25-50l" }} />,
    );
    expect(screen.getByDisplayValue("Diggi Road, Jaipur")).toBeInTheDocument();
  });
});

describe("AssociateForm", () => {
  it("shows the WhatsApp error text from the original for a bad number", async () => {
    render(<AssociateForm />);
    await userEvent.type(screen.getByLabelText(/WhatsApp/i), "951753460");
    await userEvent.click(screen.getByRole("button", { name: /submit application/i }));
    expect(await screen.findByText("Enter a valid 10-digit WhatsApp number.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
