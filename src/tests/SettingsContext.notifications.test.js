import { renderHook, act } from "@testing-library/react";
import React from "react";

import { SettingsProvider } from "../contexts/SettingsContext";
import { useSettings } from "../hooks/useSettings";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

const wrapper = ({ children }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe("SettingsContext notifications", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("has notifications enabled by default", () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.settings.notificationsEnabled).toBe(true);
  });

  it("can toggle notifications setting", () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.updateSetting("notificationsEnabled", false);
    });

    expect(result.current.settings.notificationsEnabled).toBe(false);

    act(() => {
      result.current.updateSetting("notificationsEnabled", true);
    });

    expect(result.current.settings.notificationsEnabled).toBe(true);
  });

  it("includes notifications setting in reset", () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    // Change the setting
    act(() => {
      result.current.updateSetting("notificationsEnabled", false);
    });

    expect(result.current.settings.notificationsEnabled).toBe(false);

    // Reset should restore default
    act(() => {
      result.current.resetSettings();
    });

    expect(result.current.settings.notificationsEnabled).toBe(true);
  });
});
