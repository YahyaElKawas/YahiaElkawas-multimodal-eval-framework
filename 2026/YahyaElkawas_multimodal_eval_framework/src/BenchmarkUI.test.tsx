import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import BenchmarkUI from "./App";

class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    // Staggered simulate streaming so React state batching doesn't skip renders
    setTimeout(() => {
      this.onmessage?.({
        data: JSON.stringify({
          type: "text",
          content: "Initializing agent pipeline...",
        }),
      } as MessageEvent);
    }, 10);

    setTimeout(() => {
      this.onmessage?.({
        data: JSON.stringify({
          type: "metric",
          label: "Accuracy",
          content: "98%",
        }),
      } as MessageEvent);
    }, 30);

    setTimeout(() => {
      this.onmessage?.({
        data: JSON.stringify({
          type: "result",
          content: "Evaluation Complete",
          score: 0.95,
        }),
      } as MessageEvent);
    }, 50);
  }

  close() {}
}

globalThis.EventSource = MockEventSource as any;

describe("BenchmarkUI Component", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders start button", () => {
    render(<BenchmarkUI />);
    expect(screen.getByText("Start Evaluation")).toBeDefined();
  });

  it("changes to running state when clicked", () => {
    render(<BenchmarkUI />);
    fireEvent.click(screen.getByText("Start Evaluation"));

    expect(screen.getByText("Running...")).toBeDefined();
  });

  it("renders streamed text step", async () => {
    render(<BenchmarkUI />);
    fireEvent.click(screen.getByText("Start Evaluation"));

    await waitFor(() => {
      expect(screen.getByText(/Initializing agent pipeline/i)).toBeDefined();
    });
  });

  it("renders metric block correctly", async () => {
    render(<BenchmarkUI />);
    fireEvent.click(screen.getByText("Start Evaluation"));

    await waitFor(() => {
      const accuracyElements = screen.getAllByText("Accuracy");
      expect(accuracyElements.length).toBeGreaterThan(0);

      expect(screen.getByText("98%")).toBeDefined();
    });
  });

  it("renders final result with confidence", async () => {
    render(<BenchmarkUI />);
    fireEvent.click(screen.getByText("Start Evaluation"));

    await waitFor(() => {
      expect(screen.getByText(/Evaluation Complete/i)).toBeDefined();
      expect(screen.getByText(/Confidence/i)).toBeDefined();
    });
  });

  it("handles SSE failure gracefully", async () => {
    class ErrorEventSource {
      onmessage: any = null;
      onerror: any = null;

      constructor() {
        setTimeout(() => {
          this.onerror?.();
        }, 50);
      }

      close() {}
    }

    globalThis.EventSource = ErrorEventSource as any;

    render(<BenchmarkUI />);
    fireEvent.click(screen.getByText("Start Evaluation"));

    await waitFor(() => {
      expect(screen.getByText("Start Evaluation")).toBeDefined();
    });
  });
});
