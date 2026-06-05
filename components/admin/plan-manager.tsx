"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPkr } from "@/lib/format";
import type { Plan } from "@/lib/types";
import {
  createPlan,
  updatePlan,
  deletePlan,
  type PlanInput,
} from "@/app/admin/plans/actions";

export function PlanManager({
  plans,
  canEdit,
}: {
  plans: Plan[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onDelete(id: string) {
    if (!confirm("Delete this plan?")) return;
    setBusyId(id);
    const res = await deletePlan(id);
    setBusyId(null);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setCreating(true);
              setEditing(null);
            }}
          >
            <Plus className="h-4 w-4" /> New plan
          </Button>
        </div>
      )}

      {canEdit && (creating || editing) && (
        <PlanForm
          plan={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-ink-muted">
            No plans yet.
          </p>
        ) : (
          plans.map((p) => (
            <Card key={p.id}>
              <CardContent className="space-y-3 py-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-navy">{p.name}</h3>
                    <p className="text-2xl font-bold text-brand">
                      {formatPkr(p.price_pkr)}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {p.duration_days} days access
                    </p>
                  </div>
                  <Badge variant={p.active ? "success" : "destructive"}>
                    {p.active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {p.description && (
                  <p className="text-sm text-ink-mid">{p.description}</p>
                )}

                {p.features && p.features.length > 0 && (
                  <ul className="space-y-1 text-sm">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {canEdit && (
                  <div className="flex gap-1 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(p);
                        setCreating(false);
                      }}
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(p.id)}
                      disabled={busyId === p.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function PlanForm({
  plan,
  onClose,
  onSaved,
}: {
  plan: Plan | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [price, setPrice] = useState(String(plan?.price_pkr ?? ""));
  const [duration, setDuration] = useState(String(plan?.duration_days ?? 30));
  const [features, setFeatures] = useState((plan?.features ?? []).join("\n"));
  const [active, setActive] = useState(plan?.active ?? true);
  const [position, setPosition] = useState(String(plan?.position ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const payload: PlanInput = {
      id: plan?.id,
      name,
      description: description || null,
      pricePkr: parseInt(price, 10),
      durationDays: parseInt(duration, 10),
      features: features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      active,
      position: Number(position) || 0,
    };
    const res = plan ? await updatePlan(payload) : await createPlan(payload);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else onSaved();
  }

  return (
    <Card className="border-brand/30">
      <CardContent className="py-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 3 Month Premium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Order position</Label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short tagline shown under the plan name…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Price (PKR)</Label>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 1500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration (days)</Label>
              <Input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Features (one per line)</Label>
            <Textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder={"All mock tests\nVideo lectures\nDownloadable notes"}
              className="min-h-[120px]"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Active (shown on pricing page)
          </label>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : plan ? "Save changes" : "Create plan"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
