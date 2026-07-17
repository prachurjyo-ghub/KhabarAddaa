"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";

type InvItem = {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastRestocked: string | null;
};

const empty = { name: "", category: "General", quantity: "0", unit: "pcs" };

export default function InventoryPage() {
  const [items, setItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockAmt, setRestockAmt] = useState("10");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sort === "name") params.set("sort", "name");
      if (sort === "qty_asc") params.set("sort", "qty_asc");
      if (sort === "qty_desc") params.set("sort", "qty_desc");
      const data = await apiFetch<{ items: InvItem[] }>(`/inventory?${params}`);
      setItems(data.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || "General",
        quantity: Number(form.quantity) || 0,
        unit: form.unit.trim() || "pcs",
      };
      if (editingId) {
        await apiFetch(`/inventory/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Updated");
      } else {
        await apiFetch("/inventory", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Created");
      }
      setForm(empty);
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await apiFetch(`/inventory/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function restock(id: string) {
    try {
      await apiFetch(`/inventory/${id}/restock`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(restockAmt) }),
      });
      toast.success("Restocked");
      setRestockId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Restock failed");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            Inventory
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            Stock levels auto-mark Low (≤10) and Out (0).
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="qty_asc">Qty ↑</SelectItem>
              <SelectItem value="qty_desc">Qty ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit item" : "Add item"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.quantity}
                      onChange={(e) =>
                        setForm({ ...form, quantity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Unit</Label>
                    <Input
                      value={form.unit}
                      onChange={(e) =>
                        setForm({ ...form, unit: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : editingId ? "Update" : "Create"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(null);
                        setForm(empty);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {loading && (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            )}
            {!loading && items.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-sm text-[var(--secondary)]">
                  No inventory items yet.
                </CardContent>
              </Card>
            )}
            {items.map((item) => (
              <Card key={item._id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{item.name}</h3>
                      <Badge
                        variant={
                          item.status === "Out of Stock"
                            ? "danger"
                            : item.status === "Low Stock"
                              ? "warning"
                              : "success"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--secondary)]">
                      {item.category} · {item.quantity} {item.unit}
                      {item.lastRestocked
                        ? ` · Restocked ${new Date(item.lastRestocked).toLocaleDateString()}`
                        : ""}
                    </p>
                    {restockId === item._id && (
                      <div className="mt-2 flex gap-2">
                        <Input
                          type="number"
                          min={1}
                          className="w-28"
                          value={restockAmt}
                          onChange={(e) => setRestockAmt(e.target.value)}
                        />
                        <Button size="sm" onClick={() => restock(item._id)}>
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRestockId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRestockId(item._id);
                        setRestockAmt("10");
                      }}
                    >
                      Restock
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(item._id);
                        setForm({
                          name: item.name,
                          category: item.category,
                          quantity: String(item.quantity),
                          unit: item.unit,
                        });
                      }}
                    >
                      <FiEdit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => remove(item._id)}
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
