import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox, SelectField, TextField } from "@/components/ui";

describe("TextField", () => {
  it("associates the label with the input", () => {
    render(<TextField label="Full name" />);
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });

  it("marks required fields with an asterisk and the required attribute", () => {
    render(<TextField label="Mobile number" required />);
    const input = screen.getByLabelText(/Mobile number/);
    expect(input).toBeRequired();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not mark optional fields as required", () => {
    render(<TextField label="Email" />);
    expect(screen.getByLabelText("Email")).not.toBeRequired();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("links a hint with aria-describedby", () => {
    render(<TextField label="WhatsApp number" hint="Leave blank to use your mobile number" />);
    const input = screen.getByLabelText("WhatsApp number");
    const hint = screen.getByText("Leave blank to use your mobile number");
    expect(input.getAttribute("aria-describedby")).toBe(hint.id);
  });

  it("announces errors and marks the input invalid", () => {
    render(<TextField label="Preferred location" error="Enter at least one area." />);
    const input = screen.getByLabelText("Preferred location");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter at least one area.");
    expect(input.getAttribute("aria-describedby")).toContain(screen.getByRole("alert").id);
  });

  it("is not invalid without an error", () => {
    render(<TextField label="City" />);
    expect(screen.getByLabelText("City")).not.toHaveAttribute("aria-invalid");
  });

  it("passes input attributes through", () => {
    render(<TextField label="Mobile" inputMode="tel" placeholder="+91 98765 43210" />);
    const input = screen.getByLabelText("Mobile");
    expect(input).toHaveAttribute("inputmode", "tel");
    expect(input).toHaveAttribute("placeholder", "+91 98765 43210");
  });
});

describe("SelectField", () => {
  it("renders a labelled select with its options", () => {
    render(
      <SelectField label="Purpose" required>
        <option value="">Select</option>
        <option>Self Use</option>
      </SelectField>,
    );
    const select = screen.getByLabelText(/Purpose/);
    expect(select).toBeRequired();
    expect(screen.getByRole("option", { name: "Self Use" })).toBeInTheDocument();
  });

  it("announces errors", () => {
    render(
      <SelectField label="Budget" error="Choose a budget.">
        <option>Under ₹25L</option>
      </SelectField>,
    );
    expect(screen.getByLabelText("Budget")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a budget.");
  });
});

describe("Checkbox", () => {
  it("toggles through its label", () => {
    render(<Checkbox label="I agree to be contacted" />);
    const box = screen.getByLabelText("I agree to be contacted");
    expect(box).toHaveAttribute("type", "checkbox");
    expect(box).not.toBeChecked();
  });

  it("marks a required checkbox", () => {
    render(<Checkbox label="I accept the privacy policy" required />);
    expect(screen.getByLabelText(/I accept the privacy policy/)).toBeRequired();
  });

  it("announces errors", () => {
    render(<Checkbox label="Consent" error="Please confirm to continue." />);
    expect(screen.getByLabelText("Consent")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Please confirm to continue.");
  });
});
