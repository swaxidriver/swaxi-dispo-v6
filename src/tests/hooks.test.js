import { renderHook, act } from "@testing-library/react";

import { useAsyncOperation, useFormState, useLocalStorage } from "../hooks";

describe("Custom Hooks", () => {
  describe("useAsyncOperation", () => {
    test("executes async function and returns result", async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue("success");
      const { result } = renderHook(() => useAsyncOperation(mockAsyncFn));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);

      let response;
      await act(async () => {
        response = await result.current.execute("arg1", "arg2");
      });

      expect(mockAsyncFn).toHaveBeenCalledWith("arg1", "arg2");
      expect(response).toBe("success");
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test("handles errors correctly", async () => {
      const mockError = new Error("Test error");
      const mockAsyncFn = jest.fn().mockRejectedValue(mockError);
      const onError = jest.fn();

      const { result } = renderHook(() =>
        useAsyncOperation(mockAsyncFn, { onError }),
      );

      await act(async () => {
        try {
          await result.current.execute();
        } catch (_error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("Test error");
      expect(onError).toHaveBeenCalledWith(mockError);
      expect(result.current.isLoading).toBe(false);
    });

    test("calls onSuccess callback", async () => {
      const mockAsyncFn = jest.fn().mockResolvedValue("success");
      const onSuccess = jest.fn();

      const { result } = renderHook(() =>
        useAsyncOperation(mockAsyncFn, { onSuccess }),
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onSuccess).toHaveBeenCalledWith("success");
    });

    test("clears error", async () => {
      const mockAsyncFn = jest.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() => useAsyncOperation(mockAsyncFn));

      await act(async () => {
        try {
          await result.current.execute();
        } catch (_error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    test("prevents concurrent executions", async () => {
      const mockAsyncFn = jest.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
      const { result } = renderHook(() => useAsyncOperation(mockAsyncFn));

      act(() => {
        result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);

      const secondResult = await act(async () => {
        return result.current.execute();
      });

      expect(secondResult).toBe(null);
      expect(mockAsyncFn).toHaveBeenCalledTimes(1);
    });

    test("provides retry functionality", async () => {
      let attemptCount = 0;
      const mockAsyncFn = jest.fn(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve("success on retry");
      });

      const { result } = renderHook(() =>
        useAsyncOperation(mockAsyncFn, { maxRetries: 3 }),
      );

      // First attempt should fail
      await act(async () => {
        try {
          await result.current.execute("test-arg");
        } catch (_error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.canRetry).toBe(true);
      expect(result.current.retryCount).toBe(0);

      // First retry should also fail
      await act(async () => {
        try {
          await result.current.retry();
        } catch (_error) {
          // Expected to throw
        }
      });

      expect(result.current.retryCount).toBe(1);
      expect(result.current.canRetry).toBe(true);

      // Second retry should succeed
      let retryResult;
      await act(async () => {
        retryResult = await result.current.retry();
      });

      expect(retryResult).toBe("success on retry");
      expect(result.current.error).toBe(null); // Error should be cleared on success
      expect(result.current.retryCount).toBe(0); // Reset on success
      expect(result.current.canRetry).toBe(false);
      expect(mockAsyncFn).toHaveBeenCalledTimes(3);
    });

    test("respects maximum retry limit", async () => {
      const mockAsyncFn = jest
        .fn()
        .mockRejectedValue(new Error("Persistent error"));
      const { result } = renderHook(() =>
        useAsyncOperation(mockAsyncFn, { maxRetries: 2 }),
      );

      // Initial execution
      await act(async () => {
        try {
          await result.current.execute();
        } catch (_error) {
          // Expected to throw
        }
      });

      expect(result.current.canRetry).toBe(true);

      // First retry
      await act(async () => {
        try {
          await result.current.retry();
        } catch (_error) {
          // Expected to throw
        }
      });

      expect(result.current.retryCount).toBe(1);
      expect(result.current.canRetry).toBe(true);

      // Second retry (should hit limit)
      await act(async () => {
        try {
          await result.current.retry();
        } catch (_error) {
          // Expected to throw
        }
      });

      expect(result.current.retryCount).toBe(2);
      expect(result.current.canRetry).toBe(false); // No more retries allowed
    });
  });

  describe("useFormState", () => {
    test("manages form values", () => {
      const initialState = { name: "", email: "" };
      const { result } = renderHook(() => useFormState(initialState));

      expect(result.current.values).toEqual(initialState);

      act(() => {
        result.current.setValue("name", "John");
      });

      expect(result.current.values.name).toBe("John");
    });

    test("handles input changes", () => {
      const { result } = renderHook(() => useFormState({ name: "" }));

      const mockEvent = {
        target: { name: "name", value: "John", type: "text" },
      };

      act(() => {
        result.current.handleInputChange(mockEvent);
      });

      expect(result.current.values.name).toBe("John");
    });

    test("handles checkbox inputs", () => {
      const { result } = renderHook(() => useFormState({ agreed: false }));

      const mockEvent = {
        target: { name: "agreed", checked: true, type: "checkbox" },
      };

      act(() => {
        result.current.handleInputChange(mockEvent);
      });

      expect(result.current.values.agreed).toBe(true);
    });

    test("validates form", () => {
      const validator = (values) => {
        const errors = {};
        if (!values.name) errors.name = "Name is required";
        return errors;
      };

      const { result } = renderHook(() =>
        useFormState({ name: "" }, validator),
      );

      act(() => {
        result.current.validate();
      });

      expect(result.current.errors.name).toBe("Name is required");
      expect(result.current.isValid).toBe(false);
    });

    test("resets form", () => {
      const initialState = { name: "John" };
      const { result } = renderHook(() => useFormState(initialState));

      act(() => {
        result.current.setValue("name", "Jane");
      });

      expect(result.current.values.name).toBe("Jane");

      act(() => {
        result.current.reset();
      });

      expect(result.current.values.name).toBe("John");
      expect(result.current.errors).toEqual({});
      expect(result.current.touched).toEqual({});
    });
  });

  describe("useLocalStorage", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test("reads from localStorage", () => {
      localStorage.setItem("test-key", JSON.stringify("test-value"));

      const { result } = renderHook(() =>
        useLocalStorage("test-key", "default"),
      );

      expect(result.current[0]).toBe("test-value");
    });

    test("uses default value when key does not exist", () => {
      const { result } = renderHook(() =>
        useLocalStorage("nonexistent", "default"),
      );

      expect(result.current[0]).toBe("default");
    });

    test("writes to localStorage", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "default"),
      );

      act(() => {
        result.current[1]("new-value");
      });

      expect(result.current[0]).toBe("new-value");
      expect(localStorage.getItem("test-key")).toBe('"new-value"');
    });

    test("removes from localStorage", () => {
      localStorage.setItem("test-key", JSON.stringify("test-value"));

      const { result } = renderHook(() =>
        useLocalStorage("test-key", "default"),
      );

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe("default");
      expect(localStorage.getItem("test-key")).toBe(null);
    });

    test("handles JSON parsing errors gracefully", () => {
      localStorage.setItem("test-key", "invalid-json");

      const { result } = renderHook(() =>
        useLocalStorage("test-key", "default"),
      );

      expect(result.current[0]).toBe("default");
    });
  });
});
