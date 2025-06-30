import { test, expect, vi, describe, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router";
import CreateListing from "./CreateListing";
import { CarInfo } from "../types";

// Mock environment
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_API_ENDPOINT: "http://localhost:3000",
  },
});

// Setup fetch mock
const mockFetch = vi.fn();
Object.defineProperty(window, "fetch", {
  writable: true,
  value: mockFetch,
});

// Mock Ant Design message
vi.mock("antd", async () => {
  const actual = await vi.importActual("antd");
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

// Import the mocked antd to get access to the mocked functions
import { message } from "antd";

// Mock react-router (correct import)
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
  })),
}));

// Mock API functions
vi.mock("../api/fetchCars", () => ({
  fetchCarMakes: vi.fn(),
  fetchCarModels: vi.fn(),
}));

vi.mock("../api/fetchUserData", () => ({
  getIpAddress: vi.fn(),
}));

vi.mock("../api/fetchClientSecret", () => ({
  fetchClientSecret: vi.fn(),
}));

// Import the mocked functions
import { fetchCarMakes, fetchCarModels } from "../api/fetchCars";
import { getIpAddress } from "../api/fetchUserData";
import { useNavigate } from "react-router";

// Mock time helper
vi.mock("../helper/time", () => ({
  createStandardDate: vi.fn(),
}));

// Import the mocked function
import { createStandardDate } from "../helper/time";

// Mock CheckoutForm
vi.mock("./CheckoutForm", () => ({
  default: () => <div data-testid="checkout-form">CheckoutForm</div>,
}));

describe("CreateListing Component", () => {
  let mockUseAuth: any;
  let mockNavigate: any;

  const mockFormValues = {
    title: "Test Car",
    make: "Toyota",
    model: "Camry",
    year: 2020,
    price: 25000,
    mileage: 50000,
    color: "White",
    transmission: "automatic" as const,
    fuel: "Gasoline",
    car_type: "Sedan",
    location: "Damascus",
    description: "Great car in excellent condition",
    id: "test-123",
    listing_status: "active" as const,
    created_at: "2023-01-01T00:00:00.000Z",
    status: "active",
    seller_id: "seller-123",
    image_urls: [
      "http://example.com/image1.jpg",
      "http://example.com/image2.jpg",
    ],
    first_name: "Test",
    username: "testuser",
    hp: 200,
    specs: ["Air Conditioning", "Power Steering"],
    engine_cylinders: 4,
    engine_liters: 2.5,
    views: 0,
    currency: "usd",
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { useAuth } = await import("../hooks/useAuth");

    mockUseAuth = useAuth;
    mockNavigate = vi.fn();

    // Setup default mocks
    useAuth.mockReturnValue({ isAuthenticated: true });
    (useNavigate as any).mockReturnValue(mockNavigate);
    vi.mocked(fetchCarMakes).mockResolvedValue([
      { label: "Toyota", value: "Toyota" },
      { label: "Honda", value: "Honda" },
    ]);
    vi.mocked(fetchCarModels).mockImplementation((makes) => {
      if (makes.includes("Toyota")) {
        return Promise.resolve(["Camry", "Corolla", "RAV4"]);
      }
    });
    vi.mocked(getIpAddress).mockResolvedValue({ ip: "127.0.0.1" });
    vi.mocked(createStandardDate).mockReturnValue({
      utc: "2023-01-01T00:00:00.000Z",
      timestamp: 1672531200000,
      timezone: "UTC",
      local: "2023-01-01 00:00:00",
    });

    // Reset fetch mock
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderCreateListing = (initialValues?: Partial<CarInfo>) => {
    return render(
      <BrowserRouter>
        <CreateListing initialValues={initialValues as CarInfo} />
      </BrowserRouter>
    );
  };

  const fillRequiredFields = async () => {
    // Wait for form to be ready
    await waitFor(() => {
      expect(screen.getByText("إضافة سيارة جديدة")).toBeInTheDocument();
    });

    // Fill title (required)
    const titleInput = screen.getByLabelText("عنوان الإعلان");
    fireEvent.change(titleInput, { target: { value: "Test Car Title" } });

    // Select make (required) - trigger dropdown and select option
    const makeSelect = screen.getByLabelText("الشركة المصنعة");
    fireEvent.mouseDown(makeSelect);
    await waitFor(() => {
      const toyotaOption = screen.getAllByText("Toyota");
      fireEvent.click(toyotaOption[0]);
      expect(fetchCarModels).toHaveBeenCalledWith(["Toyota"]);
      expect(makeSelect).toHaveValue("Toyota");
    });

    // Wait for models to load, then select model (required)
    await waitFor(() => {
      const modelSelect = screen.getByLabelText("الموديل");
      expect(modelSelect).toBeInTheDocument();
      fireEvent.mouseDown(modelSelect);
    });
    await waitFor(() => {
      const camryOption = screen.getAllByText("Camry");
      expect(camryOption.length).toBeGreaterThan(0);
      fireEvent.click(camryOption[0]);
    });

    // Select year (required)
    const yearSelect = screen.getByLabelText("سنة الصنع");
    fireEvent.mouseDown(yearSelect);
    await waitFor(() => {
      const yearOption = screen.getAllByText("2020");
      fireEvent.click(yearOption[0]);
    });

    // Fill mileage (required)
    const mileageSelect = screen.getByLabelText("عدد الكيلومترات");
    fireEvent.mouseDown(mileageSelect);
    await waitFor(() => {
      // Select first available mileage option
      const mileageOptions = screen.getAllByText(/كم/);
      if (mileageOptions.length > 0) {
        fireEvent.click(mileageOptions[0]);
      }
    });

    // Fill price (required)
    const priceInput = screen.getByLabelText("السعر");
    fireEvent.change(priceInput, { target: { value: "25000" } });

    // Select car type (required)
    const carTypeSelect = screen.getByLabelText("نوع السيارة");
    fireEvent.mouseDown(carTypeSelect);
    await waitFor(() => {
      // Select first available car type
      const carTypeOptions = screen.getAllByText(/سيدان|هاتشباك|SUV/);
      if (carTypeOptions.length > 0) {
        fireEvent.click(carTypeOptions[0]);
      }
    });

    // Select location (required)
    const locationSelect = screen.getByLabelText("المحافظة");
    fireEvent.mouseDown(locationSelect);
    await waitFor(() => {
      const damascusOption = screen.getAllByText("دمشق");
      fireEvent.click(damascusOption[0]);
    });

    // Select color (required)
    const colorSelect = screen.getByLabelText("اللون");
    fireEvent.mouseDown(colorSelect);
    await waitFor(() => {
      // Select first available color
      const colorOptions = screen.getAllByText(/أبيض|أسود|أحمر/);
      if (colorOptions.length > 0) {
        fireEvent.click(colorOptions[0]);
      }
    });

    // Select transmission (required)
    const automaticRadio = screen.getAllByText("أوتوماتيك");
    fireEvent.click(automaticRadio[0]);

    // Select fuel (required)
    const fuelSelect = screen.getByLabelText("الوقود");
    fireEvent.mouseDown(fuelSelect);
    await waitFor(() => {
      const fuelOptions = screen.getAllByText(/بنزين|ديزل/);
      if (fuelOptions.length > 0) {
        fireEvent.click(fuelOptions[0]);
      }
    });

    // Fill description (required)
    const descriptionInput = screen.getByLabelText("الوصف");
    fireEvent.change(descriptionInput, {
      target: { value: "Test car description" },
    });

    // Mock file upload for images (required)
    const uploadInput = screen.getByLabelText("صور السيارة");
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    fireEvent.change(uploadInput, { target: { files: [file] } });
  };

  test("should create new listing successfully", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, id: "123" }),
    });
    window.fetch = mockFetch;

    renderCreateListing();

    // Fill required fields
    await fillRequiredFields();

    // Find and click submit button
    const submitButton = screen.getByRole("button", { name: "نشر السيارة" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/create-listing",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: expect.any(FormData),
        })
      );
    });

    // Verify success message was called
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith("تم نشر السيارة بنجاح!");
    });
  });

  test("should update existing listing successfully", async () => {
    const initialValues = {
      ...mockFormValues,
      id: "existing-123",
      image_urls: [
        "http://example.com/image1.jpg",
        "http://example.com/image2.jpg",
      ],
    };

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    window.fetch = mockFetch;

    renderCreateListing(initialValues);

    // Wait for component to load with initial values
    await waitFor(() => {
      expect(screen.getByText("إضافة سيارة جديدة")).toBeInTheDocument();
    });

    // Find and click submit button (form should be pre-filled)
    const submitButton = screen.getByRole("button", { name: "نشر السيارة" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/listings/update/existing-123",
        expect.objectContaining({
          method: "PUT",
          credentials: "include",
          body: expect.any(FormData),
        })
      );
    });

    // Verify navigation was called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/my-listings");
    });
  });

  test("should handle API error response", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    });
    window.fetch = mockFetch;

    renderCreateListing();

    // Fill required fields
    await fillRequiredFields();

    const submitButton = screen.getByRole("button", { name: "نشر السيارة" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith("حدث خطأ أثناء نشر السيارة");
    });
  });

  test("should handle network error", async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
    window.fetch = mockFetch;

    renderCreateListing();

    // Fill required fields
    await fillRequiredFields();

    const submitButton = screen.getByRole("button", { name: "نشر السيارة" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith("حدث خطأ أثناء نشر السيارة");
    });
  });

  test("should prevent submission when user is not authenticated", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    renderCreateListing();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("إضافة سيارة جديدة")).toBeInTheDocument();
    });

    // Fill required fields
    await fillRequiredFields();

    const submitButton = screen.getByRole("button", { name: "نشر السيارة" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith(
        "يجب تسجيل الدخول لنشر الإعلانات"
      );
    });

    expect(window.fetch).not.toHaveBeenCalled();
  });

  test("should call createStandardDate when submitting", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    window.fetch = mockFetch;

    renderCreateListing();

    // Fill required fields
    await fillRequiredFields();

    const submitButton = screen.getByRole("button", { name: "نشر السيارة" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createStandardDate).toHaveBeenCalled();
    });
  });

  test("should initialize with correct form values when editing", async () => {
    const initialValues = {
      ...mockFormValues,
      id: "test-123",
      title: "Existing Car",
      make: "Toyota",
      model: "Camry",
      image_urls: [
        "http://example.com/image1.jpg",
        "http://example.com/image2.jpg",
      ],
    };

    renderCreateListing(initialValues);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("إضافة سيارة جديدة")).toBeInTheDocument();
    });

    // The form should be initialized with the provided values
    expect(screen.getByDisplayValue("Existing Car")).toBeInTheDocument();
  });

  test("should handle form data construction correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    window.fetch = mockFetch;

    renderCreateListing();

    // Fill required fields
    await fillRequiredFields();

    const submitButton = screen.getByRole("button", { name: "نشر السيارة" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const callArgs = mockFetch.mock.calls[0];
    const formData = callArgs[1].body;
    expect(formData).toBeInstanceOf(FormData);
  });
});
