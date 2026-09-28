import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-900">
      <section className="max-w-md text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-600 text-slate-50">
          <Sparkles size={22} />
        </div>
        <p className="mt-7 text-sm font-semibold text-indigo-600">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This page does not exist or may have moved.
        </p>
        <Link href="/" className="mt-7 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-slate-50">
          Return to RecallAI
        </Link>
      </section>
    </main>
  );
}
