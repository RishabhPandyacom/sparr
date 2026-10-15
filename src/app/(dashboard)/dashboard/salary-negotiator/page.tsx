import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { SalaryCalculator } from "@/components/salary/salary-calculator";

export default async function SalaryNegotiatorPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Salary Negotiator"
        description="Estimate your market range, then get a six-line script to ask for more."
      />
      <SalaryCalculator />
    </div>
  );
}
