"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    shift: (user?.shift || "OFF DUTY") as "ON SHIFT" | "OFF DUTY",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [emailFlow, setEmailFlow] = useState({
    newEmail: "",
    code: "",
    step: 1,
    devOtp: "",
  });
  const [resetFlow, setResetFlow] = useState({
    email: user?.email || "",
    code: "",
    newPassword: "",
    step: 1,
    devOtp: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.name || "",
      phone: user.phone || "",
      shift: user.shift || "OFF DUTY",
    });
    setResetFlow((f) => ({ ...f, email: user.email || f.email }));
  }, [user]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/auth/staff/me", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/auth/staff/change-password", {
        method: "POST",
        body: JSON.stringify(passwords),
      });
      setPasswords({ currentPassword: "", newPassword: "" });
      toast.success("Password updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            Settings
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            Profile, password, and security.
          </p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            {user?.role === "super_admin" && (
              <TabsTrigger value="email">Change email</TabsTrigger>
            )}
            <TabsTrigger value="reset">OTP reset</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Your profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveProfile} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Phone</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Shift</Label>
                    <Select
                      value={profile.shift}
                      onValueChange={(v) =>
                        setProfile({
                          ...profile,
                          shift: v as "ON SHIFT" | "OFF DUTY",
                        })
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
                  <Button type="submit" disabled={busy}>
                    Save profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={changePassword} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Current password</Label>
                    <Input
                      type="password"
                      required
                      value={passwords.currentPassword}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          currentPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>New password</Label>
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={passwords.newPassword}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Button type="submit" disabled={busy}>
                    Update password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {user?.role === "super_admin" && (
            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle>Change email (OTP)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {emailFlow.step === 1 && (
                    <>
                      <div className="space-y-1">
                        <Label>New email</Label>
                        <Input
                          type="email"
                          value={emailFlow.newEmail}
                          onChange={(e) =>
                            setEmailFlow({
                              ...emailFlow,
                              newEmail: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            const data = await apiFetch<{
                              devOtp?: string;
                            }>("/auth/staff/otp/email/request", {
                              method: "POST",
                              body: JSON.stringify({
                                newEmail: emailFlow.newEmail,
                              }),
                            });
                            setEmailFlow((f) => ({
                              ...f,
                              step: 2,
                              devOtp: data.devOtp || "",
                            }));
                            toast.success("OTP sent");
                          } catch (err) {
                            toast.error(
                              err instanceof Error ? err.message : "Failed"
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Request OTP
                      </Button>
                    </>
                  )}
                  {emailFlow.step === 2 && (
                    <>
                      {emailFlow.devOtp && (
                        <p className="rounded-lg bg-[var(--surface-container)] px-3 py-2 text-xs">
                          Dev OTP: <strong>{emailFlow.devOtp}</strong>
                        </p>
                      )}
                      <div className="space-y-1">
                        <Label>OTP code</Label>
                        <Input
                          value={emailFlow.code}
                          onChange={(e) =>
                            setEmailFlow({ ...emailFlow, code: e.target.value })
                          }
                        />
                      </div>
                      <Button
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await apiFetch("/auth/staff/otp/email/verify", {
                              method: "POST",
                              body: JSON.stringify({ code: emailFlow.code }),
                            });
                            await apiFetch("/auth/staff/otp/email/confirm", {
                              method: "POST",
                            });
                            await refresh();
                            toast.success("Email updated");
                            setEmailFlow({
                              newEmail: "",
                              code: "",
                              step: 1,
                              devOtp: "",
                            });
                          } catch (err) {
                            toast.error(
                              err instanceof Error ? err.message : "Failed"
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Verify & confirm
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="reset">
            <Card>
              <CardHeader>
                <CardTitle>Password reset via OTP</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {resetFlow.step === 1 && (
                  <>
                    <div className="space-y-1">
                      <Label>Staff email</Label>
                      <Input
                        type="email"
                        value={resetFlow.email}
                        onChange={(e) =>
                          setResetFlow({ ...resetFlow, email: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const data = await apiFetch<{
                            sent: boolean;
                            devOtp?: string;
                          }>("/auth/staff/otp/password/request", {
                            method: "POST",
                            body: JSON.stringify({ email: resetFlow.email }),
                          });
                          setResetFlow((f) => ({
                            ...f,
                            step: 2,
                            devOtp: data.devOtp || "",
                          }));
                          toast.success("If the account exists, OTP was sent");
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : "Failed"
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Request OTP
                    </Button>
                  </>
                )}
                {resetFlow.step === 2 && (
                  <>
                    {resetFlow.devOtp && (
                      <p className="rounded-lg bg-[var(--surface-container)] px-3 py-2 text-xs">
                        Dev OTP: <strong>{resetFlow.devOtp}</strong>
                      </p>
                    )}
                    <div className="space-y-1">
                      <Label>OTP code</Label>
                      <Input
                        value={resetFlow.code}
                        onChange={(e) =>
                          setResetFlow({ ...resetFlow, code: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await apiFetch("/auth/staff/otp/password/verify", {
                            method: "POST",
                            body: JSON.stringify({
                              email: resetFlow.email,
                              code: resetFlow.code,
                            }),
                          });
                          setResetFlow((f) => ({ ...f, step: 3 }));
                          toast.success("OTP verified");
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : "Failed"
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Verify OTP
                    </Button>
                  </>
                )}
                {resetFlow.step === 3 && (
                  <>
                    <div className="space-y-1">
                      <Label>New password</Label>
                      <Input
                        type="password"
                        minLength={6}
                        value={resetFlow.newPassword}
                        onChange={(e) =>
                          setResetFlow({
                            ...resetFlow,
                            newPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                    <Button
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await apiFetch("/auth/staff/otp/password/confirm", {
                            method: "POST",
                            body: JSON.stringify({
                              email: resetFlow.email,
                              newPassword: resetFlow.newPassword,
                            }),
                          });
                          toast.success("Password reset");
                          setResetFlow({
                            email: user?.email || "",
                            code: "",
                            newPassword: "",
                            step: 1,
                            devOtp: "",
                          });
                        } catch (err) {
                          toast.error(
                            err instanceof Error ? err.message : "Failed"
                          );
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Confirm reset
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
