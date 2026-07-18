"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FiArrowLeft, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
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

type SizeRow = { id: string; label: string; extra: string };
type ToppingRow = { id: string; label: string; price: string };

const emptyForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  image: "",
  isFeatured: false,
  isChefSpecial: false,
  homepageBadge: "none" as Exclude<HomepageBadge, "chef-special">,
  customizable: false,
  sizes: [] as SizeRow[],
  toppings: [] as ToppingRow[],
  status: "In Stock" as MenuItem["status"],
  isActive: true,
};

function newRowId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
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
      const [itemsData, catsData] = await Promise.all([
        apiFetch<{ items: MenuItem[] }>("/menu/items"),
        apiFetch<{ categories: Category[] }>("/menu/categories"),
      ]);
      setItems(itemsData.items);
      setCategories(catsData.categories);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const filteredItems = useMemo(() => {
    let list = [...items];
    if (categoryFilter !== "all") {
      list = list.filter((i) => {
        const id =
          typeof i.category === "object" ? i.category._id : String(i.category);
        return id === categoryFilter;
      });
    }
    if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.slug?.toLowerCase().includes(q)
      );
    }
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => b._id.localeCompare(a._id));
    return list;
  }, [items, categoryFilter, statusFilter, search, sort]);

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

  const popularCount = useMemo(
    () => items.filter((i) => i.homepageBadge === "popular").length,
    [items]
  );
  const featuredCount = useMemo(
    () => items.filter((i) => i.isFeatured).length,
    [items]
  );
  const chefCount = useMemo(
    () => items.filter((i) => i.homepageBadge === "chef-special").length,
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

    const editing = editingId
      ? items.find((i) => i._id === editingId)
      : undefined;
    const wasFeatured = Boolean(editing?.isFeatured);
    if (form.isFeatured && !wasFeatured && featuredCount >= 3) {
      toast.error(
        "Three featured dishes are already set. Unfeature one first."
      );
      return;
    }

    const wasPopular = editing?.homepageBadge === "popular";
    if (
      !form.isChefSpecial &&
      form.homepageBadge === "popular" &&
      !wasPopular &&
      popularCount >= 6
    ) {
      toast.error(
        "Six popular dishes are already added. The seventh item can't be added as Popular."
      );
      return;
    }

    const homepageBadge: HomepageBadge = form.isChefSpecial
      ? "chef-special"
      : form.homepageBadge;

    setSaving(true);
    try {
      const payload = {
        name,
        description: form.description,
        category,
        price: priceNum,
        image: form.image,
        isFeatured: form.isFeatured,
        homepageBadge,
        customizable: form.customizable,
        sizes: form.customizable
          ? form.sizes
              .filter((s) => s.label.trim())
              .map((s, idx) => ({
                id: s.id || `size-${idx + 1}`,
                label: s.label.trim(),
                extra: Number(s.extra) || 0,
              }))
          : [],
        toppings: form.customizable
          ? form.toppings
              .filter((t) => t.label.trim())
              .map((t, idx) => ({
                id: t.id || `top-${idx + 1}`,
                label: t.label.trim(),
                price: Number(t.price) || 0,
              }))
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
    const badge = item.homepageBadge || "none";
    const isChef = badge === "chef-special";
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
      isChefSpecial: isChef,
      homepageBadge: isChef
        ? "none"
        : (badge as Exclude<HomepageBadge, "chef-special">),
      customizable: item.customizable,
      sizes: (item.sizes || []).map((s) => ({
        id: s.id || newRowId(),
        label: s.label,
        extra: String(s.extra ?? 0),
      })),
      toppings: (item.toppings || []).map((t) => ({
        id: t.id || newRowId(),
        label: t.label,
        price: String(t.price ?? 0),
      })),
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
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const wasFeatured =
                          editingId != null &&
                          items.find((i) => i._id === editingId)?.isFeatured;
                        if (checked && !wasFeatured && featuredCount >= 3) {
                          toast.error(
                            "Three featured dishes are already set. Unfeature one first."
                          );
                          return;
                        }
                        patchForm({ isFeatured: checked });
                      }}
                    />
                    Featured ({featuredCount}/3)
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.isChefSpecial}
                      onChange={(e) =>
                        patchForm({ isChefSpecial: e.target.checked })
                      }
                    />
                    Chef&apos;s Special ({chefCount})
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={form.customizable}
                      onChange={(e) => {
                        const on = e.target.checked;
                        patchForm({
                          customizable: on,
                          sizes:
                            on && form.sizes.length === 0
                              ? [
                                  {
                                    id: newRowId(),
                                    label: "Regular",
                                    extra: "0",
                                  },
                                ]
                              : form.sizes,
                        });
                      }}
                    />
                    Customizable (sizes & toppings)
                  </label>
                </div>
                {!form.isChefSpecial && (
                  <div className="space-y-1">
                    <Label>Homepage section</Label>
                    <Select
                      value={form.homepageBadge}
                      onValueChange={(v) => {
                        const next = v as Exclude<
                          HomepageBadge,
                          "chef-special"
                        >;
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
                        <SelectItem value="weekly-best-seller">
                          Weekly best seller
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[var(--secondary)]">
                      Chef&apos;s Special is a separate checkbox above (not a
                      category).
                    </p>
                  </div>
                )}
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
                  <div className="space-y-4 rounded-lg border border-[var(--outline-variant)] p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label>Sizes</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            patchForm({
                              sizes: [
                                ...form.sizes,
                                { id: newRowId(), label: "", extra: "0" },
                              ],
                            })
                          }
                        >
                          <FiPlus className="h-3.5 w-3.5" />
                          Add size
                        </Button>
                      </div>
                      {form.sizes.map((row, idx) => (
                        <div key={row.id} className="flex gap-2">
                          <Input
                            placeholder="Label (e.g. Large)"
                            value={row.label}
                            onChange={(e) => {
                              const sizes = [...form.sizes];
                              sizes[idx] = { ...row, label: e.target.value };
                              patchForm({ sizes });
                            }}
                          />
                          <Input
                            type="number"
                            min={0}
                            className="w-24 shrink-0"
                            placeholder="Extra"
                            value={row.extra}
                            onChange={(e) => {
                              const sizes = [...form.sizes];
                              sizes[idx] = { ...row, extra: e.target.value };
                              patchForm({ sizes });
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              patchForm({
                                sizes: form.sizes.filter((_, i) => i !== idx),
                              })
                            }
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label>Toppings</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            patchForm({
                              toppings: [
                                ...form.toppings,
                                { id: newRowId(), label: "", price: "0" },
                              ],
                            })
                          }
                        >
                          <FiPlus className="h-3.5 w-3.5" />
                          Add topping
                        </Button>
                      </div>
                      {form.toppings.map((row, idx) => (
                        <div key={row.id} className="flex gap-2">
                          <Input
                            placeholder="Label (e.g. Extra cheese)"
                            value={row.label}
                            onChange={(e) => {
                              const toppings = [...form.toppings];
                              toppings[idx] = {
                                ...row,
                                label: e.target.value,
                              };
                              patchForm({ toppings });
                            }}
                          />
                          <Input
                            type="number"
                            min={0}
                            className="w-24 shrink-0"
                            placeholder="Price"
                            value={row.price}
                            onChange={(e) => {
                              const toppings = [...form.toppings];
                              toppings[idx] = {
                                ...row,
                                price: e.target.value,
                              };
                              patchForm({ toppings });
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              patchForm({
                                toppings: form.toppings.filter(
                                  (_, i) => i !== idx
                                ),
                              })
                            }
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
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
            {!loading && items.length > 0 && filteredItems.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-sm text-[var(--secondary)]">
                  No items match these filters.
                </CardContent>
              </Card>
            )}
            {!loading &&
              filteredItems.map((item) => (
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
