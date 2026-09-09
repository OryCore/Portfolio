import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="relative z-10 flex max-w-md flex-col items-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">404</h1>
        <p className="mt-2 text-lg font-medium text-foreground">Page not found</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>

          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 cursor-pointer">
            <Home className="size-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
