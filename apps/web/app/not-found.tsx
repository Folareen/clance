"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="h-16 flex items-center px-5 sm:px-6 border-b border-stroke">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-content font-semibold text-lg tracking-tight">
            Clance
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 sm:px-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center">
            <Compass className="w-8 h-8 text-accent" strokeWidth={1.75} />
          </div>

          <p className="text-sm font-semibold text-accent mb-2">404</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-content tracking-tight mb-3">
            This page wandered off
          </h1>
          <p className="text-content-secondary text-sm sm:text-base mb-8">
            The page you&rsquo;re looking for doesn&rsquo;t exist, moved, or
            the link is broken. Let&rsquo;s get you back on track.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => router.back()}>
              Go back
            </Button>
            <Link href="/">
              <Button variant="primary">Back to home</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
