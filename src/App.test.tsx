import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the main application layout", () => {
    render(<App />);

    // Assuming MainLayout renders a <main> element or an element with role="main"
    // If this fails, we might need to inspect MainLayout's structure
    const mainElement = screen.getByRole("main");
    expect(mainElement).toBeInTheDocument();
  });
});
