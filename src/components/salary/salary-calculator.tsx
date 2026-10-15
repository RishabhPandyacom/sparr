"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles, Loader2, TrendingUp } from "lucide-react";
import { estimateSalary, formatUsd } from "@/lib/salary/calculator";
import { generateSalaryScript } from "@/lib/salary/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SalaryCalculator() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [offer, setOffer] = useState("");
  const [script, setScript] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const estimate = useMemo(() => {
    if (!role.trim()) return null;
    return estimateSalary({
      role,
      location,
      experienceYears: Number(experience) || 0,
      currentOffer: Number(offer) || undefined,
    });
  }, [role, location, experience, offer]);

  function getScript() {
    if (!estimate) return;
    setScript(null);
    startTransition(async () => {
      const res = await generateSalaryScript({
        role,
        location: location || undefined,
        experienceYears: Number(experience) || undefined,
        currentOffer: Number(offer) || undefined,
        targetRange: `${formatUsd(estimate.recommendedAsk)}`,
      });
      setScript(res.script ?? res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Software Engineer" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="San Francisco / Remote / Bangalore" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="experience">Years of experience</Label>
              <Input id="experience" type="number" min={0} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="3" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offer">Current offer ($, optional)</Label>
              <Input id="offer" type="number" min={0} value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="120000" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimate */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" /> Estimated market range
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!estimate ? (
              <p className="text-sm text-muted-foreground">
                Enter your role to see an estimate.
              </p>
            ) : (
              <>
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Market range</p>
                    <p className="text-lg font-semibold">
                      {formatUsd(estimate.marketLow)} – {formatUsd(estimate.marketHigh)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Recommended ask</p>
                    <p className="text-lg font-semibold text-primary">
                      {formatUsd(estimate.recommendedAsk)}
                    </p>
                  </div>
                </div>
                {/* Range bar */}
                <div className="relative h-2 rounded-full bg-muted">
                  <div className="absolute inset-y-0 left-[15%] right-[15%] rounded-full bg-primary/30" />
                  <div
                    className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-background bg-primary"
                    style={{
                      left: `${Math.min(95, Math.max(2, ((estimate.recommendedAsk - estimate.marketLow) / (estimate.marketHigh - estimate.marketLow)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Rough estimate from role, location, and experience — use it as a
                  starting anchor, not gospel.
                </p>
                <Button className="mt-4 w-full" onClick={getScript} disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Get negotiation script
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {script && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your negotiation script</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {script}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
