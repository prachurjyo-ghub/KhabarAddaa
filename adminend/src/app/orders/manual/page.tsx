"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FiCheck, FiChevronRight, FiMinus, FiPlus, FiSearch,
  FiShoppingBag, FiTrash2, FiUser,
} from "react-icons/fi";
import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/media";
import { cn, formatBDT } from "@/lib/utils";

type Category = { _id: string; name: string };
type MenuItem = {
  _id: string; name: string; description: string; price: number; image: string;
  status: string; customizable: boolean;
  category: Category | string;
  sizes: Array<{ id: string; label: string; extra: number }>;
  toppings: Array<{ id: string; label: string; price: number }>;
};
type Table = { _id: string; name: string; seats: number };
type CartLine = {
  key: string; item: MenuItem; quantity: number; sizeId?: string;
  toppingIds: string[]; notes: string;
};
type Quote = { subtotal: number; discount: number; tax: number; deliveryFee: number; total: number };

function categoryId(item: MenuItem) {
  return typeof item.category === "object" ? item.category._id : item.category;
}

function lineUnitPrice(line: CartLine) {
  const size = line.item.sizes?.find((s) => s.id === line.sizeId);
  const toppings = line.item.toppings?.filter((t) => line.toppingIds.includes(t.id)) || [];
  return line.item.price + (size?.extra || 0) + toppings.reduce((sum, t) => sum + (t.price || 0), 0);
}

export default function ManualOrderPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);
  const [draftSize, setDraftSize] = useState("");
  const [draftToppings, setDraftToppings] = useState<string[]>([]);
  const [draftNotes, setDraftNotes] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState({
    name: "Walk-in customer", phone: "", orderType: "dine-in",
    tableId: "", address: "", instructions: "", paymentMethod: "cash",
    paymentStatus: "unpaid",
  });

  useEffect(() => {
    Promise.all([
      apiFetch<{ items: MenuItem[]; categories: Category[] }>("/menu/public"),
      apiFetch<{ tables: Table[] }>("/orders/available-tables"),
    ]).then(([menu, tableData]) => {
      setItems(menu.items.filter((item) => item.status !== "Out of Stock"));
      setCategories(menu.categories);
      setTables(tableData.tables);
    }).catch((err) => toast.error(err instanceof Error ? err.message : "Could not load order workspace"))
      .finally(() => setLoading(false));
  }, []);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => (category === "all" || categoryId(item) === category) && (!q || item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)));
  }, [items, category, search]);

  const localSubtotal = useMemo(() => cart.reduce((sum, line) => sum + lineUnitPrice(line) * line.quantity, 0), [cart]);

  useEffect(() => {
    if (!cart.length) { setQuote(null); return; }
    const timer = window.setTimeout(() => {
      apiFetch<{ quote: Quote }>("/orders/public/order-quote", {
        method: "POST",
        body: JSON.stringify({ orderType: customer.orderType, items: cart.map((line) => ({ menuItemId: line.item._id, quantity: line.quantity, sizeId: line.sizeId, toppingIds: line.toppingIds, notes: line.notes })) }),
      }).then((data) => setQuote(data.quote)).catch(() => setQuote(null));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [cart, customer.orderType]);

  function chooseItem(item: MenuItem) {
    if (item.sizes?.length || item.toppings?.length || item.customizable) {
      setDraftSize(item.sizes?.[0]?.id || ""); setDraftToppings([]); setDraftNotes(""); setCustomizing(item);
    } else addLine(item, "", [], "");
  }

  function addLine(item: MenuItem, sizeId: string, toppingIds: string[], notes: string) {
    const match = cart.find((line) => line.item._id === item._id && line.sizeId === sizeId && line.notes === notes && line.toppingIds.join(",") === toppingIds.join(","));
    if (match) setCart((current) => current.map((line) => line.key === match.key ? { ...line, quantity: line.quantity + 1 } : line));
    else setCart((current) => [...current, { key: `${item._id}-${Date.now()}-${Math.random()}`, item, quantity: 1, sizeId: sizeId || undefined, toppingIds, notes }]);
    setCustomizing(null);
  }

  function setQuantity(key: string, quantity: number) {
    if (quantity < 1) setCart((current) => current.filter((line) => line.key !== key));
    else setCart((current) => current.map((line) => line.key === key ? { ...line, quantity } : line));
  }

  function clearSale() {
    setCart([]); setQuote(null);
    setCustomer({ name: "Walk-in customer", phone: "", orderType: "dine-in", tableId: "", address: "", instructions: "", paymentMethod: "cash", paymentStatus: "unpaid" });
  }

  async function completeOrder() {
    if (!cart.length) return toast.error("Add at least one item");
    if (customer.orderType === "delivery" && !customer.address.trim()) return toast.error("Delivery address is required");
    setSaving(true);
    try {
      const table = tables.find((t) => t._id === customer.tableId);
      await apiFetch("/orders/manual", { method: "POST", body: JSON.stringify({
        customerName: customer.name.trim() || "Walk-in customer", customerPhone: customer.phone.trim(),
        orderType: customer.orderType, tableId: customer.tableId || undefined, tableName: table?.name || "",
        address: customer.address.trim(), instructions: customer.instructions.trim(),
        paymentMethod: customer.paymentMethod, paymentStatus: customer.paymentStatus,
        items: cart.map((line) => ({ menuItemId: line.item._id, quantity: line.quantity, sizeId: line.sizeId, toppingIds: line.toppingIds, notes: line.notes })),
      }) });
      toast.success("Manual order sent to the kitchen"); clearSale();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not create order"); }
    finally { setSaving(false); }
  }

  const totals = quote || { subtotal: localSubtotal, discount: 0, tax: 0, deliveryFee: 0, total: localSubtotal };

  return <AdminShell>
    <div className="mx-auto max-w-[1600px] space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[var(--secondary)]">Orders / Point of sale</p><h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight sm:text-4xl">Create a manual order</h1><p className="mt-1 text-sm text-[var(--secondary)]">Build an order, choose options, and send it directly to the kitchen.</p></div>
        {cart.length > 0 && <Button variant="outline" onClick={clearSale}><FiTrash2 /> Clear order</Button>}
      </div>

      <div className="grid items-start gap-3 sm:gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(390px,.75fr)]">
        <Card className="overflow-hidden">
          <div className="border-b border-[var(--outline-variant)] p-4 sm:p-5">
            <div className="relative"><FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--secondary)]" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dishes or descriptions…" className="h-11 bg-[var(--surface-container-low)] pl-10" /></div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setCategory("all")} className={cn("whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold", category === "all" ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--surface-container-low)] text-[var(--secondary)]")}>All items</button>
              {categories.map((cat) => <button key={cat._id} onClick={() => setCategory(cat._id)} className={cn("whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold", category === cat._id ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--surface-container-low)] text-[var(--secondary)]")}>{cat.name}</button>)}
            </div>
          </div>
          <div className="divide-y divide-[var(--outline-variant)]">
            {loading && <div className="space-y-3 p-5"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>}
            {!loading && visibleItems.length === 0 && <div className="p-12 text-center"><FiSearch className="mx-auto mb-3 h-7 w-7 text-[var(--secondary)]" /><p className="font-bold">No dishes found</p><p className="mt-1 text-sm text-[var(--secondary)]">Try another search or category.</p></div>}
            {visibleItems.map((item) => <button key={item._id} onClick={() => chooseItem(item)} className="group flex w-full items-center gap-3 p-3 text-left transition hover:bg-[var(--surface-container-low)] sm:gap-4 sm:p-5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-container)] sm:h-[72px] sm:w-[72px]">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveMediaUrl(item.image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                ) : <div className="grid h-full place-items-center text-[var(--secondary)]"><FiShoppingBag /></div>}
              </div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.name}</h3>{item.status === "Low Stock" && <Badge variant="warning">Low stock</Badge>}</div><p className="mt-1 line-clamp-1 text-xs text-[var(--secondary)]">{item.description || "Ready to add"}</p>{(item.sizes?.length > 0 || item.toppings?.length > 0) && <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-[var(--secondary)]">Options available</p>}</div>
              <div className="text-right"><p className="font-[family-name:var(--font-display)] text-sm font-extrabold sm:text-base">{formatBDT(item.price)}</p><span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[var(--secondary)] sm:mt-2 sm:text-xs">Add <FiChevronRight /></span></div>
            </button>)}
          </div>
        </Card>

        <Card id="current-order" className="scroll-mt-20 overflow-hidden xl:sticky xl:top-[100px]">
          <div className="flex items-start justify-between border-b border-[var(--outline-variant)] p-5"><div><div className="flex items-center gap-2"><h2 className="font-[family-name:var(--font-display)] text-xl font-extrabold">Current order</h2><Badge variant="secondary">{cart.reduce((s, l) => s + l.quantity, 0)} items</Badge></div><p className="mt-1 text-xs text-[var(--secondary)]">Pricing validates automatically.</p></div><FiShoppingBag className="h-5 w-5 text-[var(--secondary)]" /></div>
          <div className="grid gap-3 border-b border-[var(--outline-variant)] p-5 sm:grid-cols-2"><div><Label>Customer</Label><div className="relative mt-1.5"><FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--secondary)]" /><Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="pl-9" /></div></div><div><Label>Phone</Label><Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Optional" className="mt-1.5" /></div></div>
          <div className="max-h-[36vh] min-h-40 overflow-y-auto">
            {!cart.length ? <div className="grid min-h-52 place-items-center p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-container-low)] text-[var(--secondary)]"><FiShoppingBag className="h-5 w-5" /></span><p className="mt-3 font-bold">Your order is empty</p><p className="mt-1 text-xs text-[var(--secondary)]">Select a dish from the menu to begin.</p></div></div> : <div className="divide-y divide-[var(--outline-variant)]">{cart.map((line) => {
              const size = line.item.sizes?.find((s) => s.id === line.sizeId); const tops = line.item.toppings?.filter((t) => line.toppingIds.includes(t.id)) || [];
              return <div key={line.key} className="p-4"><div className="flex gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-bold">{line.item.name}</p>{(size || tops.length > 0) && <p className="mt-0.5 text-[11px] text-[var(--secondary)]">{[size?.label, ...tops.map((t) => t.label)].filter(Boolean).join(" · ")}</p>}<p className="mt-1 text-xs font-bold">{formatBDT(lineUnitPrice(line) * line.quantity)}</p></div><div className="flex h-8 items-center rounded-lg border border-[var(--outline-variant)]"><button onClick={() => setQuantity(line.key, line.quantity - 1)} className="grid h-8 w-8 place-items-center" aria-label="Decrease"><FiMinus className="h-3 w-3" /></button><span className="w-7 text-center text-xs font-bold">{line.quantity}</span><button onClick={() => setQuantity(line.key, line.quantity + 1)} className="grid h-8 w-8 place-items-center" aria-label="Increase"><FiPlus className="h-3 w-3" /></button></div></div></div>;
            })}</div>}
          </div>
          <div className="space-y-4 border-t border-[var(--outline-variant)] p-5">
            <div className="grid grid-cols-2 gap-3"><div><Label>Order type</Label><Select value={customer.orderType} onValueChange={(v) => setCustomer({ ...customer, orderType: v, tableId: v === "dine-in" ? customer.tableId : "" })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dine-in">Dine-in</SelectItem><SelectItem value="takeaway">Takeaway</SelectItem><SelectItem value="delivery">Delivery</SelectItem></SelectContent></Select></div><div><Label>Payment</Label><Select value={customer.paymentMethod} onValueChange={(v) => setCustomer({ ...customer, paymentMethod: v })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bkash">bKash</SelectItem><SelectItem value="card">Card</SelectItem></SelectContent></Select></div></div>
            {customer.orderType === "dine-in" && <div><Label>Table (optional)</Label><Select value={customer.tableId || "none"} onValueChange={(v) => setCustomer({ ...customer, tableId: v === "none" ? "" : v })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No table selected</SelectItem>{tables.map((table) => <SelectItem key={table._id} value={table._id}>{table.name} · {table.seats} seats</SelectItem>)}</SelectContent></Select></div>}
            {customer.orderType === "delivery" && <div><Label>Delivery address</Label><Textarea value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="Enter the full delivery address" className="mt-1.5 min-h-16" /></div>}
            <div><Label>Order note</Label><Textarea value={customer.instructions} onChange={(e) => setCustomer({ ...customer, instructions: e.target.value })} placeholder="Kitchen or service instructions" className="mt-1.5 min-h-16" /></div>
            <button onClick={() => setCustomer({ ...customer, paymentStatus: customer.paymentStatus === "paid" ? "unpaid" : "paid" })} className={cn("flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-bold", customer.paymentStatus === "paid" ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--outline-variant)]")}><span>Payment received</span><span className={cn("grid h-5 w-5 place-items-center rounded-full border", customer.paymentStatus === "paid" ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]" : "border-[var(--outline)]")}>{customer.paymentStatus === "paid" && <FiCheck className="h-3 w-3" />}</span></button>
            <div className="space-y-2 border-t border-[var(--outline-variant)] pt-4 text-sm"><div className="flex justify-between text-[var(--secondary)]"><span>Subtotal</span><span>{formatBDT(totals.subtotal)}</span></div>{totals.discount > 0 && <div className="flex justify-between text-[var(--secondary)]"><span>Discount</span><span>−{formatBDT(totals.discount)}</span></div>}{totals.tax > 0 && <div className="flex justify-between text-[var(--secondary)]"><span>Tax</span><span>{formatBDT(totals.tax)}</span></div>}{totals.deliveryFee > 0 && <div className="flex justify-between text-[var(--secondary)]"><span>Delivery</span><span>{formatBDT(totals.deliveryFee)}</span></div>}<div className="flex items-end justify-between pt-1"><span className="font-bold">Total payable</span><span className="font-[family-name:var(--font-display)] text-2xl font-extrabold">{formatBDT(totals.total)}</span></div></div>
            <Button className="h-12 w-full" disabled={!cart.length || saving} onClick={() => void completeOrder()}><FiCheck />{saving ? "Creating order…" : "Review & create order"}</Button>
          </div>
        </Card>
      </div>
      {cart.length > 0 && <a href="#current-order" className="fixed inset-x-3 z-20 flex h-12 items-center justify-between rounded-2xl bg-[var(--primary)] px-4 text-sm font-bold text-[var(--on-primary)] shadow-xl xl:hidden" style={{ bottom: "calc(76px + env(safe-area-inset-bottom))" }}><span>View current order · {cart.reduce((sum, line) => sum + line.quantity, 0)} items</span><span>{formatBDT(totals.total)} <FiChevronRight className="inline" /></span></a>}
    </div>

    <Dialog open={Boolean(customizing)} onOpenChange={(open) => !open && setCustomizing(null)}>
      <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Customize {customizing?.name}</DialogTitle><DialogDescription>Choose a size and any add-ons before adding this item.</DialogDescription></DialogHeader>
        {customizing && <div className="space-y-5">
          {customizing.sizes?.length > 0 && <div><Label>Size</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{customizing.sizes.map((size) => <button key={size.id} onClick={() => setDraftSize(size.id)} className={cn("flex items-center justify-between rounded-xl border p-3 text-left text-sm", draftSize === size.id ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--outline-variant)]")}><span className="font-bold">{size.label}</span><span className="text-xs text-[var(--secondary)]">{size.extra ? `+ ${formatBDT(size.extra)}` : "Included"}</span></button>)}</div></div>}
          {customizing.toppings?.length > 0 && <div><Label>Add-ons</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{customizing.toppings.map((topping) => { const selected = draftToppings.includes(topping.id); return <button key={topping.id} onClick={() => setDraftToppings((current) => selected ? current.filter((id) => id !== topping.id) : [...current, topping.id])} className={cn("flex items-center justify-between rounded-xl border p-3 text-left text-sm", selected ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--outline-variant)]")}><span className="font-bold">{topping.label}</span><span className="text-xs text-[var(--secondary)]">+ {formatBDT(topping.price)}</span></button>; })}</div></div>}
          <div><Label>Item note (optional)</Label><Textarea value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} placeholder="e.g. less spicy, no onions" className="mt-2" /></div>
          <Button className="w-full" onClick={() => addLine(customizing, draftSize, draftToppings, draftNotes)}>Add to order · {formatBDT(customizing.price + (customizing.sizes.find((s) => s.id === draftSize)?.extra || 0) + customizing.toppings.filter((t) => draftToppings.includes(t.id)).reduce((s, t) => s + t.price, 0))}</Button>
        </div>}
      </DialogContent>
    </Dialog>
  </AdminShell>;
}
