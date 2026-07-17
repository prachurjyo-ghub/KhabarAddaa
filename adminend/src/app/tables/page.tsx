"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
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

type DiningTable = {
  _id: string;
  name: string;
  seats: number;
  status: "Available" | "Unavailable";
  isActive: boolean;
};

type Booking = {
  _id: string;
  customerName: string;
  customerPhone: string;
  guests: number;
  date: string;
  startMinutes: number;
  endMinutes: number;
  tableName: string;
  status: string;
  source: string;
  note: string;
};

type DayHours = {
  closed?: boolean;
  reason?: string;
  openMinutes?: number;
  closeMinutes?: number;
  slotDurationMinutes?: number;
};

type ScheduleDay = {
  weekday: number;
  isOpen: boolean;
  openMinutes: number;
  closeMinutes: number;
  slotDurationMinutes: number;
};

type DateOverride = {
  _id: string;
  date: string;
  isClosed: boolean;
  openMinutes: number | null;
  closeMinutes: number | null;
  slotDurationMinutes: number | null;
  note: string;
};

type BlockedDate = { _id: string; date: string; reason: string };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function minsLabel(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fromMinutes(mins: number) {
  return minsLabel(mins);
}

const BOOKING_STATUSES = [
  "Pending",
  "Confirmed",
  "Checked In",
  "Seated",
  "Completed",
  "Cancelled",
  "No Show",
];

export default function TablesPage() {
  const { hasPermission } = useAuth();
  const canTables = hasPermission("tables");
  const canBookings = hasPermission("bookings");

  const [date, setDate] = useState(todayISO());
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [hours, setHours] = useState<DayHours | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [scheduleDays, setScheduleDays] = useState<ScheduleDay[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);

  const [tableForm, setTableForm] = useState({
    name: "",
    seats: "4",
    status: "Available" as DiningTable["status"],
    isActive: true,
  });
  const [tableEdit, setTableEdit] = useState<string | null>(null);

  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    customerPhone: "",
    guests: "2",
    date: todayISO(),
    start: "12:00",
    end: "13:30",
    tableId: "",
    note: "",
    status: "Confirmed",
    source: "admin",
  });

  const [overrideForm, setOverrideForm] = useState({
    date: todayISO(),
    isClosed: false,
    open: "11:00",
    close: "22:00",
    slot: "90",
    note: "",
  });
  const [blockForm, setBlockForm] = useState({ date: todayISO(), reason: "" });

  const loadDay = useCallback(async () => {
    if (!canTables) return;
    try {
      const data = await apiFetch<{
        tables: DiningTable[];
        bookings: Booking[];
        hours: DayHours;
      }>(`/reservations/day-view?date=${date}`);
      setDayBookings(data.bookings);
      setHours(data.hours);
      setTables(data.tables);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Day view failed");
    }
  }, [date, canTables]);

  const loadTables = useCallback(async () => {
    if (!canTables) return;
    try {
      const data = await apiFetch<{ tables: DiningTable[] }>(
        "/reservations/tables"
      );
      setTables(data.tables);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tables failed");
    }
  }, [canTables]);

  const loadBookings = useCallback(async () => {
    if (!canBookings) return;
    try {
      const data = await apiFetch<{ bookings: Booking[] }>(
        `/reservations/bookings?date=${date}`
      );
      setAllBookings(data.bookings);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bookings failed");
    }
  }, [date, canBookings]);

  const loadScheduleStuff = useCallback(async () => {
    if (!canBookings) return;
    try {
      const [sched, ov, bl] = await Promise.all([
        apiFetch<{ schedule: { days: ScheduleDay[] } }>("/reservations/schedule"),
        apiFetch<{ overrides: DateOverride[] }>("/reservations/date-overrides"),
        apiFetch<{ blockedDates: BlockedDate[] }>("/reservations/blocked-dates"),
      ]);
      setScheduleDays(sched.schedule.days);
      setOverrides(ov.overrides);
      setBlocked(bl.blockedDates);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Schedule failed");
    }
  }, [canBookings]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadDay(), loadTables(), loadBookings(), loadScheduleStuff()])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loadDay, loadTables, loadBookings, loadScheduleStuff]);

  async function saveTable(e: FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        name: tableForm.name,
        seats: Number(tableForm.seats),
        status: tableForm.status,
        isActive: tableForm.isActive,
      };
      if (tableEdit) {
        await apiFetch(`/reservations/tables/${tableEdit}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Table updated");
      } else {
        await apiFetch("/reservations/tables", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Table created");
      }
      setTableForm({
        name: "",
        seats: "4",
        status: "Available",
        isActive: true,
      });
      setTableEdit(null);
      await Promise.all([loadTables(), loadDay()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function saveBooking(e: FormEvent) {
    e.preventDefault();
    try {
      const table = tables.find((t) => t._id === bookingForm.tableId);
      await apiFetch("/reservations/bookings", {
        method: "POST",
        body: JSON.stringify({
          customerName: bookingForm.customerName,
          customerPhone: bookingForm.customerPhone,
          guests: Number(bookingForm.guests),
          date: bookingForm.date,
          startMinutes: toMinutes(bookingForm.start),
          endMinutes: toMinutes(bookingForm.end),
          tableId: bookingForm.tableId || undefined,
          tableName: table?.name || "",
          note: bookingForm.note,
          status: bookingForm.status,
          source: bookingForm.source,
        }),
      });
      toast.success("Booking created");
      setBookingForm({
        customerName: "",
        customerPhone: "",
        guests: "2",
        date: todayISO(),
        start: "12:00",
        end: "13:30",
        tableId: "",
        note: "",
        status: "Confirmed",
        source: "admin",
      });
      await Promise.all([loadDay(), loadBookings()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    }
  }

  async function saveSchedule() {
    try {
      await apiFetch("/reservations/schedule", {
        method: "PUT",
        body: JSON.stringify({ days: scheduleDays }),
      });
      toast.success("Schedule saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
              Tables & Reservations
            </h1>
            <p className="text-sm text-[var(--secondary)]">
              Floor day view, tables, weekly hours, and bookings.
            </p>
          </div>
          <div className="space-y-1">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-44"
            />
          </div>
        </div>

        {loading && <Skeleton className="h-48" />}

        {!loading && (
          <Tabs defaultValue={canTables ? "day" : "bookings"}>
            <TabsList className="flex h-auto flex-wrap">
              {canTables && <TabsTrigger value="day">Day view</TabsTrigger>}
              {canTables && <TabsTrigger value="tables">Tables</TabsTrigger>}
              {canBookings && (
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
              )}
              {canBookings && (
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              )}
            </TabsList>

            {canTables && (
              <TabsContent value="day" className="space-y-4">
                <Card>
                  <CardContent className="p-4 text-sm">
                    {hours?.closed ? (
                      <p className="text-[var(--secondary)]">
                        Closed{hours.reason ? ` — ${hours.reason}` : ""}
                      </p>
                    ) : (
                      <p>
                        Open {minsLabel(hours?.openMinutes ?? 0)} –{" "}
                        {minsLabel(hours?.closeMinutes ?? 0)} · slots{" "}
                        {hours?.slotDurationMinutes ?? 90} min ·{" "}
                        {dayBookings.length} booking
                        {dayBookings.length === 1 ? "" : "s"}
                      </p>
                    )}
                  </CardContent>
                </Card>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tables.map((t) => {
                    const seated = dayBookings.filter(
                      (b) =>
                        String(b.tableName) === t.name &&
                        !["Cancelled", "No Show", "Completed"].includes(b.status)
                    );
                    return (
                      <Card key={t._id}>
                        <CardContent className="space-y-2 p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold">{t.name}</h3>
                            <Badge
                              variant={
                                t.status === "Available" ? "success" : "danger"
                              }
                            >
                              {t.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-[var(--secondary)]">
                            {t.seats} seats
                          </p>
                          {seated.length === 0 ? (
                            <p className="text-xs text-[var(--secondary)]">
                              No reservations today
                            </p>
                          ) : (
                            <ul className="space-y-1 text-xs">
                              {seated.map((b) => (
                                <li
                                  key={b._id}
                                  className="rounded-md bg-[var(--surface-container)] px-2 py-1"
                                >
                                  {minsLabel(b.startMinutes)} {b.customerName} ·{" "}
                                  {b.guests}g · {b.status}
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            )}

            {canTables && (
              <TabsContent value="tables">
                <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {tableEdit ? "Edit table" : "Add table"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={saveTable} className="space-y-3">
                        <div className="space-y-1">
                          <Label>Name</Label>
                          <Input
                            required
                            value={tableForm.name}
                            onChange={(e) =>
                              setTableForm({
                                ...tableForm,
                                name: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Seats</Label>
                          <Input
                            type="number"
                            min={1}
                            required
                            value={tableForm.seats}
                            onChange={(e) =>
                              setTableForm({
                                ...tableForm,
                                seats: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Status</Label>
                          <Select
                            value={tableForm.status}
                            onValueChange={(v) =>
                              setTableForm({
                                ...tableForm,
                                status: v as DiningTable["status"],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Available">Available</SelectItem>
                              <SelectItem value="Unavailable">
                                Unavailable
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold">
                          <input
                            type="checkbox"
                            checked={tableForm.isActive}
                            onChange={(e) =>
                              setTableForm({
                                ...tableForm,
                                isActive: e.target.checked,
                              })
                            }
                          />
                          Active
                        </label>
                        <Button type="submit">
                          {tableEdit ? "Update" : "Create"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  <div className="space-y-3">
                    {tables.map((t) => (
                      <Card key={t._id}>
                        <CardContent className="flex items-center justify-between gap-3 p-4">
                          <div>
                            <p className="font-bold">
                              {t.name}{" "}
                              <span className="font-normal text-[var(--secondary)]">
                                · {t.seats} seats
                              </span>
                            </p>
                            <div className="mt-1 flex gap-2">
                              <Badge
                                variant={
                                  t.status === "Available"
                                    ? "success"
                                    : "danger"
                                }
                              >
                                {t.status}
                              </Badge>
                              {!t.isActive && (
                                <Badge variant="outline">Inactive</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setTableEdit(t._id);
                                setTableForm({
                                  name: t.name,
                                  seats: String(t.seats),
                                  status: t.status,
                                  isActive: t.isActive,
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
                                    `/reservations/tables/${t._id}`,
                                    { method: "DELETE" }
                                  );
                                  toast.success("Deleted");
                                  await Promise.all([loadTables(), loadDay()]);
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
            )}

            {canBookings && (
              <TabsContent value="bookings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create booking / walk-in</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form
                      onSubmit={saveBooking}
                      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                    >
                      <div className="space-y-1">
                        <Label>Name</Label>
                        <Input
                          required
                          value={bookingForm.customerName}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              customerName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Phone</Label>
                        <Input
                          required
                          value={bookingForm.customerPhone}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              customerPhone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Guests</Label>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          value={bookingForm.guests}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              guests: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={bookingForm.date}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Start</Label>
                        <Input
                          type="time"
                          value={bookingForm.start}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              start: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>End</Label>
                        <Input
                          type="time"
                          value={bookingForm.end}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              end: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Table</Label>
                        <Select
                          value={bookingForm.tableId || "none"}
                          onValueChange={(v) =>
                            setBookingForm({
                              ...bookingForm,
                              tableId: v === "none" ? "" : v,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {tables.map((t) => (
                              <SelectItem key={t._id} value={t._id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Status</Label>
                        <Select
                          value={bookingForm.status}
                          onValueChange={(v) =>
                            setBookingForm({ ...bookingForm, status: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BOOKING_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label>Note</Label>
                        <Input
                          value={bookingForm.note}
                          onChange={(e) =>
                            setBookingForm({
                              ...bookingForm,
                              note: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <Button type="submit">Create booking</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {allBookings.length === 0 && (
                    <Card>
                      <CardContent className="p-6 text-sm text-[var(--secondary)]">
                        No bookings for {date}.
                      </CardContent>
                    </Card>
                  )}
                  {allBookings.map((b) => (
                    <Card key={b._id}>
                      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{b.customerName}</p>
                            <Badge variant="outline">{b.status}</Badge>
                            <Badge variant="secondary">{b.source}</Badge>
                          </div>
                          <p className="text-sm text-[var(--secondary)]">
                            {b.date} · {minsLabel(b.startMinutes)}–
                            {minsLabel(b.endMinutes)} · {b.guests} guests
                            {b.tableName ? ` · ${b.tableName}` : ""} ·{" "}
                            {b.customerPhone}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Select
                            value={b.status}
                            onValueChange={async (status) => {
                              try {
                                await apiFetch(
                                  `/reservations/bookings/${b._id}`,
                                  {
                                    method: "PATCH",
                                    body: JSON.stringify({ status }),
                                  }
                                );
                                toast.success("Updated");
                                await Promise.all([loadDay(), loadBookings()]);
                              } catch (err) {
                                toast.error(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed"
                                );
                              }
                            }}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BOOKING_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={async () => {
                              try {
                                await apiFetch(
                                  `/reservations/bookings/${b._id}`,
                                  { method: "DELETE" }
                                );
                                toast.success("Deleted");
                                await Promise.all([loadDay(), loadBookings()]);
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
              </TabsContent>
            )}

            {canBookings && (
              <TabsContent value="schedule" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly hours</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {scheduleDays
                      .slice()
                      .sort((a, b) => a.weekday - b.weekday)
                      .map((day) => (
                        <div
                          key={day.weekday}
                          className="grid items-center gap-2 rounded-lg border border-[var(--outline-variant)] p-3 sm:grid-cols-[80px_auto_1fr_1fr_100px]"
                        >
                          <p className="font-semibold">
                            {WEEKDAYS[day.weekday]}
                          </p>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={day.isOpen}
                              onChange={(e) =>
                                setScheduleDays((days) =>
                                  days.map((d) =>
                                    d.weekday === day.weekday
                                      ? { ...d, isOpen: e.target.checked }
                                      : d
                                  )
                                )
                              }
                            />
                            Open
                          </label>
                          <Input
                            type="time"
                            disabled={!day.isOpen}
                            value={fromMinutes(day.openMinutes)}
                            onChange={(e) =>
                              setScheduleDays((days) =>
                                days.map((d) =>
                                  d.weekday === day.weekday
                                    ? {
                                        ...d,
                                        openMinutes: toMinutes(e.target.value),
                                      }
                                    : d
                                )
                              )
                            }
                          />
                          <Input
                            type="time"
                            disabled={!day.isOpen}
                            value={fromMinutes(day.closeMinutes)}
                            onChange={(e) =>
                              setScheduleDays((days) =>
                                days.map((d) =>
                                  d.weekday === day.weekday
                                    ? {
                                        ...d,
                                        closeMinutes: toMinutes(e.target.value),
                                      }
                                    : d
                                )
                              )
                            }
                          />
                          <Input
                            type="number"
                            min={30}
                            step={15}
                            disabled={!day.isOpen}
                            value={day.slotDurationMinutes}
                            onChange={(e) =>
                              setScheduleDays((days) =>
                                days.map((d) =>
                                  d.weekday === day.weekday
                                    ? {
                                        ...d,
                                        slotDurationMinutes:
                                          Number(e.target.value) || 90,
                                      }
                                    : d
                                )
                              )
                            }
                            title="Slot minutes"
                          />
                        </div>
                      ))}
                    <Button onClick={() => void saveSchedule()}>
                      Save schedule
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Date override</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={overrideForm.date}
                          onChange={(e) =>
                            setOverrideForm({
                              ...overrideForm,
                              date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={overrideForm.isClosed}
                          onChange={(e) =>
                            setOverrideForm({
                              ...overrideForm,
                              isClosed: e.target.checked,
                            })
                          }
                        />
                        Closed all day
                      </label>
                      {!overrideForm.isClosed && (
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="time"
                            value={overrideForm.open}
                            onChange={(e) =>
                              setOverrideForm({
                                ...overrideForm,
                                open: e.target.value,
                              })
                            }
                          />
                          <Input
                            type="time"
                            value={overrideForm.close}
                            onChange={(e) =>
                              setOverrideForm({
                                ...overrideForm,
                                close: e.target.value,
                              })
                            }
                          />
                          <Input
                            type="number"
                            value={overrideForm.slot}
                            onChange={(e) =>
                              setOverrideForm({
                                ...overrideForm,
                                slot: e.target.value,
                              })
                            }
                            placeholder="Slot min"
                          />
                        </div>
                      )}
                      <Input
                        placeholder="Note"
                        value={overrideForm.note}
                        onChange={(e) =>
                          setOverrideForm({
                            ...overrideForm,
                            note: e.target.value,
                          })
                        }
                      />
                      <Button
                        onClick={async () => {
                          try {
                            await apiFetch("/reservations/date-overrides", {
                              method: "POST",
                              body: JSON.stringify({
                                date: overrideForm.date,
                                isClosed: overrideForm.isClosed,
                                openMinutes: overrideForm.isClosed
                                  ? null
                                  : toMinutes(overrideForm.open),
                                closeMinutes: overrideForm.isClosed
                                  ? null
                                  : toMinutes(overrideForm.close),
                                slotDurationMinutes: overrideForm.isClosed
                                  ? null
                                  : Number(overrideForm.slot) || 90,
                                note: overrideForm.note,
                              }),
                            });
                            toast.success("Override saved");
                            await loadScheduleStuff();
                          } catch (err) {
                            toast.error(
                              err instanceof Error ? err.message : "Failed"
                            );
                          }
                        }}
                      >
                        Save override
                      </Button>
                      <ul className="space-y-2 text-sm">
                        {overrides.map((o) => (
                          <li
                            key={o._id}
                            className="flex items-center justify-between gap-2 rounded-md bg-[var(--surface-container)] px-3 py-2"
                          >
                            <span>
                              {o.date} ·{" "}
                              {o.isClosed
                                ? "Closed"
                                : `${minsLabel(o.openMinutes || 0)}–${minsLabel(o.closeMinutes || 0)}`}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                await apiFetch(
                                  `/reservations/date-overrides/${o._id}`,
                                  { method: "DELETE" }
                                );
                                await loadScheduleStuff();
                              }}
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Blocked dates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        type="date"
                        value={blockForm.date}
                        onChange={(e) =>
                          setBlockForm({ ...blockForm, date: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Reason"
                        value={blockForm.reason}
                        onChange={(e) =>
                          setBlockForm({
                            ...blockForm,
                            reason: e.target.value,
                          })
                        }
                      />
                      <Button
                        onClick={async () => {
                          try {
                            await apiFetch("/reservations/blocked-dates", {
                              method: "POST",
                              body: JSON.stringify(blockForm),
                            });
                            toast.success("Blocked");
                            await loadScheduleStuff();
                          } catch (err) {
                            toast.error(
                              err instanceof Error ? err.message : "Failed"
                            );
                          }
                        }}
                      >
                        Block date
                      </Button>
                      <ul className="space-y-2 text-sm">
                        {blocked.map((b) => (
                          <li
                            key={b._id}
                            className="flex items-center justify-between gap-2 rounded-md bg-[var(--surface-container)] px-3 py-2"
                          >
                            <span>
                              {b.date}
                              {b.reason ? ` — ${b.reason}` : ""}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                await apiFetch(
                                  `/reservations/blocked-dates/${b._id}`,
                                  { method: "DELETE" }
                                );
                                await loadScheduleStuff();
                              }}
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </AdminShell>
  );
}
