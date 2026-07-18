"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { formatBDT } from "@/lib/utils";

type DeliveryFee = {
  _id: string;
  name: string;
  fee: number;
  minOrder: number;
  isActive: boolean;
};

type Scope = "all" | "category" | "product";

type VatRule = {
  _id: string;
  name: string;
  rate: number;
  appliesTo: Scope;
  categoryId?: string | null;
  productId?: string | null;
  isActive: boolean;
};

type Offer = {
  _id: string;
  name: string;
  type: "percent" | "fixed";
  value: number;
  appliesTo: Scope;
  categoryId?: string | null;
  productId?: string | null;
  isActive: boolean;
};

type Category = { _id: string; name: string };
type MenuItem = {
  _id: string;
  name: string;
  category: { _id: string; name: string } | string;
};

type ScopeForm = {
  appliesTo: Scope;
  categoryId: string;
  productId: string;
};

const emptyScope: ScopeForm = {
  appliesTo: "all",
  categoryId: "",
  productId: "",
};

function idOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: string })._id);
  }
  return String(value);
}

function ScopeFields({
  value,
  onChange,
  categories,
  products,
}: {
  value: ScopeForm;
  onChange: (next: ScopeForm) => void;
  categories: Category[];
  products: MenuItem[];
}) {
  const filteredProducts = useMemo(() => {
    if (value.appliesTo !== "product" || !value.categoryId) return products;
    return products.filter((p) => {
      const catId =
        typeof p.category === "object" ? p.category._id : String(p.category);
      return catId === value.categoryId;
    });
  }, [products, value.appliesTo, value.categoryId]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Applies to</Label>
        <Select
          value={value.appliesTo}
          onValueChange={(v) =>
            onChange({
              ...value,
              appliesTo: v as Scope,
              categoryId: v === "all" ? "" : value.categoryId,
              productId: v === "product" ? value.productId : "",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All menu</SelectItem>
            <SelectItem value="category">Specific category</SelectItem>
            <SelectItem value="product">Specific product</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(value.appliesTo === "category" || value.appliesTo === "product") && (
        <div className="space-y-1">
          <Label>
            {value.appliesTo === "category"
              ? "Category"
              : "Category (optional filter)"}
          </Label>
          <Select
            value={value.categoryId || undefined}
            onValueChange={(v) =>
              onChange({
                ...value,
                categoryId: v,
                productId: "",
              })
            }
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  categories.length
                    ? "Select category"
                    : "No categories yet"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.appliesTo === "product" && (
        <div className="space-y-1">
          <Label>Product</Label>
          <Select
            value={value.productId || undefined}
            onValueChange={(v) => onChange({ ...value, productId: v })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  filteredProducts.length
                    ? "Select product"
                    : "No products available"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredProducts.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export default function FinancialsPage() {
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [vatRules, setVatRules] = useState<VatRule[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [feeForm, setFeeForm] = useState({
    name: "",
    fee: "",
    minOrder: "0",
    isActive: true,
  });
  const [feeEdit, setFeeEdit] = useState<string | null>(null);

  const [vatForm, setVatForm] = useState({
    name: "",
    rate: "",
    isActive: true,
    ...emptyScope,
  });
  const [vatEdit, setVatEdit] = useState<string | null>(null);

  const [offerForm, setOfferForm] = useState({
    name: "",
    type: "percent" as "percent" | "fixed",
    value: "",
    isActive: true,
    ...emptyScope,
  });
  const [offerEdit, setOfferEdit] = useState<string | null>(null);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c._id, c.name]));
    return (id?: string | null) => (id ? map.get(id) || id : "—");
  }, [categories]);

  const productName = useMemo(() => {
    const map = new Map(products.map((p) => [p._id, p.name]));
    return (id?: string | null) => (id ? map.get(id) || id : "—");
  }, [products]);

  const scopeLabel = useCallback(
    (row: { appliesTo: Scope; categoryId?: string | null; productId?: string | null }) => {
      if (row.appliesTo === "category") {
        return `Category · ${categoryName(idOf(row.categoryId))}`;
      }
      if (row.appliesTo === "product") {
        return `Product · ${productName(idOf(row.productId))}`;
      }
      return "All menu";
    },
    [categoryName, productName]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fees, vat, offs, menu] = await Promise.all([
        apiFetch<{ deliveryFees: DeliveryFee[] }>("/financials/delivery-fees"),
        apiFetch<{ vatRules: VatRule[] }>("/financials/vat-rules"),
        apiFetch<{ offers: Offer[] }>("/financials/offers"),
        // Public menu avoids requiring "menu" permission for financials staff
        apiFetch<{ categories: Category[]; items: MenuItem[] }>("/menu/public"),
      ]);
      setDeliveryFees(fees.deliveryFees);
      setVatRules(vat.vatRules);
      setOffers(offs.offers);
      setCategories(menu.categories);
      setProducts(menu.items);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function validateScope(scope: ScopeForm, label: string) {
    if (scope.appliesTo === "category" && !scope.categoryId) {
      toast.error(`${label}: select a category`);
      return false;
    }
    if (scope.appliesTo === "product" && !scope.productId) {
      toast.error(`${label}: select a product`);
      return false;
    }
    return true;
  }

  function scopePayload(scope: ScopeForm) {
    return {
      appliesTo: scope.appliesTo,
      categoryId:
        scope.appliesTo === "category" || scope.appliesTo === "product"
          ? scope.categoryId || null
          : null,
      productId: scope.appliesTo === "product" ? scope.productId || null : null,
    };
  }

  async function saveFee(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        name: feeForm.name,
        fee: Number(feeForm.fee),
        minOrder: Number(feeForm.minOrder) || 0,
        isActive: feeForm.isActive,
      };
      if (feeEdit) {
        await apiFetch(`/financials/delivery-fees/${feeEdit}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Fee updated");
      } else {
        await apiFetch("/financials/delivery-fees", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Fee created");
      }
      setFeeForm({ name: "", fee: "", minOrder: "0", isActive: true });
      setFeeEdit(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function saveVat(e: FormEvent) {
    e.preventDefault();
    if (!validateScope(vatForm, "VAT")) return;
    try {
      const payload = {
        name: vatForm.name,
        rate: Number(vatForm.rate),
        isActive: vatForm.isActive,
        ...scopePayload(vatForm),
      };
      if (vatEdit) {
        await apiFetch(`/financials/vat-rules/${vatEdit}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("VAT updated");
      } else {
        await apiFetch("/financials/vat-rules", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("VAT created");
      }
      setVatForm({ name: "", rate: "", isActive: true, ...emptyScope });
      setVatEdit(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function saveOffer(e: FormEvent) {
    e.preventDefault();
    if (!validateScope(offerForm, "Offer")) return;
    try {
      const payload = {
        name: offerForm.name,
        type: offerForm.type,
        value: Number(offerForm.value),
        isActive: offerForm.isActive,
        ...scopePayload(offerForm),
      };
      if (offerEdit) {
        await apiFetch(`/financials/offers/${offerEdit}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Offer updated");
      } else {
        await apiFetch("/financials/offers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Offer created");
      }
      setOfferForm({
        name: "",
        type: "percent",
        value: "",
        isActive: true,
        ...emptyScope,
      });
      setOfferEdit(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            Financials
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            Delivery fees, VAT, and offers — apply to all menu, a category, or a
            single product.
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-64" />
        ) : (
          <Tabs defaultValue="fees">
            <TabsList>
              <TabsTrigger value="fees">Delivery fees</TabsTrigger>
              <TabsTrigger value="vat">VAT</TabsTrigger>
              <TabsTrigger value="offers">Offers</TabsTrigger>
            </TabsList>

            <TabsContent value="fees">
              <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>{feeEdit ? "Edit fee" : "Add fee"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={saveFee} className="space-y-3">
                      <div className="space-y-1">
                        <Label>Name</Label>
                        <Input
                          value={feeForm.name}
                          onChange={(e) =>
                            setFeeForm({ ...feeForm, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label>Fee (৳)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={feeForm.fee}
                            onChange={(e) =>
                              setFeeForm({ ...feeForm, fee: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Min order</Label>
                          <Input
                            type="number"
                            min={0}
                            value={feeForm.minOrder}
                            onChange={(e) =>
                              setFeeForm({
                                ...feeForm,
                                minOrder: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={feeForm.isActive}
                          onChange={(e) =>
                            setFeeForm({
                              ...feeForm,
                              isActive: e.target.checked,
                            })
                          }
                        />
                        Active
                      </label>
                      <div className="flex gap-2">
                        <Button type="submit">
                          {feeEdit ? "Update" : "Create"}
                        </Button>
                        {feeEdit && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setFeeEdit(null);
                              setFeeForm({
                                name: "",
                                fee: "",
                                minOrder: "0",
                                isActive: true,
                              });
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
                  {deliveryFees.map((f) => (
                    <Card key={f._id}>
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{f.name}</p>
                            <Badge variant={f.isActive ? "success" : "outline"}>
                              {f.isActive ? "Active" : "Off"}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--secondary)]">
                            {formatBDT(f.fee)} · min order{" "}
                            {formatBDT(f.minOrder)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setFeeEdit(f._id);
                              setFeeForm({
                                name: f.name,
                                fee: String(f.fee),
                                minOrder: String(f.minOrder),
                                isActive: f.isActive,
                              });
                            }}
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={async () => {
                              try {
                                await apiFetch(
                                  `/financials/delivery-fees/${f._id}`,
                                  { method: "DELETE" }
                                );
                                toast.success("Deleted");
                                await load();
                              } catch (err) {
                                toast.error(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed"
                                );
                              }
                            }}
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vat">
              <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>{vatEdit ? "Edit VAT" : "Add VAT"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={saveVat} className="space-y-3">
                      <div className="space-y-1">
                        <Label>Name</Label>
                        <Input
                          value={vatForm.name}
                          onChange={(e) =>
                            setVatForm({ ...vatForm, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Rate (%)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={vatForm.rate}
                          onChange={(e) =>
                            setVatForm({ ...vatForm, rate: e.target.value })
                          }
                          required
                        />
                      </div>
                      <ScopeFields
                        value={vatForm}
                        onChange={(scope) =>
                          setVatForm((prev) => ({ ...prev, ...scope }))
                        }
                        categories={categories}
                        products={products}
                      />
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={vatForm.isActive}
                          onChange={(e) =>
                            setVatForm({
                              ...vatForm,
                              isActive: e.target.checked,
                            })
                          }
                        />
                        Active
                      </label>
                      <div className="flex gap-2">
                        <Button type="submit">
                          {vatEdit ? "Update" : "Create"}
                        </Button>
                        {vatEdit && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setVatEdit(null);
                              setVatForm({
                                name: "",
                                rate: "",
                                isActive: true,
                                ...emptyScope,
                              });
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
                  {vatRules.length === 0 && (
                    <Card>
                      <CardContent className="p-6 text-sm text-[var(--secondary)]">
                        No VAT rules yet.
                      </CardContent>
                    </Card>
                  )}
                  {vatRules.map((v) => (
                    <Card key={v._id}>
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{v.name}</p>
                            <Badge variant={v.isActive ? "success" : "outline"}>
                              {v.isActive ? "Active" : "Off"}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--secondary)]">
                            {v.rate}% · {scopeLabel(v)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setVatEdit(v._id);
                              setVatForm({
                                name: v.name,
                                rate: String(v.rate),
                                isActive: v.isActive,
                                appliesTo: (v.appliesTo || "all") as Scope,
                                categoryId: idOf(v.categoryId),
                                productId: idOf(v.productId),
                              });
                            }}
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={async () => {
                              try {
                                await apiFetch(
                                  `/financials/vat-rules/${v._id}`,
                                  { method: "DELETE" }
                                );
                                toast.success("Deleted");
                                await load();
                              } catch (err) {
                                toast.error(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed"
                                );
                              }
                            }}
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="offers">
              <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {offerEdit ? "Edit offer" : "Add offer"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={saveOffer} className="space-y-3">
                      <div className="space-y-1">
                        <Label>Name</Label>
                        <Input
                          value={offerForm.name}
                          onChange={(e) =>
                            setOfferForm({
                              ...offerForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label>Type</Label>
                          <Select
                            value={offerForm.type}
                            onValueChange={(v) =>
                              setOfferForm({
                                ...offerForm,
                                type: v as "percent" | "fixed",
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">Percent</SelectItem>
                              <SelectItem value="fixed">Fixed ৳</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Value</Label>
                          <Input
                            type="number"
                            min={0}
                            value={offerForm.value}
                            onChange={(e) =>
                              setOfferForm({
                                ...offerForm,
                                value: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <ScopeFields
                        value={offerForm}
                        onChange={(scope) =>
                          setOfferForm((prev) => ({ ...prev, ...scope }))
                        }
                        categories={categories}
                        products={products}
                      />
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={offerForm.isActive}
                          onChange={(e) =>
                            setOfferForm({
                              ...offerForm,
                              isActive: e.target.checked,
                            })
                          }
                        />
                        Active
                      </label>
                      <div className="flex gap-2">
                        <Button type="submit">
                          {offerEdit ? "Update" : "Create"}
                        </Button>
                        {offerEdit && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setOfferEdit(null);
                              setOfferForm({
                                name: "",
                                type: "percent",
                                value: "",
                                isActive: true,
                                ...emptyScope,
                              });
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
                  {offers.length === 0 && (
                    <Card>
                      <CardContent className="p-6 text-sm text-[var(--secondary)]">
                        No offers yet.
                      </CardContent>
                    </Card>
                  )}
                  {offers.map((o) => (
                    <Card key={o._id}>
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{o.name}</p>
                            <Badge variant={o.isActive ? "success" : "outline"}>
                              {o.isActive ? "Active" : "Off"}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--secondary)]">
                            {o.type === "percent"
                              ? `${o.value}% off`
                              : `${formatBDT(o.value)} off`}{" "}
                            · {scopeLabel(o)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setOfferEdit(o._id);
                              setOfferForm({
                                name: o.name,
                                type: o.type,
                                value: String(o.value),
                                isActive: o.isActive,
                                appliesTo: (o.appliesTo || "all") as Scope,
                                categoryId: idOf(o.categoryId),
                                productId: idOf(o.productId),
                              });
                            }}
                          >
                            <FiEdit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={async () => {
                              try {
                                await apiFetch(`/financials/offers/${o._id}`, {
                                  method: "DELETE",
                                });
                                toast.success("Deleted");
                                await load();
                              } catch (err) {
                                toast.error(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed"
                                );
                              }
                            }}
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminShell>
  );
}
