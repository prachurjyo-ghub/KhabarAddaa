"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
import { apiFetch } from "@/lib/api";
import type { StaffPermissions, StaffUser } from "@/lib/types";

const PERM_KEYS: (keyof StaffPermissions)[] = [
  "dashboard",
  "menu",
  "orders",
  "inventory",
  "financials",
  "tables",
  "bookings",
  "staff",
];

const emptyPerms = (): StaffPermissions =>
  Object.fromEntries(PERM_KEYS.map((k) => [k, false])) as StaffPermissions;

type StaffRow = StaffUser & { createdAt?: string };

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "waiter" as StaffUser["role"],
  shift: "OFF DUTY" as StaffUser["shift"],
  isActive: true,
  permissions: emptyPerms(),
};

export default function EmployeesPage() {
  const { user: me, hasPermission } = useAuth();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage = hasPermission("staff") || me?.role === "super_admin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ staff: StaffRow[] }>("/auth/staff");
      setStaff(data.staff);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManage) void load();
    else setLoading(false);
  }, [canManage, load]);

  const filtered = useMemo(() => {
    return staff
      .filter((s) => {
        if (roleFilter !== "all" && s.role !== roleFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [staff, search, roleFilter]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/auth/staff/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.name,
            phone: form.phone,
            role: form.role,
            shift: form.shift,
            isActive: form.isActive,
            permissions: form.permissions,
            ...(form.password ? { password: form.password } : {}),
          }),
        });
        toast.success("Staff updated");
      } else {
        if (!form.password) {
          toast.error("Password required for new staff");
          setSaving(false);
          return;
        }
        await apiFetch("/auth/staff", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone,
            role: form.role,
            shift: form.shift,
            permissions: form.permissions,
          }),
        });
        toast.success("Staff created");
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(s: StaffRow) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      email: s.email,
      password: "",
      phone: s.phone || "",
      role: s.role,
      shift: s.shift,
      isActive: s.isActive,
      permissions: { ...emptyPerms(), ...s.permissions },
    });
  }

  if (!canManage) {
    return (
      <AdminShell>
        <Card>
          <CardContent className="p-8 text-sm text-[var(--secondary)]">
            You do not have permission to manage staff.
          </CardContent>
        </Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            Staff
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            Create accounts, set roles, and toggle permissions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="super_admin">Super admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="waiter">Waiter</SelectItem>
              <SelectItem value="chef">Chef</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit staff" : "Add staff"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                {!editingId && (
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label>
                    {editingId ? "New password (optional)" : "Password"}
                  </Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    minLength={editingId ? undefined : 6}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Select
                      value={form.role}
                      onValueChange={(v) =>
                        setForm({ ...form, role: v as StaffUser["role"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="waiter">Waiter</SelectItem>
                        <SelectItem value="chef">Chef</SelectItem>
                        <SelectItem value="super_admin">Super admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Shift</Label>
                    <Select
                      value={form.shift}
                      onValueChange={(v) =>
                        setForm({ ...form, shift: v as StaffUser["shift"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ON SHIFT">On shift</SelectItem>
                        <SelectItem value="OFF DUTY">Off duty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {editingId && (
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                    />
                    Active
                  </label>
                )}
                <div>
                  <Label>Permissions</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PERM_KEYS.map((key) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 text-xs font-semibold capitalize"
                      >
                        <input
                          type="checkbox"
                          checked={form.permissions[key]}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              permissions: {
                                ...form.permissions,
                                [key]: e.target.checked,
                              },
                            })
                          }
                        />
                        {key}
                      </label>
                    ))}
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
                        setForm(emptyForm);
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
            {!loading &&
              filtered.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{s.name}</h3>
                        <Badge variant="outline" className="capitalize">
                          {s.role.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant={s.isActive ? "success" : "danger"}
                        >
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="secondary">{s.shift}</Badge>
                      </div>
                      <p className="text-sm text-[var(--secondary)]">
                        {s.email}
                        {s.phone ? ` · ${s.phone}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startEdit(s)}
                      >
                        <FiEdit2 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      {s.role !== "super_admin" && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={async () => {
                            if (!confirm(`Delete ${s.name}?`)) return;
                            try {
                              await apiFetch(`/auth/staff/${s.id}`, {
                                method: "DELETE",
                              });
                              toast.success("Deleted");
                              await load();
                            } catch (err) {
                              toast.error(
                                err instanceof Error ? err.message : "Failed"
                              );
                            }
                          }}
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
