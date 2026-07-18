"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";

function safeNextPath(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/account";
  return raw;
}

function LoginPageContent() {
  const { login, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"auth" | "reset">("auth");
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [reset, setReset] = useState({
    email: "",
    code: "",
    newPassword: "",
    devOtp: "",
  });

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success("Welcome back");
      router.push(nextPath);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSignup(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
      });
      toast.success("Account created");
      router.push(nextPath);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function requestOtp() {
    if (!reset.email.trim()) {
      toast.error("Email is required");
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch<{ sent: boolean; devOtp?: string }>(
        "/auth/customer/otp/password/request",
        {
          method: "POST",
          body: JSON.stringify({ email: reset.email.trim() }),
        }
      );
      setReset((r) => ({ ...r, devOtp: data.devOtp || "", code: "" }));
      setResetStep(2);
      toast.success(
        data.devOtp
          ? `Dev OTP: ${data.devOtp}`
          : "If the account exists, OTP was sent"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    setBusy(true);
    try {
      await apiFetch("/auth/customer/otp/password/verify", {
        method: "POST",
        body: JSON.stringify({
          email: reset.email.trim(),
          code: reset.code.trim(),
        }),
      });
      setResetStep(3);
      toast.success("OTP verified");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch("/auth/customer/otp/password/confirm", {
        method: "POST",
        body: JSON.stringify({
          email: reset.email.trim(),
          newPassword: reset.newPassword,
        }),
      });
      toast.success("Password updated — you can sign in now");
      setForm((f) => ({
        ...f,
        email: reset.email.trim(),
        password: "",
      }));
      setMode("auth");
      setResetStep(1);
      setReset({ email: "", code: "", newPassword: "", devOtp: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Image
        src="/Food_Items_Images/hero-main.jpg"
        alt="KhabarAdda dining"
        fill
        priority
        className="object-cover object-[center_70%]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/25" />
      <div className="hero-gold-lines pointer-events-none absolute inset-0" />

      {/* Left brand — same as previous design */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-10 hidden max-w-lg p-10 text-white md:p-14 lg:block">
        <p className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[0.04em] text-gold-glow md:text-5xl">
          KhabarAdda
        </p>
        <p className="mt-3 max-w-sm text-sm font-light leading-relaxed text-white/70 md:text-base">
          Sign in to track orders, save addresses, and reserve your table.
        </p>
      </div>

      {/* Form box — centered */}
      <div className="relative z-20 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-[0.04em] text-gold-glow"
          >
            KhabarAdda
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-wide text-gold-glow md:text-4xl">
            {mode === "reset" ? "Reset password" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm font-light text-white/55">
            {mode === "reset"
              ? "Use the email OTP (shown in toast / below in development)."
              : "Login or create an account to continue."}
          </p>

          <div className="gold-frame mt-8 bg-[rgba(12,12,12,0.88)] p-5 backdrop-blur-md md:p-6">
          {mode === "auth" ? (
            <Tabs defaultValue="login">
              <TabsList>
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-5">
                <form onSubmit={onLogin} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-email"
                      className="text-[var(--gold)]/80"
                    >
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="login-password"
                      className="text-[var(--gold)]/80"
                    >
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      required
                      type="password"
                      minLength={6}
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[var(--gold-bright)] hover:underline"
                    onClick={() => {
                      setMode("reset");
                      setResetStep(1);
                      setReset({
                        email: form.email,
                        code: "",
                        newPassword: "",
                        devOtp: "",
                      });
                    }}
                  >
                    Forgot password?
                  </button>
                  <Button type="submit" className="mt-2 w-full" disabled={busy}>
                    {busy ? "Please wait…" : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-5">
                <form onSubmit={onSignup} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-[var(--gold)]/80">
                      Name
                    </Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[var(--gold)]/80">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="signup-email"
                      className="text-[var(--gold)]/80"
                    >
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="signup-password"
                      className="text-[var(--gold)]/80"
                    >
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      required
                      type="password"
                      minLength={6}
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                  <Button type="submit" className="mt-2 w-full" disabled={busy}>
                    {busy ? "Please wait…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-3">
              {resetStep === 1 && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[var(--gold)]/80">Email</Label>
                    <Input
                      type="email"
                      required
                      value={reset.email}
                      onChange={(e) =>
                        setReset({ ...reset, email: e.target.value })
                      }
                      className="border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={busy}
                    onClick={() => void requestOtp()}
                  >
                    {busy ? "Sending…" : "Send OTP"}
                  </Button>
                </>
              )}
              {resetStep === 2 && (
                <>
                  {reset.devOtp && (
                    <p className="rounded-lg border border-[var(--gold)]/25 bg-[var(--surface-container-low)] px-3 py-2 text-xs text-[var(--gold-bright)]">
                      Dev OTP: <strong>{reset.devOtp}</strong>
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-[var(--gold)]/80">OTP code</Label>
                    <Input
                      value={reset.code}
                      onChange={(e) =>
                        setReset({ ...reset, code: e.target.value })
                      }
                      className="border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={busy}
                    onClick={() => void verifyOtp()}
                  >
                    {busy ? "Checking…" : "Verify OTP"}
                  </Button>
                </>
              )}
              {resetStep === 3 && (
                <form onSubmit={confirmReset} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[var(--gold)]/80">New password</Label>
                    <Input
                      type="password"
                      required
                      minLength={6}
                      value={reset.newPassword}
                      onChange={(e) =>
                        setReset({ ...reset, newPassword: e.target.value })
                      }
                      className="border-[var(--gold)]/30 bg-[var(--surface-container-low)]"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Saving…" : "Update password"}
                  </Button>
                </form>
              )}
              <button
                type="button"
                className="w-full text-center text-xs font-semibold text-white/55 hover:text-[var(--gold-bright)]"
                onClick={() => {
                  setMode("auth");
                  setResetStep(1);
                }}
              >
                Back to login
              </button>
            </div>
          )}
          </div>

          <p className="mt-6 text-center text-sm text-white/45">
            <Link
              href="/menu"
              className="font-semibold text-[var(--gold-bright)] hover:underline"
            >
              Continue browsing menu
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center bg-black text-white/60">
          Loading…
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
