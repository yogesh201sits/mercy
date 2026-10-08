import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F7] p-6">
      <div className="w-full max-w-md border border-black bg-white">
        <div className="border-b border-black bg-black px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-[#39FF14]" />

            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white">
              404 · Not found
            </span>
          </div>
        </div>

        <div className="p-6">
          <p className="font-mono text-5xl font-semibold tracking-tight">
            404
          </p>

          <h1 className="mt-4 text-lg font-semibold tracking-tight">
            Page not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-black/50">
            The resource you requested does not exist or may have been
            moved.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex border border-black bg-black px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#39FF14] transition-colors hover:bg-[#39FF14] hover:text-black"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}