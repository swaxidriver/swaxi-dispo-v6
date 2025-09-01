import {
  generateErrorId,
  createErrorPayload,
  copyErrorDiagnostics,
  sendErrorToServer,
} from "../../ui/error-boundaries";

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(),
};
Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock fetch
globalThis.fetch = jest.fn();

describe("error-boundaries utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateErrorId", () => {
    it("generates unique error IDs with correct format", () => {
      const id1 = generateErrorId();
      const id2 = generateErrorId();

      expect(id1).toMatch(/^ERR-[A-F0-9]{8}$/);
      expect(id2).toMatch(/^ERR-[A-F0-9]{8}$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe("createErrorPayload", () => {
    it("creates enhanced error payload with diagnostics", () => {
      const error = new Error("Test error");
      const info = { componentStack: "Test component stack" };
      const errorId = "ERR-12345678";

      const payload = createErrorPayload(error, info, errorId);

      expect(payload).toMatchObject({
        errorId: "ERR-12345678",
        message: "Test error",
        stack: expect.stringContaining("Error: Test error"),
        componentStack: "Test component stack",
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
        ),
        version: "6.0.1",
        userAgent: expect.any(String),
        url: expect.any(String),
      });
    });
  });

  describe("copyErrorDiagnostics", () => {
    it("copies error diagnostics to clipboard successfully", async () => {
      mockClipboard.writeText.mockResolvedValue();

      const errorPayload = {
        errorId: "ERR-12345678",
        timestamp: "2025-01-01T00:00:00.000Z",
        message: "Test error",
        version: "6.0.1",
        url: "http://localhost:3000",
        userAgent: "test-agent",
        stack: "Error: Test error\n  at test",
        componentStack: "at Component",
      };

      const result = await copyErrorDiagnostics(errorPayload);

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("Error ID: ERR-12345678"),
      );
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining("Test error"),
      );
    });

    it("returns false when clipboard API is not available", async () => {
      const originalClipboard = navigator.clipboard;
      // @ts-ignore
      delete navigator.clipboard;

      const result = await copyErrorDiagnostics({});

      expect(result).toBe(false);

      navigator.clipboard = originalClipboard;
    });

    it("returns false when clipboard write fails", async () => {
      mockClipboard.writeText.mockRejectedValue(new Error("Clipboard error"));

      const result = await copyErrorDiagnostics({
        errorId: "ERR-12345678",
        timestamp: "2025-01-01T00:00:00.000Z",
        message: "Test error",
        version: "6.0.1",
        url: "http://localhost:3000",
        userAgent: "test-agent",
      });

      expect(result).toBe(false);
    });
  });

  describe("sendErrorToServer", () => {
    it("sends error to server successfully", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 201,
      });

      const errorPayload = { errorId: "ERR-12345678", message: "Test error" };
      const result = await sendErrorToServer(errorPayload);

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorPayload),
      });
    });

    it("returns false when server request fails", async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await sendErrorToServer({});

      expect(result).toBe(false);
    });

    it("returns false when fetch throws an error", async () => {
      fetch.mockRejectedValue(new Error("Network error"));

      const result = await sendErrorToServer({});

      expect(result).toBe(false);
    });
  });
});
