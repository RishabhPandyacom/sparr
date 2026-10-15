import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WaitlistPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Auto-Apply Job Board
      </h1>
      <p className="mt-3 text-muted-foreground">
        We&apos;re building a job board that applies for you. Join the waitlist
        to get early access — coming soon.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/dashboard/job-board">Join the waitlist</Link>
      </Button>
    </div>
  );
}
