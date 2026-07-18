"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { FiCheck, FiPhone } from "react-icons/fi";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-nav";
import { ScrollProgress } from "@/components/scroll-progress";
import { useAuth } from "@/components/auth-provider";
import { ease } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Slot = {
  startMinutes: number;
  endMinutes: number;
  label: string;
  available: boolean;
};

export default function BookPage() {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [largeParty, setLargeParty] = useState(false);
  const [managerPhone, setManagerPhone] = useState("01700000000");
  const [busy, setBusy] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [done, setDone] = useState(false);

  // Prefill from profile when logged in (guests still book without login)
  useEffect(() => {
    if (!user) return;
    setName((prev) => prev || user.name || "");
    setPhone((prev) => prev || user.phone || "");
  }, [user]);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!date) return;
    setSelected(null);
    setDone(false);

    if (guests >= 13) {
      setLargeParty(true);
      setSlots([]);
      setManagerPhone(process.env.NEXT_PUBLIC_MANAGER_PHONE || "01700000000");
      return;
    }

    setLargeParty(false);
    setLoadingSlots(true);
    apiFetch<{ slots: Slot[]; largeParty?: boolean; managerPhone?: string }>(
      `/reservations/public/availability?date=${date}&guests=${guests}`
    )
      .then((d) => {
        if (d.largeParty) {
          setLargeParty(true);
          setManagerPhone(d.managerPhone || "01700000000");
          setSlots([]);
        } else {
          setSlots(d.slots || []);
        }
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, guests]);

  const openSlots = useMemo(() => slots.filter((s) => s.available), [slots]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (largeParty) return;
    if (!selected) {
      toast.error("Please choose a time");
      return;
    }
    setBusy(true);
    try {
      const path = user
        ? "/reservations/public/bookings/authenticated"
        : "/reservations/public/bookings";
      await apiFetch(path, {
        method: "POST",
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: user?.email || "",
          guests,
          date,
          startMinutes: selected.startMinutes,
          endMinutes: selected.endMinutes,
          note,
        }),
      });
      setDone(true);
      toast.success("Reservation requested");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-pad min-h-screen bg-[var(--background)]">
      <ScrollProgress />
      <SiteHeader transparent />

      <section className="relative h-[38vh] min-h-[260px] overflow-hidden">
        <Image
          src="/Food_Items_Images/steak-with-fries.jpg"
          alt="Reserve a table at KhabarAdda"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
        <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-4 pb-10 pt-24">
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            KhabarAdda
          </motion.p>
          <motion.h1
            className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold text-gold-glow md:text-5xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease }}
          >
            Reserve a table
          </motion.h1>
          <motion.p
            className="mt-2 max-w-md text-sm font-light text-white/65"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14, ease }}
          >
            Pick a date, party size, and time — we&apos;ll hold your seat.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-4 py-10 md:py-14">
        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="gold-frame px-6 py-12 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--gold)]/45 bg-[var(--primary-soft)] text-[var(--gold-bright)]">
              <FiCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-5 font-[family-name:var(--font-display)] text-2xl font-semibold text-gold-glow">
              You&apos;re on the list
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              {name} · {guests} guests
              <br />
              {date}
              {selected ? ` · ${selected.label}` : ""}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {user ? (
                <Button asChild>
                  <Link href="/account">View my reservations</Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/login?next=/account">
                    Log in to track reservations
                  </Link>
                </Button>
              )}
              <Button
                variant={user ? "outline" : "default"}
                onClick={() => {
                  setDone(false);
                  setSelected(null);
                  if (!user) {
                    setName("");
                    setPhone("");
                    setNote("");
                  } else {
                    setNote("");
                  }
                }}
              >
                Book again
              </Button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={onSubmit} className="gold-frame space-y-6 p-6 md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-[var(--gold)]/80">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guests" className="text-[var(--gold)]/80">
                  Guests
                </Label>
                <select
                  id="guests"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="flex h-11 w-full rounded-lg border border-[var(--gold)]/30 bg-[var(--surface-container-low)] px-3 text-sm text-[var(--on-background)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                >
                  {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n} className="bg-[#141414]">
                      {n === 13 ? "13+ (call us)" : `${n} guest${n > 1 ? "s" : ""}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {largeParty ? (
              <div className="rounded-xl border border-[var(--gold)]/35 bg-[var(--primary-soft)] p-5">
                <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-gold-glow">
                  Large parties need a quick call
                </p>
                <p className="mt-2 text-sm text-white/65">
                  For 13+ guests we arrange seating by phone.
                </p>
                <Button asChild className="mt-4" size="lg">
                  <a href={`tel:${managerPhone}`}>
                    <FiPhone className="h-4 w-4" />
                    Call {managerPhone}
                  </a>
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-[var(--gold)]/80">Time</Label>
                    <span className="text-xs text-white/45">
                      {loadingSlots
                        ? "Checking…"
                        : `${openSlots.length} available`}
                    </span>
                  </div>
                  {loadingSlots ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-11 rounded-xl" />
                      ))}
                    </div>
                  ) : openSlots.length === 0 ? (
                    <p className="rounded-xl border border-[var(--gold)]/20 bg-[var(--surface-container-low)] px-4 py-6 text-center text-sm text-white/50">
                      No open times for this day. Try another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {slots.map((slot) => (
                        <button
                          key={slot.label}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelected(slot)}
                          className={cn(
                            "rounded-xl border px-2 py-3 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-30 sm:text-sm",
                            selected?.label === slot.label
                              ? "border-[var(--gold)] bg-gradient-to-b from-[#e0c078] to-[#c5a059] text-[#121212] shadow-[0_0_18px_rgba(197,160,89,0.35)]"
                              : "border-[var(--gold)]/25 bg-[var(--surface-container-low)] text-white/75 hover:border-[var(--gold)]/55 hover:text-[var(--gold-bright)] hover:shadow-[0_0_14px_rgba(197,160,89,0.2)]"
                          )}
                        >
                          {slot.label.split("–")[0]?.trim() || slot.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[var(--gold)]/80">
                      Name
                    </Label>
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-11 border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[var(--gold)]/80">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="h-11 border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="note" className="text-[var(--gold)]/80">
                    Special request (optional)
                  </Label>
                  <Input
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Birthday, window seat…"
                    className="h-11 border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                  />
                </div>

                {selected && (
                  <p className="rounded-xl border border-[var(--gold)]/25 bg-[var(--surface-container-low)] px-4 py-3 text-sm text-white/55">
                    Selected:{" "}
                    <span className="font-semibold text-[var(--gold-bright)]">
                      {date} · {selected.label} · {guests} guests
                    </span>
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={busy || !selected}
                >
                  {busy ? "Sending…" : "Confirm reservation"}
                </Button>
              </>
            )}
          </form>
        )}
      </section>

      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
