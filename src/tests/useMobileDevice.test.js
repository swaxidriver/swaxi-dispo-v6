import { renderHook, act } from "@testing-library/react";

import { useMobileDevice, useTimeInputStep } from "../hooks/useMobileDevice";

// Mock matchMedia
const mockMatchMedia = (matches) => {
  return jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

describe("useMobileDevice", () => {
  beforeEach(() => {
    // Reset window.matchMedia before each test
    delete window.matchMedia;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return true for mobile device (hover: none)", () => {
    window.matchMedia = mockMatchMedia(true);

    const { result } = renderHook(() => useMobileDevice());

    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith("(hover: none)");
  });

  it("should return false for desktop device (hover available)", () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useMobileDevice());

    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith("(hover: none)");
  });

  it("should update when media query changes", () => {
    let listeners = [];
    const mockMedia = {
      matches: false,
      media: "(hover: none)",
      addEventListener: jest.fn((event, listener) => {
        listeners.push(listener);
      }),
      removeEventListener: jest.fn((event, listener) => {
        listeners = listeners.filter((l) => l !== listener);
      }),
    };

    window.matchMedia = jest.fn(() => mockMedia);

    const { result } = renderHook(() => useMobileDevice());

    expect(result.current).toBe(false);

    // Simulate media query change to mobile
    act(() => {
      mockMedia.matches = true;
      listeners.forEach((listener) => listener({ matches: true }));
    });

    expect(result.current).toBe(true);
  });

  it("should clean up event listener on unmount", () => {
    const mockMedia = {
      matches: false,
      media: "(hover: none)",
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    window.matchMedia = jest.fn(() => mockMedia);

    const { unmount } = renderHook(() => useMobileDevice());

    expect(mockMedia.addEventListener).toHaveBeenCalled();

    unmount();

    expect(mockMedia.removeEventListener).toHaveBeenCalled();
  });
});

describe("useTimeInputStep", () => {
  beforeEach(() => {
    delete window.matchMedia;
  });

  it('should return "60" for mobile devices', () => {
    window.matchMedia = mockMatchMedia(true);

    const { result } = renderHook(() => useTimeInputStep());

    expect(result.current).toBe("60");
  });

  it('should return "900" for desktop devices', () => {
    window.matchMedia = mockMatchMedia(false);

    const { result } = renderHook(() => useTimeInputStep());

    expect(result.current).toBe("900");
  });

  it("should update when device type changes", () => {
    let listeners = [];
    const mockMedia = {
      matches: false,
      media: "(hover: none)",
      addEventListener: jest.fn((event, listener) => {
        listeners.push(listener);
      }),
      removeEventListener: jest.fn(),
    };

    window.matchMedia = jest.fn(() => mockMedia);

    const { result } = renderHook(() => useTimeInputStep());

    expect(result.current).toBe("900");

    // Simulate change to mobile
    act(() => {
      mockMedia.matches = true;
      listeners.forEach((listener) => listener({ matches: true }));
    });

    expect(result.current).toBe("60");
  });
});
