import {
  toast,
  validationRules,
  createValidator,
  formPersistence,
  createFormSubmitHandler,
} from "../ui/form-validation";

// Mock DOM methods
const mockAriaLiveRegion = {
  textContent: "",
};

const mockToastElement = {
  className: "",
  textContent: "",
  appendChild: jest.fn(),
  remove: jest.fn(),
  parentNode: {
    appendChild: jest.fn(),
  },
};

describe("Form Validation Utilities", () => {
  let mockDocument;
  let mockLocalStorage;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup DOM mocks
    mockDocument = {
      getElementById: jest.fn((id) => {
        if (id === "aria-live-root") return mockAriaLiveRegion;
        if (id === "toast-container") return null; // Force creation
        return null;
      }),
      createElement: jest.fn(() => mockToastElement),
      body: {
        appendChild: jest.fn(),
      },
    };

    // Mock localStorage
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };

    // Set global mocks
    global.document = mockDocument;
    global.localStorage = mockLocalStorage;
    global.window = {};

    // Reset mock state
    mockAriaLiveRegion.textContent = "";
  });

  describe("toast", () => {
    test("success toast updates aria-live region", () => {
      toast.success("Test success message");

      expect(mockAriaLiveRegion.textContent).toBe("Test success message");
      expect(mockDocument.createElement).toHaveBeenCalled();
      expect(mockDocument.body.appendChild).toHaveBeenCalled();
    });

    test("error toast updates aria-live region", () => {
      toast.error("Test error message");

      expect(mockAriaLiveRegion.textContent).toBe("Test error message");
    });

    test("does nothing if aria-live region not found", () => {
      mockDocument.getElementById.mockReturnValue(null);

      toast.success("Test message");

      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });
  });

  describe("validationRules", () => {
    test("required rule validates correctly", () => {
      expect(validationRules.required("")).toBe("Feld ist erforderlich");
      expect(validationRules.required("   ")).toBe("Feld ist erforderlich");
      expect(validationRules.required(null)).toBe("Feld ist erforderlich");
      expect(validationRules.required(undefined)).toBe("Feld ist erforderlich");
      expect(validationRules.required("valid")).toBe(null);
      expect(validationRules.required("valid", "Name")).toBe(null);
      expect(validationRules.required("", "Name")).toBe(
        "Name ist erforderlich",
      );
    });

    test("email rule validates correctly", () => {
      expect(validationRules.email("valid@example.com")).toBe(null);
      expect(validationRules.email("")).toBe(null); // Empty is allowed
      expect(validationRules.email("invalid-email")).toBe(
        "Bitte geben Sie eine gültige E-Mail-Adresse ein",
      );
      expect(validationRules.email("invalid@")).toBe(
        "Bitte geben Sie eine gültige E-Mail-Adresse ein",
      );
    });

    test("time rule validates correctly", () => {
      expect(validationRules.time("14:30")).toBe(null);
      expect(validationRules.time("00:00")).toBe(null);
      expect(validationRules.time("23:59")).toBe(null);
      expect(validationRules.time("")).toBe(null); // Empty is allowed
      expect(validationRules.time("25:00")).toBe(
        "Bitte geben Sie eine gültige Uhrzeit ein (HH:MM)",
      );
      expect(validationRules.time("14:60")).toBe(
        "Bitte geben Sie eine gültige Uhrzeit ein (HH:MM)",
      );
      expect(validationRules.time("invalid")).toBe(
        "Bitte geben Sie eine gültige Uhrzeit ein (HH:MM)",
      );
    });

    test("date rule validates correctly", () => {
      expect(validationRules.date("2023-12-25")).toBe(null);
      expect(validationRules.date("")).toBe(null); // Empty is allowed
      expect(validationRules.date("invalid-date")).toBe(
        "Bitte geben Sie ein gültiges Datum ein",
      );
    });

    test("minLength rule validates correctly", () => {
      const minLength3 = validationRules.minLength(3);
      expect(minLength3("hello")).toBe(null);
      expect(minLength3("hi")).toBe("Feld muss mindestens 3 Zeichen lang sein");
      expect(minLength3("hi", "Password")).toBe(
        "Password muss mindestens 3 Zeichen lang sein",
      );
      expect(minLength3("")).toBe(null); // Empty is allowed for minLength
    });
  });

  describe("createValidator", () => {
    test("creates composite validator", () => {
      const validator = createValidator({
        name: validationRules.required,
        email: [validationRules.required, validationRules.email],
        password: validationRules.minLength(6),
      });

      const errors1 = validator({
        name: "",
        email: "valid@example.com",
        password: "secret123",
      });
      expect(errors1.name).toBe("name ist erforderlich");
      expect(errors1.email).toBe(undefined);
      expect(errors1.password).toBe(undefined);

      const errors2 = validator({
        name: "John",
        email: "invalid-email",
        password: "short",
      });
      expect(errors2.name).toBe(undefined);
      expect(errors2.email).toBe(
        "Bitte geben Sie eine gültige E-Mail-Adresse ein",
      );
      expect(errors2.password).toBe(
        "password muss mindestens 6 Zeichen lang sein",
      );

      const errors3 = validator({
        name: "John",
        email: "valid@example.com",
        password: "secret123",
      });
      expect(Object.keys(errors3)).toHaveLength(0);
    });

    test("stops at first error per field", () => {
      const validator = createValidator({
        email: [validationRules.required, validationRules.email],
      });

      const errors = validator({ email: "" });
      expect(errors.email).toBe("email ist erforderlich"); // Should be required error, not email format error
    });
  });

  describe("formPersistence", () => {
    test("saves and loads form state", () => {
      const testData = { name: "John", email: "john@example.com" };

      formPersistence.save("test-form", testData);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "form-test-form",
        JSON.stringify(testData),
      );

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
      const loaded = formPersistence.load("test-form", {});
      expect(loaded).toEqual(testData);
    });

    test("returns default values when no saved data", () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const defaultData = { name: "", email: "" };

      const loaded = formPersistence.load("test-form", defaultData);
      expect(loaded).toEqual(defaultData);
    });

    test("handles JSON parsing errors gracefully", () => {
      mockLocalStorage.getItem.mockReturnValue("invalid-json");
      const defaultData = { name: "", email: "" };

      const loaded = formPersistence.load("test-form", defaultData);
      expect(loaded).toEqual(defaultData);
    });

    test("clears saved form state", () => {
      formPersistence.clear("test-form");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        "form-test-form",
      );
    });

    test("handles localStorage errors gracefully", () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      // Should not throw
      expect(() => formPersistence.save("test-form", {})).not.toThrow();
    });

    test("works when window is undefined", () => {
      global.window = undefined;

      // Should not throw and return defaults
      expect(() => formPersistence.save("test-form", {})).not.toThrow();
      expect(formPersistence.load("test-form", { default: true })).toEqual({
        default: true,
      });
    });
  });

  describe("createFormSubmitHandler", () => {
    test("creates submit handler with validation", async () => {
      const mockFormState = {
        values: { name: "John", email: "john@example.com" },
        validate: jest.fn().mockReturnValue(true),
        reset: jest.fn(),
      };

      const mockSubmitFn = jest.fn().mockResolvedValue({ id: 1 });
      const onSuccess = jest.fn();

      const handleSubmit = createFormSubmitHandler(
        mockFormState,
        mockSubmitFn,
        {
          onSuccess,
          successMessage: "Data saved!",
        },
      );

      const result = await handleSubmit();

      expect(mockFormState.validate).toHaveBeenCalled();
      expect(mockSubmitFn).toHaveBeenCalledWith(mockFormState.values);
      expect(onSuccess).toHaveBeenCalledWith({ id: 1 });
      expect(result.success).toBe(true);
    });

    test("handles validation errors", async () => {
      const mockFormState = {
        values: { name: "", email: "invalid" },
        validate: jest.fn().mockReturnValue(false),
      };

      const mockSubmitFn = jest.fn();

      const handleSubmit = createFormSubmitHandler(mockFormState, mockSubmitFn);

      const result = await handleSubmit();

      expect(mockFormState.validate).toHaveBeenCalled();
      expect(mockSubmitFn).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation failed");
    });

    test("handles submit errors", async () => {
      const mockFormState = {
        values: { name: "John" },
        validate: jest.fn().mockReturnValue(true),
      };

      const mockSubmitFn = jest
        .fn()
        .mockRejectedValue(new Error("Network error"));
      const onError = jest.fn();

      const handleSubmit = createFormSubmitHandler(
        mockFormState,
        mockSubmitFn,
        {
          onError,
        },
      );

      const result = await handleSubmit();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    test("clears form on success when requested", async () => {
      const mockFormState = {
        values: { name: "John" },
        validate: jest.fn().mockReturnValue(true),
        reset: jest.fn(),
      };

      const mockSubmitFn = jest.fn().mockResolvedValue({});

      const handleSubmit = createFormSubmitHandler(
        mockFormState,
        mockSubmitFn,
        {
          clearOnSuccess: true,
        },
      );

      await handleSubmit();

      expect(mockFormState.reset).toHaveBeenCalled();
    });

    test("handles form events properly", async () => {
      const mockFormState = {
        values: { name: "John" },
        validate: jest.fn().mockReturnValue(true),
      };

      const mockSubmitFn = jest.fn().mockResolvedValue({});
      const mockEvent = { preventDefault: jest.fn() };

      const handleSubmit = createFormSubmitHandler(mockFormState, mockSubmitFn);

      await handleSubmit(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    test("clears persistence on success", async () => {
      const mockFormState = {
        values: { name: "John" },
        validate: jest.fn().mockReturnValue(true),
      };

      const mockSubmitFn = jest.fn().mockResolvedValue({});

      const handleSubmit = createFormSubmitHandler(
        mockFormState,
        mockSubmitFn,
        {
          persistKey: "test-form",
          clearOnSuccess: true,
        },
      );

      await handleSubmit();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        "form-test-form",
      );
    });
  });
});
