import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background/90 p-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-red-500/5 blur-3xl" />
      </div>
      <div className="relative text-center animate-in-up">
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-red-500 to-rose-600 shadow-xl shadow-red-500/20">
          <span className="text-5xl font-extrabold text-white">404</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Trang không tồn tại</h1>
        <p className="mt-3 text-muted-foreground">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-6 py-3 font-bold text-white shadow-lg shadow-red-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            <Home className="h-4 w-4" /> Về trang chủ
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium text-foreground shadow-sm transition hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
