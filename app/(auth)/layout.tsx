import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xl">
            L
          </div>
          <span className="font-bold text-2xl">Lidia</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
