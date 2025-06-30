import { Link } from "react-router";
import { User } from "../../types/api.types";

const ReportBtn = ({
  id,
  toReport,
}: {
  id: User["id"];
  toReport: "user" | "listing";
}) => {
  return (
    <Link
      to={`/report/${id}/${toReport}`}
      className="text-red-500 hover:text-red-700"
    >
      <span className="text-sm">الإبلاغ </span>
    </Link>
  );
};

export default ReportBtn;
