import {
  Button,
  Col,
  Collapse,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Slider,
} from "antd";
import { DeleteTwoTone, SearchOutlined } from "@ant-design/icons";
import type { CollapseProps, SelectProps } from "antd";
import { useEffect, useState, useCallback } from "react";
import data from "../cars.json";
import { fetchCarMakes, fetchCarModels } from "../api/fetchCars";
import carData from "../cars.json";
import { useSearchParams } from "react-router";
import ErrorBoundary from "./common/ErrorBoundary";
import useDebounce from "../hooks/useDebounce";
import { priceFormat } from "../helper/priceFormat";
import { formatNumber, formatYearToArabic } from "../helper/formatNumber";

const handleChange = (value: string[]) => {
  console.log(`selected ${value}`);
};

interface SearchParams {
  make?: string[];
  model?: string[];
  carType?: string[];
  fuel?: string[];
  gearbox?: string[];
  location?: string[];
  price?: [number, number];
  carMileage?: [number, number];
  makeYear?: [number, number];
  keyword?: string;
}

interface SearchSelectProps {
  onSearch?: (params: URLSearchParams) => void;
}

const SearchSelect = ({ onSearch }: SearchSelectProps) => {
  let maxInputPriceValue = 1000000;
  const maxInputKmValue = 300000;
  const [form] = Form.useForm();
  const values = Form.useWatch([], form);
  console.log("values", values);

  const [carMakes, setCarMakes] = useState<SelectProps["options"]>([]);
  const [carModels, setCarModels] = useState<SelectProps["options"]>([]);
  // const [chosenCarMakes, setChosenCarMakes] = useState<string[]>([]);
  const [minMakeYears, setMinMakeYears] = useState<number>(data.minYear);
  const [maxMakeYears, setMaxMakeYears] = useState<number>(data.maxYear);
  const [maxPrice, setMaxPrice] = useState<number>(maxInputPriceValue);
  const [minPrice, setMinPrice] = useState<number>(1);
  const [currency, setCurrency] = useState<string>("syp");
  const [maxKm, setMaxKm] = useState<number>(maxInputKmValue);
  const [minKm, setMinKm] = useState<number>(1);
  const [searchParams, setSearchParams] = useSearchParams();
  if (currency === "syp") {
    maxInputPriceValue = 1000000000;
  }

  // fetch car makes when the component loads
  useEffect(() => {
    const getCarMakes = async () => {
      const data = await fetchCarMakes();

      setCarMakes(data);
    };

    getCarMakes();
  }, []);

  const GetMakeModelsAndMakeyears = async (value: string[]) => {
    if (!value || value.length === 0) {
      console.error("No car makes provided for fetching models");
      return;
    }
    const data = await fetchCarModels(value);
    console.log("carModels", data);

    setCarModels(
      Array.isArray(data)
        ? data
            .map((model) => ({ label: model, value: model }))
            .sort((a, b) => a.label.localeCompare(b.label))
        : []
    );
  };

  const debouncedGetModels = useDebounce((...args: unknown[]) => {
    // Expecting the first argument to be string[]
    if (Array.isArray(args[0])) {
      return GetMakeModelsAndMakeyears(args[0] as string[]);
    }
  }, 500);

  useEffect(() => {
    // Update car models when makes change
    const makeValues = form.getFieldValue("make") as string[];
    if (makeValues && makeValues.length > 0) {
      debouncedGetModels(makeValues);
    } else {
      setCarModels([]);
    }
  }, [carMakes]);

  const onPriceChange = (newValue: Array<number>) => {
    console.log(newValue[0], newValue[1]);
    setMinPrice(newValue[0]);
    setMaxPrice(newValue[1]);
  };

  const onKmChange = (newValue: Array<number>) => {
    console.log(newValue[0]);
    setMinKm(newValue[0]);
    setMaxKm(newValue[1]);
  };

  const onMakeYearChange = (value: Array<number>) => {
    console.log(value);

    setMinMakeYears(value[0]);
    setMaxMakeYears(value[1]);
    console.log(minMakeYears, maxMakeYears);
  };

  const handleGearboxChange = (value: string[]) => {
    console.log(value);
  };

  // Initialize form with URL params
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    // Convert range parameters back to arrays
    const formValues = {
      ...params,
      price: params.price_min
        ? [Number(params.price_min), Number(params.price_max)]
        : [1, maxInputPriceValue],
      makeYear: params.makeYear_min
        ? [Number(params.makeYear_min), Number(params.makeYear_max)]
        : [data.minYear, data.maxYear],
      carMileage: params.carMileage_min
        ? [Number(params.carMileage_min), Number(params.carMileage_max)]
        : [0, maxInputKmValue],
      currency: params.currency || "syp",
    };

    form.setFieldsValue(formValues);
  }, []);

  const submitSearch = useCallback(() => {
    const formValues = form.getFieldsValue() as SearchParams;

    // Build query parameters
    const params = new URLSearchParams();

    // Defensive: clear any previous range keys before setting
    const rangeKeys = [
      "price_min",
      "price_max",
      "carMileage_min",
      "carMileage_max",
      "makeYear_min",
      "makeYear_max",
    ];
    rangeKeys.forEach((k) => params.delete(k));

    Object.entries(formValues).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            // Handle range fields (price, carMileage, makeYear)
            if (key === "price" || key === "carMileage" || key === "makeYear") {
              params.set(`${key}_min`, value[0].toString());
              params.set(`${key}_max`, value[1].toString());
            } else if (
              key === "make" ||
              key === "model" ||
              key === "carType" ||
              key === "fuel" ||
              key === "gearbox" ||
              key === "location"
            ) {
              // Only these are true multi-select fields
              value.forEach((v) => params.append(key, v.toString()));
            } else {
              // For any other array field, join as comma-separated (defensive)
              params.set(key, value.join(","));
            }
          }
        } else if (typeof value === "string" && value.trim() !== "") {
          // Handle text/keyword and single-value fields (currency, etc.)
          params.set(key, value);
        } else if (typeof value === "number") {
          // Handle single number fields
          params.set(key, value.toString());
        }
      }
    });

    // Debug: print all params
    for (const [k, v] of params.entries()) {
      console.log(`param: ${k} = ${v}`);
    }

    // Navigate to search results with query parameters
    setSearchParams(params);
    onSearch?.(params);
  }, [form, setSearchParams, onSearch]);

  // Update form values when sliders change
  useEffect(() => {
    form.setFieldsValue({
      price: [minPrice, maxPrice],
      carMileage: [minKm, maxKm],
      makeYear: [minMakeYears, maxMakeYears],
      currency: currency,
    });
  }, [minPrice, maxPrice, minKm, maxKm, minMakeYears, maxMakeYears, currency]);

  const handleReset = () => {
    form.resetFields();
    setSearchParams(new URLSearchParams());
    onSearch?.(new URLSearchParams());

    // Reset state values
    setMinPrice(1);
    setMaxPrice(maxInputPriceValue);
    setMinKm(1);
    setMaxKm(maxInputKmValue);
    setMinMakeYears(data.minYear);
    setMaxMakeYears(data.maxYear);
  };

  const items: CollapseProps["items"] = [
    {
      key: "1",
      label: "بحث متقدم",
      children: (
        <Row gutter={[14, 12]} wrap justify={"center"} align={"middle"}>
          <Col span={4} xs={16} sm={12} md={12} lg={22} xl={8}>
            <Form.Item name="price" label="نطاق السعر">
              <Slider
                range={{ draggableTrack: true }}
                step={1000}
                min={1}
                max={maxInputPriceValue}
                onChange={onPriceChange}
                value={[minPrice, maxPrice]}
                tooltip={{
                  formatter: (value?: number) => {
                    if (typeof value === "number") {
                      return priceFormat(value, currency);
                    }
                    return "";
                  },
                }}
                marks={{
                  1: priceFormat(1, currency),
                  [maxInputPriceValue]: priceFormat(
                    maxInputPriceValue,
                    currency
                  ),
                }}
              />
            </Form.Item>
            <Flex justify="center" align="baseline">
              <InputNumber
                min={1}
                max={maxInputPriceValue}
                value={minPrice}
                title="اقل سعر"
                placeholder="اقل سعر"
                style={{ margin: "0 16px" }}
                onChange={(value: number | null) =>
                  setMinPrice(value as number)
                }
              />
              <InputNumber
                min={1}
                max={maxInputPriceValue}
                value={maxPrice}
                title="أعلى سعر"
                placeholder="أعلى سعر"
                style={{ margin: "0 16px" }}
                onChange={(value: number | null) =>
                  setMaxPrice(value as number)
                }
              />
              <Form.Item name="currency" className="w-32">
                <Flex className="h-4 w-32" justify="center" align="baseline">
                  <Select
                    className="m-2"
                    options={[
                      { label: "دولار", value: "usd" },
                      { label: "ليرة سورية", value: "syp" },
                    ]}
                    defaultValue="syp"
                    onChange={(value) => setCurrency(value as string)}
                  />
                </Flex>
              </Form.Item>
            </Flex>
            <Form.Item name="carMileage" label="كيلومتراج">
              <Slider
                range={{ draggableTrack: true }}
                step={1000}
                min={1}
                max={maxInputKmValue}
                value={[minKm, maxKm]}
                onChange={onKmChange}
                tooltip={{
                  formatter: (value?: number) => {
                    if (typeof value === "number") {
                      return <p>{value.toLocaleString("ar-SY")} كم</p>;
                    }
                    return "";
                  },
                }}
                marks={{
                  1: <span>1 كم</span>,
                  [maxInputKmValue]: (
                    <span>{formatNumber(maxInputKmValue)} كم</span>
                  ),
                }}
              />

              <Flex justify="center">
                <InputNumber
                  min={1}
                  max={maxInputKmValue}
                  value={minKm}
                  title="اقل كيلومتراج"
                  placeholder="على الاقل"
                  style={{ margin: "0 16px" }}
                  onChange={(value) => setMinKm(value as number)}
                />
                <InputNumber
                  min={1}
                  max={maxInputKmValue}
                  title="اعلى كيلومتراج"
                  placeholder="أقصى حد"
                  style={{ margin: "0 16px" }}
                  value={maxKm}
                  onChange={(value) => setMaxKm(value as number)}
                />
              </Flex>
            </Form.Item>
          </Col>
          <Col span={4} xs={16} sm={12} md={12} lg={22} xl={8}>
            <Form.Item name="makeYear" label="سنة التصنيع">
              <Slider
                range={{ draggableTrack: true }}
                min={data.minYear}
                max={data.maxYear}
                value={[minMakeYears, maxMakeYears]}
                step={1}
                onChange={onMakeYearChange}
                tooltip={{
                  formatter: (value?: number) => {
                    return formatYearToArabic(value);
                  },
                }}
                marks={{
                  [data.minYear]: formatYearToArabic(data.minYear),
                  [data.maxYear]: formatYearToArabic(data.maxYear),
                }}
              />
            </Form.Item>
            <Form.Item>
              <Flex justify="center" className="w-full">
                <InputNumber
                  min={data.minYear}
                  max={data.maxYear}
                  step={1}
                  value={minMakeYears}
                  title="اقل سنة"
                  placeholder="اقل سنة"
                  style={{ margin: "0 16px" }}
                  onChange={(value) => setMinMakeYears(value as number)}
                />
                <InputNumber
                  min={data.minYear}
                  max={maxInputPriceValue}
                  value={maxMakeYears}
                  title="أعلى سنة"
                  placeholder="أعلى سنة"
                  style={{ margin: "0 16px" }}
                  onChange={(value) => setMaxMakeYears(value as number)}
                />
              </Flex>
            </Form.Item>
          </Col>
          <Col span={10} xs={16} sm={4} md={4} lg={8} xl={4}>
            <Form.Item
              name="engine_cylinders"
              label="عدد الاسطوانات"
              className="w-40"
              tooltip="عدد الاسطوانات في المحرك"
            >
              <Select
                showSearch
                maxTagCount={2}
                mode="multiple"
                placeholder="عدد الاسطوانات"
                options={carData.engine_cylinders.map((cylinder) => {
                  return { label: cylinder, value: cylinder };
                })}
              />
            </Form.Item>
          </Col>
          <Col span={10} xs={16} sm={4} md={8} lg={8} xl={4}>
            <Form.Item name="engine_liters" label="سعة المحرك" className="w-40">
              <Slider
                min={0.1}
                max={10}
                step={0.1}
                range={{ draggableTrack: true }}
                defaultValue={[0.1, 10]}
                tooltip={{
                  formatter: (value?: number) => {
                    return formatNumber(value as number)
                      ? `${formatNumber(value as number)} لتر`
                      : value;
                  },
                }}
                // max shouldnt be smaller than minimum value and vice versa
                marks={{
                  0.1: "0.1 لتر",
                  10: "10 لتر",
                }}
              />
            </Form.Item>
          </Col>
          <Col span={10} xs={16} sm={4} md={8} lg={8} xl={4}>
            <Form.Item name="hp" label="عدد الاحصنة" className="w-40">
              <Slider
                min={1}
                max={1000}
                step={1}
                range={{ draggableTrack: true }}
                defaultValue={[1, 1000]}
                tooltip={{
                  formatter: (value?: number) => {
                    return formatNumber(value as number)
                      ? `${formatNumber(value as number)} حصان`
                      : value;
                  },
                }}
                marks={{
                  1: <span>1 حصان</span>,
                  1000: <span>1000 حصان</span>,
                }}
              />
            </Form.Item>
          </Col>
          <Col span={10} xs={16} sm={12} md={4} lg={8} xl={4}>
            <Form.Item name="specs" label="مواصفات اخرى" className="w-40">
              <Select
                maxTagCount={2}
                mode="tags"
                placeholder="اضف مواصفات اخرى"
                options={carData.comfort_options.map((options) => {
                  const category = options.category;
                  const features = options.features;

                  return {
                    name: category,
                    label: <span>{category}</span>,
                    title: category,
                    options: features.map((feature) => {
                      return {
                        label: <span>{feature}</span>,
                        value: feature,
                      };
                    }),
                    value: category,
                  };
                })}
              />
            </Form.Item>
          </Col>
          <Col span={10} xs={16} sm={4} md={4} lg={6} xl={4}>
            <Form.Item
              name="keyword"
              label="البحث"
              className="flex items-center justify-center w-40"
            >
              <Input
                title="gti, rs, full option مواصفات مميزة"
                placeholder="gti, rs, full option مواصفات مميزة"
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <ErrorBoundary>
      <Form
        form={form}
        layout="vertical"
        className="w-full max-w-2xl space-y-4 mb-10"
        initialValues={{
          makeYear: [data.minYear, data.maxYear],
          carMileage: [0, maxInputKmValue],
          price: [1, data.maxPrice],
        }}
        onFinish={submitSearch}
      >
        <Row gutter={[10, 6]} justify={"center"}>
          <Col span={4} xs={12} md={4} lg={4} className="space-y-1">
            <Form.Item name="make" label="ماركات السيارات">
              <Select
                maxTagCount={1}
                maxCount={5}
                mode="multiple"
                allowClear
                className="w-32"
                title="اختر ماركة السيارة"
                placeholder="اختر ماركة السيارة"
                onChange={debouncedGetModels}
                options={carMakes}
                virtual
              />
            </Form.Item>
          </Col>
          <Col span={4} xs={12} md={4} lg={4} className="space-y-1">
            <Form.Item name="model" label="موديلات السيارات">
              <Select
                maxTagCount={0}
                id="car-make"
                title="اختر موديل السيارة"
                mode="multiple"
                className="w-32 overflow-x-auto"
                placeholder="اختر موديل السيارة"
                onChange={handleChange}
                options={carModels}
                virtual
              />
            </Form.Item>
          </Col>
          <Col span={4} xs={12} md={4} lg={4} className="space-y-1">
            <Form.Item name="carType" label="تصنيف السيارة">
              <Select
                maxTagCount={0}
                mode="multiple"
                className="w-32"
                title="اختر تصنيف السيارة"
                placeholder="اختر تصنيف السيارة"
                onChange={handleChange}
                options={data.carType.map((car) => {
                  const carType = Object.keys(car)[0];
                  const carTypeValues = Object.keys(car)[0];

                  return {
                    label: carType,
                    value: carTypeValues,
                  };
                })}
              />
            </Form.Item>
          </Col>
          <Col span={4} xs={12} md={4} lg={4} className="space-y-1">
            <Form.Item name="fuel" label="نوع الوقود">
              <Select
                maxTagCount={1}
                mode="multiple"
                className="w-32"
                title="اختر نوع الوقود"
                placeholder="اختر نوع الوقود"
                onChange={handleChange}
                options={data.fuelType.map((fuel) => {
                  const fuelKey = Object.keys(fuel)[0];
                  const fuelValue = Object.keys(fuel)[0];

                  return { label: fuelKey, value: fuelValue };
                })}
              />
            </Form.Item>
          </Col>
          <Col span={4} xs={12} md={4} lg={4} className="space-y-1">
            <Form.Item name="gearbox" label="ناقل الحركة">
              <Select
                maxTagCount={1}
                mode="multiple"
                className="w-32"
                title="اختر ناقل الحركة"
                placeholder="اختر ناقل الحركة"
                onChange={handleGearboxChange}
                options={data.gearbox.map((car) => {
                  const gear = Object.keys(car)[0];
                  const gearValue = Object.keys(car)[0];

                  return { label: gear, value: gearValue };
                })}
              />
            </Form.Item>
          </Col>
          <Col span={4} xs={12} md={4} lg={4} className="space-y-1">
            <Form.Item name="location" label="تواجد السيارة">
              <Select
                maxTagCount={1}
                title="اختر مكان تواجد السيارة"
                mode="multiple"
                className="w-32 overflow-x-auto"
                placeholder="اختر مكان تواجد السيارة"
                onChange={handleChange}
                options={data.cities.map((city) => {
                  return { label: city, value: city };
                })}
              />
            </Form.Item>
          </Col>
        </Row>

        <Collapse items={items} bordered={false}></Collapse>

        <Flex gap="middle" className="space-x-2" justify="center">
          <Button onClick={handleReset} className="hover:bg-red-500">
            <DeleteTwoTone />
            حذف المعلومات
          </Button>
          <Button htmlType="submit" type="primary">
            <SearchOutlined /> ابحث
          </Button>
        </Flex>
      </Form>
    </ErrorBoundary>
  );
};

export default SearchSelect;
