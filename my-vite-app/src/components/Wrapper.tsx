import { useAuth } from "../hooks/useAuth";

function Wrapper({ children }: { children: React.ReactNode }) {
  const { isLoading, error } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Oops... {error}</div>;
  }
  return <>{children}</>;
}
export default Wrapper;
