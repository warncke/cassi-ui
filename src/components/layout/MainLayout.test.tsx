import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MainLayout from "./MainLayout";

// Mock the Toolbar component
vi.mock("./Toolbar", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-toolbar">Mock Toolbar</div>,
}));

describe("MainLayout", () => {
  it("renders children and the toolbar", () => {
    const childText = "Test Child Content";
    render(
      <MainLayout>
        <div>{childText}</div>
      </MainLayout>
    );

    // Check for children
    expect(screen.getByText(childText)).toBeInTheDocument();

    // Check for the mocked toolbar
    expect(screen.getByTestId("mock-toolbar")).toBeInTheDocument();
    expect(screen.getByText("Mock Toolbar")).toBeInTheDocument();

    // Check for the main element role (as used in App.test.tsx)
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("applies the correct layout classes", () => {
    render(<MainLayout>Child</MainLayout>);
    const layoutDiv = screen.getByRole("main").parentElement; // Get the top-level div
    expect(layoutDiv).toHaveClass(
      "flex",
      "flex-col",
      "h-screen",
      "bg-gray-900",
      "text-white"
    );
    expect(screen.getByRole("main")).toHaveClass(
      "flex-grow",
      "overflow-hidden"
    );
  });
});
