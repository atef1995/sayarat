import {
  Button,
  Col,
  Collapse,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Slider,
  Space,
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
  transmission?: string[];
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

  const [carMakes, setCarMakes] = useState<SelectProps["options"]>([]);
  const [carModels, setCarModels] = useState<SelectProps["options"]>([]);
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
    if (Array.isArray(args[0])) {
      return GetMakeModelsAndMakeyears(args[0] as string[]);
    }
  }, 500);

  useEffect(() => {
    const makeValues = form.getFieldValue("make") as string[];
    if (makeValues && makeValues.length > 0) {
      debouncedGetModels(makeValues);
    } else {
      setCarModels([]);
    }
  }, [carMakes]);

  const onPriceChange = (newValue: Array<number>) => {
    setMinPrice(newValue[0]);
    setMaxPrice(newValue[1]);
  };

  const onKmChange = (newValue: Array<number>) => {
    setMinKm(newValue[0]);
    setMaxKm(newValue[1]);
  };

  const onMakeYearChange = (value: Array<number>) => {
    setMinMakeYears(value[0]);
    setMaxMakeYears(value[1]);
  };

  const handleGearboxChange = (value: string[]) => {
    console.log(value);
  };

  // Initialize form with URL params
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

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
    const params = new URLSearchParams();

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
            if (key === "price" || key === "carMileage" || key === "makeYear") {
              params.set(`${key}_min`, value[0].toString());
              params.set(`${key}_max`, value[1].toString());
            } else if (
              key === "make" ||
              key === "model" ||
              key === "carType" ||
              key === "fuel" ||
              key === "transmission" ||
              key === "location"
            ) {
              value.forEach((v) => params.append(key, v.toString()));
            } else {
              params.set(key, value.join(","));
            }
          }
        } else if (typeof value === "string" && value.trim() !== "") {
          params.set(key, value);
        } else if (typeof value === "number") {
          params.set(key, value.toString());
        }
      }
    });

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

    setMinPrice(1);
    setMaxPrice(maxInputPriceValue);
    setMinKm(1);
    setMaxKm(maxInputKmValue);
    setMinMakeYears(data.minYear);
    setMaxMakeYears(data.maxYear);
  };

  // Responsive column configuration
  const responsiveCol = {
    xs: 24,  // 1 column on mobile
    sm: 12,  // 2 columns on small tablets
    md: 8,   // 3 columns on tablets
    lg: 6,   // 4 columns on desktop
    xl: 4,   // 6 columns on large desktop
  };

  const responsiveColAdvanced = {
    xs: 24,
    sm: 24,
    md: 12,
    lg: 8,
    xl: 6,
  };

  const items: CollapseProps["items"] = [
    {
      key: "1",
      label: "بحث متقدم",
      children: (
        <div style={{ padding: '16px 0' }}>
          {/* Price Section */}
          <Row gutter={[16, 24]}>
            <Col span={24}>
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
                    [maxInputPriceValue]: priceFormat(maxInputPriceValue, currency),
                  }}
                />
              </Form.Item>
              
              <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={8}>
                  <InputNumber
                    min={1}
                    max={maxInputPriceValue}
                    value={minPrice}
                    title="اقل سعر"
                    placeholder="اقل سعر"
                    style={{ width: '100%' }}
                    onChange={(value: number | null) => setMinPrice(value as number)}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <InputNumber
                    min={1}
                    max={maxInputPriceValue}
                    value={maxPrice}
                    title="أعلى سعر"
                    placeholder="أعلى سعر"
                    style={{ width: '100%' }}
                    onChange={(value: number | null) => setMaxPrice(value as number)}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="currency" noStyle>
                    <Select
                      style={{ width: '100%' }}
                      options={[
                        { label: "دولار", value: "usd" },
                        { label: "ليرة سورية", value: "syp" },
                      ]}
                      defaultValue="syp"
                      onChange={(value) => setCurrency(value as string)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Mileage Section */}
          <Row gutter={[16, 24]} style={{ marginTop: 24 }}>
            <Col span={24}>
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
                        return `${value.toLocaleString("ar-SY")} كم`;
                      }
                      return "";
                    },
                  }}
                  marks={{
                    1: <span>1 كم</span>,
                    [maxInputKmValue]: <span>{formatNumber(maxInputKmValue)} كم</span>,
                  }}
                />
              </Form.Item>
              
              <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={12}>
                  <InputNumber
                    min={1}
                    max={maxInputKmValue}
                    value={minKm}
                    title="اقل كيلومتراج"
                    placeholder="على الاقل"
                    style={{ width: '100%' }}
                    onChange={(value) => setMinKm(value as number)}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <InputNumber
                    min={1}
                    max={maxInputKmValue}
                    title="اعلى كيلومتراج"
                    placeholder="أقصى حد"
                    style={{ width: '100%' }}
                    value={maxKm}
                    onChange={(value) => setMaxKm(value as number)}
                  />
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Make Year Section */}
          <Row gutter={[16, 24]} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Form.Item name="makeYear" label="سنة التصنيع">
                <Slider
                  range={{ draggableTrack: true }}
                  min={data.minYear}
                  max={data.maxYear}
                  value={[minMakeYears, maxMakeYears]}
                  step={1}
                  onChange={onMakeYearChange}
                  tooltip={{
                    formatter: (value?: number) => formatYearToArabic(value),
                  }}
                  marks={{
                    [data.minYear]: formatYearToArabic(data.minYear),
                    [data.maxYear]: formatYearToArabic(data.maxYear),
                  }}
                />
              </Form.Item>
              
              <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={12}>
                  <InputNumber
                    min={data.minYear}
                    max={data.maxYear}
                    step={1}
                    value={minMakeYears}
                    title="اقل سنة"
                    placeholder="اقل سنة"
                    style={{ width: '100%' }}
                    onChange={(value) => setMinMakeYears(value as number)}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <InputNumber
                    min={data.minYear}
                    max={data.maxYear}
                    value={maxMakeYears}
                    title="أعلى سنة"
                    placeholder="أعلى سنة"
                    style={{ width: '100%' }}
                    onChange={(value) => setMaxMakeYears(value as number)}
                  />
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Additional Options Grid */}
          <Row gutter={[16, 24]} style={{ marginTop: 24 }}>
            <Col {...responsiveColAdvanced}>
              <Form.Item
                name="engine_cylinders"
                label="عدد الاسطوانات"
                tooltip="عدد الاسطوانات في المحرك"
              >
                <Select
                  showSearch
                  maxTagCount={2}
                  mode="multiple"
                  placeholder="عدد الاسطوانات"
                  style={{ width: '100%' }}
                  options={carData.engine_cylinders.map((cylinder) => ({
                    label: cylinder,
                    value: cylinder,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col {...responsiveColAdvanced}>
              <Form.Item name="engine_liters" label="سعة المحرك">
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
                  marks={{
                    0.1: "0.1 لتر",
                    10: "10 لتر",
                  }}
                />
              </Form.Item>
            </Col>

            <Col {...responsiveColAdvanced}>
              <Form.Item name="hp" label="عدد الاحصنة">
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

            <Col {...responsiveColAdvanced}>
              <Form.Item name="specs" label="مواصفات اخرى">
                <Select
                  maxTagCount={2}
                  mode="tags"
                  placeholder="اضف مواصفات اخرى"
                  style={{ width: '100%' }}
                  options={carData.comfort_options.map((options) => {
                    const category = options.category;
                    const features = options.features;

                    return {
                      name: category,
                      label: <span>{category}</span>,
                      title: category,
                      options: features.map((feature) => ({
                        label: <span>{feature}</span>,
                        value: feature,
                      })),
                      value: category,
                    };
                  })}
                />
              </Form.Item>
            </Col>

            <Col {...responsiveColAdvanced}>
              <Form.Item name="keyword" label="البحث">
                <Input
                  title="gti, rs, full option مواصفات مميزة"
                  placeholder="gti, rs, full option مواصفات مميزة"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  return (
    <ErrorBoundary>
      <Form
        form={form}
        layout="vertical"
        className="w-full"
        style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}
        initialValues={{
          makeYear: [data.minYear, data.maxYear],
          carMileage: [0, maxInputKmValue],
          price: [1, data.maxPrice],
        }}
        onFinish={submitSearch}
      >
        {/* Main Search Fields */}
        <Row gutter={[16, 16]}>
          <Col {...responsiveCol}>
            <Form.Item name="make" label="ماركات السيارات">
              <Select
                maxTagCount={1}
                maxCount={5}
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                title="اختر ماركة السيارة"
                placeholder="اختر ماركة السيارة"
                onChange={debouncedGetModels}
                options={carMakes}
                virtual
              />
            </Form.Item>
          </Col>

          <Col {...responsiveCol}>
            <Form.Item name="model" label="موديلات السيارات">
              <Select
                maxTagCount={0}
                id="car-make"
                title="اختر موديل السيارة"
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="اختر موديل السيارة"
                onChange={handleChange}
                options={carModels}
                virtual
              />
            </Form.Item>
          </Col>

          <Col {...responsiveCol}>
            <Form.Item name="carType" label="تصنيف السيارة">
              <Select
                maxTagCount={0}
                mode="multiple"
                style={{ width: '100%' }}
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

          <Col {...responsiveCol}>
            <Form.Item name="fuel" label="نوع الوقود">
              <Select
                maxTagCount={1}
                mode="multiple"
                style={{ width: '100%' }}
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

          <Col {...responsiveCol}>
            <Form.Item name="transmission" label="ناقل الحركة">
              <Select
                maxTagCount={1}
                mode="multiple"
                style={{ width: '100%' }}
                title="اختر ناقل الحركة"
                placeholder="اختر ناقل الحركة"
                onChange={handleGearboxChange}
                options={data.gearbox.map((car) => {
                  const gear = Object.keys(car)[0];
                  return { label: gear, value: gear };
                })}
              />
            </Form.Item>
          </Col>

          <Col {...responsiveCol}>
            <Form.Item name="location" label="تواجد السيارة">
              <Select
                maxTagCount={1}
                title="اختر مكان تواجد السيارة"
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="اختر مكان تواجد السيارة"
                onChange={handleChange}
                options={data.cities.map((city) => ({
                  label: city,
                  value: city,
                }))}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Advanced Search Collapse */}
        <Row style={{ marginTop: 24 }}>
          <Col span={24}>
            <Collapse items={items} bordered={false} />
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row justify="center" style={{ marginTop: 24, marginBottom: 24 }}>
          <Space size="middle">
            <Button 
              onClick={handleReset} 
              danger
              icon={<DeleteTwoTone />}
            >
              حذف المعلومات
            </Button>
            <Button 
              htmlType="submit" 
              type="primary"
              icon={<SearchOutlined />}
            >
              ابحث
            </Button>
          </Space>
        </Row>
      </Form>
    </ErrorBoundary>
  );
};

export default SearchSelect;