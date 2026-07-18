"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiArrowLeft, FiEdit2, FiTrash2 } from "react-icons/fi";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { formatBDT } from "@/lib/utils";

type Category = { _id: string; name: string; isActive: boolean };
type MenuItem = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  category: { _id: string; name: string } | string;
  isFeatured: boolean;
  homepageBadge:
    | "none"
    | "weekly-best-seller"
    | "premium"
    | "popular"
    | "chef-special";
  customizable: boolean;
  sizes: Array<{ id: string; label: string; extra: number }>;
  toppings: Array<{ id: string; label: string; price: number }>;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  isActive: boolean;
};

type HomepageBadge = MenuItem["homepageBadge"];

const emptyForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  image: "",
  isFeatured: false,
  homepageBadge: "none" as HomepageBadge,
  customizable: false,
  sizesText: "",
  toppingsText: "",
  status: "In Stock" as MenuItem["status"],
  isActive: true,
};

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** Always merge into latest form — avoids wiping name/price/category after select/upload */
  function patchForm(patch: Partial<typeof emptyForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sort === "name") params.set("sort", "name");
      if (sort === "price_asc") params.set("sort", "price_asc");
      if (sort === "price_desc") params.set("sort", "price_desc");

      const [itemsData, catsData] = await Promise.all([
        apiFetch<{ items: MenuItem[] }>(`/menu/items?${params}`),
        apiFetch<{ categories: Category[] }>("/menu/categories"),
      ]);
      setItems(itemsData.items);
      setCategories(catsData.categories);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c._id, c.name]));
    return (item: MenuItem) => {
      if (typeof item.category === "object" && item.category) {
        return item.category.name;
      }
      return map.get(String(item.category)) || "—";
    };
  }, [categories]);

  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.append("image", file);
    const data = await apiFetch<{ url: string }>("/uploads", {
      method: "POST",
      body: fd,
      headers: {},
    });
    return data.url;
  }

  function parsePairs(text: string, mode: "size" | "topping") {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const [label, extra] = line.split("|").map((s) => s.trim());
        if (mode === "size") {
          return {
            id: `size-${idx + 1}`,
            label: label || `Size ${idx + 1}`,
            extra: Number(extra) || 0,
          };
        }
        return {
          id: `top-${idx + 1}`,
          label: label || `Topping ${idx + 1}`,
          price: Number(extra) || 0,
        };
      });
  }

  const popularCount = useMemo(
    () => items.filter((i) => i.homepageBadge === "popular").length,
    [items]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const category = form.category.trim();
    const priceNum = Number(form.price);
    if (!name || !category || form.price === "" || Number.isNaN(priceNum)) {
      toast.error("Name, category, and price are required");
      return;
    }

    const wasPopular =
      editingId != null &&
      items.find((i) => i._id === editingId)?.homepageBadge === "popular";
    if (
      form.homepageBadge === "popular" &&
      !wasPopular &&
      popularCount >= 6
    ) {
      toast.error(
        "Six popular dishes are already added. The seventh item can't be added as Popular."
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description: form.description,
        category,
        price: priceNum,
        image: form.image,
        isFeatured: form.isFeatured,
        homepageBadge: form.homepageBadge,
        customizable: form.customizable,
        sizes: form.customizable ? parsePairs(form.sizesText, "size") : [],
        toppings: form.customizable
          ? parsePairs(form.toppingsText, "topping")
          : [],
        status: form.status,
        isActive: form.isActive,
      };
      if (editingId) {
        await apiFetch(`/menu/items/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Item updated");
      } else {
        await apiFetch("/menu/items", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Item created");
      }
      clearToNewItem();
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function clearToNewItem() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function startEdit(item: MenuItem) {
    setEditingId(item._id);
    setForm({
      name: item.name,
      description: item.description || "",
      category:
        typeof item.category === "object"
          ? item.category._id
          : String(item.category),
      price: String(item.price),
      image: item.image || "",
      isFeatured: item.isFeatured,
      homepageBadge: item.homepageBadge || "none",
      customizable: item.customizable,
      sizesText: (item.sizes || [])
        .map((s) => `${s.label}|${s.extra}`)
        .join("\n"),
      toppingsText: (item.toppings || [])
        .map((t) => `${t.label}|${t.price}`)
        .join("\n"),
      status: item.status,
      isActive: item.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeItem(id: string) {
    try {
      await apiFetch(`/menu/items/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
              <Link href="/menu">
                <FiArrowLeft className="h-4 w-4" />
                Back to Menu
              </Link>
            </Button>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
              Menu items
            </h1>
            <p className="mt-1 text-sm text-[var(--secondary)]">
              Create dishes, upload images, and set homepage sections.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/menu/categories">Manage categories</Link>
          </Button>
        </div>

        {categories.length === 0 && (
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <p className="text-sm text-[var(--secondary)]">
                Create a category first before adding menu items.
              </p>
              <Button asChild>
                <Link href="/menu/categories">Create category</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price_asc">Price ↑</SelectItem>
              <SelectItem value="price_desc">Price ↓</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>
                  {editingId ? "Edit item" : "Create new item"}
                </CardTitle>
                {editingId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={clearToNewItem}
                  >
                    Add new item
                  </Button>
                )}
              </div>
              {editingId && (
                <p className="rounded-lg bg-[var(--primary-soft)] px-3 py-2 text-xs text-[var(--primary-dark)]">
                  Editing an existing dish. Press <strong>Update</strong> to
                  save changes, or <strong>Add new item</strong> to discard and
                  create something else.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => patchForm({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      patchForm({ description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select
                    value={form.category || undefined}
                    onValueChange={(v) => patchForm({ category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          categories.length
                            ? "Select category"
                            : "Create a category first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                          {!c.isActive ? " (hidden)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Price (৳)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => patchForm({ price: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Image URL</Label>
                  <Input
                    value={form.image}
                    onChange={(e) => patchForm({ image: e.target.value })}
                    placeholder="Paste URL or upload"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadImage(file);
                        patchForm({ image: url });
                        toast.success("Image uploaded");
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Upload failed"
                        );
                      }
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) =>
                        patchForm({ isFeatured: e.target.checked })
                      }
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.customizable}
                      onChange={(e) =>
                        patchForm({ customizable: e.target.checked })
                      }
                    />
                    Customizable
                  </label>
                </div>
                <div className="space-y-1">
                  <Label>Homepage section</Label>
                  <Select
                    value={form.homepageBadge}
                    onValueChange={(v) => {
                      const next = v as HomepageBadge;
                      const wasPopular =
                        editingId != null &&
                        items.find((i) => i._id === editingId)
                          ?.homepageBadge === "popular";
                      if (
                        next === "popular" &&
                        !wasPopular &&
                        popularCount >= 6
                      ) {
                        toast.error(
                          "Six popular dishes are already added. The seventh item can't be added as Popular."
                        );
                        return;
                      }
                      patchForm({ homepageBadge: next });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="premium">Premium Dishes</SelectItem>
                      <SelectItem value="popular">
                        Popular Dishes ({popularCount}/6)
                      </SelectItem>
                      <SelectItem value="chef-special">
                        Chef&apos;s Specials
                      </SelectItem>
                      <SelectItem value="weekly-best-seller">
                        Weekly best seller
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-[var(--secondary)]">
                    Popular Dishes show on the homepage in a 2-column grid (up
                    to 6).
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Stock status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      patchForm({ status: v as MenuItem["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Stock">In Stock</SelectItem>
                      <SelectItem value="Low Stock">Low Stock</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.customizable && (
                  <>
                    <div className="space-y-1">
                      <Label>Sizes (one per line: Label|extra)</Label>
                      <Textarea
                        value={form.sizesText}
                        onChange={(e) =>
                          patchForm({ sizesText: e.target.value })
                        }
                        placeholder={"Regular|0\nLarge|50"}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Toppings (one per line: Label|price)</Label>
                      <Textarea
                        value={form.toppingsText}
                        onChange={(e) =>
                          patchForm({ toppingsText: e.target.value })
                        }
                        placeholder={"Extra Cheese|40"}
                      />
                    </div>
                  </>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={saving || !categories.length}>
                    {saving ? "Saving…" : editingId ? "Update" : "Create"}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearToNewItem}
                    >
                      Discard & add new
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {loading && (
              <>
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </>
            )}
            {!loading && items.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-sm text-[var(--secondary)]">
                  No menu items yet. Add your first dish.
                </CardContent>
              </Card>
            )}
            {!loading &&
              items.map((item) => (
                <Card key={item._id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--surface-container)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          item.image ||
                          "/Food_Items_Images/pasta.jpg"
                        }
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (el.dataset.fallback === "1") return;
                          el.dataset.fallback = "1";
                          el.src = "/Food_Items_Images/pasta.jpg";
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{item.name}</h3>
                        {item.isFeatured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        {item.homepageBadge === "premium" && (
                          <Badge variant="warning">Premium</Badge>
                        )}
                        {item.homepageBadge === "popular" && (
                          <Badge variant="warning">Popular</Badge>
                        )}
                        {item.homepageBadge === "chef-special" && (
                          <Badge variant="warning">Chef special</Badge>
                        )}
                        {item.homepageBadge === "weekly-best-seller" && (
                          <Badge variant="warning">Best seller</Badge>
                        )}
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
                        {categoryName(item)} · {formatBDT(item.price)}
                        {item.customizable ? " · Customizable" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startEdit(item)}
                      >
                        <FiEdit2 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => removeItem(item._id)}
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                        Delete
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
