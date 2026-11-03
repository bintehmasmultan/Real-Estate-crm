"use client";

import { useState, useTransition } from "react";
import { Building } from "lucide-react";
import { toast } from "sonner";
import { createPublicLead } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAD_SOURCES, PROPERTY_TYPES, labelize } from "@/lib/constants";

export default function PublicLeadPage() {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>Thanks — we got your inquiry</CardTitle>
            <CardDescription>
              An agent will contact you shortly.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_45%)]" />
      <Card className="relative z-10 w-full max-w-xl border-slate-800 bg-slate-900/90 text-slate-50">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
            <Building className="h-5 w-5" />
          </div>
          <CardTitle className="text-white">Tell us what you&apos;re looking for</CardTitle>
          <CardDescription className="text-slate-400">
            Public lead capture for EstateCRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
            action={(fd) => {
              startTransition(async () => {
                try {
                  await createPublicLead(fd);
                  setDone(true);
                } catch {
                  toast.error("Could not submit lead");
                }
              });
            }}
          >
            <div className="space-y-1">
              <Label className="text-slate-200">First name</Label>
              <Input name="firstName" required className="border-slate-700 bg-slate-950 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-200">Last name</Label>
              <Input name="lastName" required className="border-slate-700 bg-slate-950 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-200">Email</Label>
              <Input name="email" type="email" className="border-slate-700 bg-slate-950 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-200">Phone</Label>
              <Input name="phone" className="border-slate-700 bg-slate-950 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-200">Source</Label>
              <Select name="source" defaultValue="WEBSITE" className="border-slate-700 bg-slate-950 text-white">
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>{labelize(s)}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-200">Budget</Label>
              <Input name="budget" type="number" className="border-slate-700 bg-slate-950 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-200">Property type</Label>
              <Select name="preferredType" className="border-slate-700 bg-slate-950 text-white">
                <option value="">Any</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{labelize(t)}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-200">Preferred location</Label>
              <Input name="preferredLocation" className="border-slate-700 bg-slate-950 text-white" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-slate-200">Message</Label>
              <Textarea name="message" className="border-slate-700 bg-slate-950 text-white" />
            </div>
            <Button type="submit" className="sm:col-span-2" disabled={pending}>
              {pending ? "Submitting..." : "Submit inquiry"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
