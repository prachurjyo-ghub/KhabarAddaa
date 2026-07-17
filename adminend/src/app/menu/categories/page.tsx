"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiArrowLeft, FiTrash2 } from "react-icons/fi";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";

type Category = { _id: string; name: string; isActive: boolean };

export default function MenuCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ categories: Category[] }>("/menu/categories");
      setCategories(data.categories);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/menu/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      setNewCategory("");
      toast.success("Category created");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function renameCategory(id: string, name: string) {
    const next = name.trim();
    if (!next) return;
    try {
      await apiFetch(`/menu/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: next }),
      });
      toast.success("Category updated");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function toggleCategory(id: string, isActive: boolean) {
    try {
      await apiFetch(`/menu/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function removeCategory(id: string) {
    if (!confirm("Delete this category? It must have no menu items.")) return;
    try {
      await apiFetch(`/menu/categories/${id}`, { method: "DELETE" });
      toast.success("Category deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
              <Link href="/menu">
                <FiArrowLeft className="h-4 w-4" />
                Back to Menu
              </Link>
            </Button>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
              Categories
            </h1>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Create and organize categories used when adding menu items.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/menu/items">Go to menu items</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create category</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-wrap gap-2" onSubmit={addCategory}>
              <Input
                placeholder="New category name (e.g. Pizza, Drinks)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="max-w-sm"
              />
              <Button type="submit" disabled={!newCategory.trim() || saving}>
                {saving ? "Creating…" : "Create category"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All categories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            )}
            {!loading && categories.length === 0 && (
              <p className="text-sm text-[var(--secondary)]">
                No categories yet. Create one before adding menu items.
              </p>
            )}
            {!loading && categories.length > 0 && (
              <ul className="divide-y divide-[var(--outline-variant)] rounded-lg border border-[var(--outline-variant)]">
                {categories.map((c) => (
                  <li
                    key={c._id}
                    className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                  >
                    <Input
                      defaultValue={c.name}
                      className="max-w-xs"
                      onBlur={(e) => {
                        if (e.target.value.trim() !== c.name) {
                          void renameCategory(c._id, e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                      }}
                    />
                    <Badge variant={c.isActive ? "success" : "outline"}>
                      {c.isActive ? "Active" : "Hidden"}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleCategory(c._id, !c.isActive)}
                    >
                      {c.isActive ? "Hide" : "Show"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => removeCategory(c._id)}
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
