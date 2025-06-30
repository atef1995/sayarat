import { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Button,
  Table,
  Tag,
  Modal,
  Image,
  Space,
  message,
  TableProps,
  Flex,
  Select,
} from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { deleteListingById, fetchListingsByUserId } from "../api/fetchCars";
import { CarCardProps, CarInfo } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useMediaQuery } from "react-responsive";
import MobileEditListing from "./MobileEditListing";
import { useNavigate } from "react-router";

const UserListings = () => {
  const [listings, setListings] = useState<CarCardProps[]>();
  const [loading, setLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState<string>();
  const [selectedListingId, setSelectedListingId] = useState<CarInfo["id"]>();
  const { user } = useAuth();
  const isMobile = useMediaQuery({ query: "(max-width: 868px)" });
  const navigate = useNavigate();

  const fetchListings = async () => {
    if (!user?.id) return; // Guard clause

    try {
      setLoading(true);
      const data = await fetchListingsByUserId();
      console.log("Fetched listings:", data);

      setListings(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
      message.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchListings();
    }
  }, [user?.id]);

  const handleDelete = async (id: CarInfo["id"]) => {
    setSelectedListingId(id);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteReason) {
      message.error("يجب ان تختار سبب الحذف");
    }

    console.log(deleteReason);

    const res = await deleteListingById(
      selectedListingId as string,
      deleteReason as string
    );
    setListings(listings?.filter((item) => item.id !== selectedListingId));
    setIsDeleteModalVisible(false);
    if (!res.success) {
      message.error("حدث خطأ ما");
    } else {
      message.info("تم الحذف بنجاح");
    }
  };

  const columns: TableProps<CarInfo>["columns"] = [
    {
      title: "الصورة",
      dataIndex: "image_urls",
      key: "image_urls",
      render: (_, { image_urls }) => {
        if (image_urls instanceof Array) {
          return image_urls.map((url, index) => (
            <Image
              key={index}
              src={url}
              alt="car"
              width={100}
              height={70}
              style={{ objectFit: "cover" }}
            />
          ));
        }
        return (
          <Image
            src={image_urls}
            alt="car"
            width={100}
            height={70}
            style={{ objectFit: "cover" }}
          />
        );
      },
    },
    {
      title: "الماركة",
      dataIndex: "make",
      key: "make",
      onFilter: (value, record) => record.make.includes(value as string),
      filters: Array.from(
        new Set(listings?.map((listing) => listing.make))
      ).map((make) => ({
        text: make,
        value: make,
      })),
      filterSearch: true,
    },
    {
      title: "موديل",
      dataIndex: "model",
      key: "model",
      onFilter: (value, record) => record.model.includes(value as string),
      filters: Array.from(
        new Set(listings?.map((listing) => listing.model))
      ).map((model) => ({
        text: model,
        value: model,
      })),
      filterSearch: true,
    },
    {
      title: "السعر",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (price: number) => {
        return price.toLocaleString("en");
      },
    },
    {
      title: "العملة",
      dataIndex: "currency",
      key: "currency",
      render: (currency: string) => {
        return currency === "syp" ? "ل.س" : "$";
      },
      onFilter: (value, record) => record.currency === value,
      filters: [
        { text: "ل.س", value: "syp" },
        { text: "$", value: "usd" },
      ],
      filterSearch: true,
    },
    {
      title: "المشاهدات",
      dataIndex: "views",
      key: "views",
      render: (views: number) => views.toLocaleString("en"),
      onFilter: (value, record) => record.views === value,
      filters: Array.from(
        new Set(listings?.map((listing) => listing.views))
      ).map((views) => ({
        text: views.toLocaleString("en"),
        value: views,
      })),
      filterSearch: true,
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (status: CarInfo["status"]) => {
        if (!status) return null;
        let color = "green";
        let text = "نشط";

        if (status === "pending") {
          color = "gold";
          text = "قيد المراجعة";
        } else if (status === "expired") {
          color = "red";
          text = "منتهي";
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "تاريخ النشر",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: Date) =>
        new Date(date).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      onFilter: (value, record) => {
        const recordDate = new Date(record.created_at);
        const filterDate = new Date(value as string);
        return recordDate.toDateString() === filterDate.toDateString();
      },
      filters: Array.from(
        new Set(listings?.map((listing) => listing.created_at))
      ).map((date) => ({
        text: new Date(date).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        value: date,
      })),
      filterSearch: true,
      sorter: (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      defaultSortOrder: "descend",
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "المميزات",
      dataIndex: "products",
      key: "products",
      render: (products: string) => {
        if (!products || products.length === 0) return "-";
        return <Tag color="blue">{products}</Tag>;
      },
      // expandable
      filters: Array.from(
        new Set(listings?.flatMap((listing) => listing.products || []))
      ).map((product) => ({
        text: product,
        value: product,
      })),
      filterSearch: true,
      width: "10%",
      responsive: ["lg"],
      // This column will only be visible on medium and larger screens
    },
    {
      title: "الإجراءات",
      key: "action",
      render: (_: null, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/car-listing/${record.id}`)}
          >
            عرض
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/edit-listing/${record.id}`)}
          >
            تعديل
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            حذف
          </Button>
        </Space>
      ),
    },
  ];

  const getFilteredListings = (status: string) => {
    return (
      listings?.filter((listing) => {
        return listing.status.toLowerCase() === status;
      }) || []
    );
  };

  return isMobile ? (
    <MobileEditListing
      loading={loading}
      getFilteredListings={getFilteredListings}
      handleDelete={handleDelete}
    />
  ) : (
    <Flex vertical>
      <Card title="إدارة إعلاناتي" bordered={false}>
        <Tabs
          defaultActiveKey="active"
          items={[
            {
              key: "active",
              label: `نشط (${getFilteredListings("active")?.length || 0})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={getFilteredListings("active")}
                  loading={loading}
                  rowKey="id"
                />
              ),
            },
            {
              key: "pending",
              label: `قيد المراجعة (${getFilteredListings("pending").length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={getFilteredListings("pending")}
                  loading={loading}
                  rowKey="id"
                />
              ),
            },
            {
              key: "expired",
              label: `منتهي (${getFilteredListings("expired").length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={getFilteredListings("expired")}
                  loading={loading}
                  rowKey="id"
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="تأكيد حذف الإعلان"
        open={isDeleteModalVisible}
        onOk={confirmDelete}
        loading={loading}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="حذف"
        cancelText="إلغاء"
        okButtonProps={{ danger: true }}
      >
        <Select
          style={{ width: "100%", marginBottom: 16 }}
          placeholder="سبب الحذف"
          onChange={(value) => setDeleteReason(value)}
          options={[
            { value: "sold", label: "تم البيع" },
            { value: "changed_mind", label: "تغيير الرأي" },
            { value: "price_change", label: "تغيير السعر" },
            { value: "other", label: "سبب آخر" },
          ]}
        />
        <p>هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.</p>
      </Modal>
    </Flex>
  );
};

export default UserListings;
