import "./App.css";
import SearchSelect from "./components/SearchSelect";
import MyLayout from "./Layout";
import PaginatedCards from "./components/PaginatedCards";
import { useSearchParams } from "react-router";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <MyLayout>
      <SearchSelect onSearch={(params) => setSearchParams(params)} />
      <PaginatedCards searchParams={searchParams} />
    </MyLayout>
  );
}

export default App;
