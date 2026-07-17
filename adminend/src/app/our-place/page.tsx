"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FiTrash2 } from "react-icons/fi";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";

type GalleryImage = {
  _id: string;
  image: string;
  alt: string;
  caption: string;
  isActive: boolean;
};

export default function OurPlacePage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ image: "", alt: "", caption: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ images: GalleryImage[] }>("/uploads/gallery");
      setImages(data.images);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadFile(file: File) {
    const fd = new FormData();
    fd.append("image", file);
    const data = await apiFetch<{ url: string }>("/uploads", {
      method: "POST",
      body: fd,
      headers: {},
    });
    return data.url;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.image.trim()) {
      toast.error("Image URL or upload required");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/uploads/gallery", {
        method: "POST",
        body: JSON.stringify({
          image: form.image.trim(),
          alt: form.alt.trim(),
          caption: form.caption.trim(),
          isActive: true,
        }),
      });
      toast.success("Photo added");
      setForm({ image: "", alt: "", caption: "" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    try {
      await apiFetch(`/uploads/gallery/${id}`, { method: "DELETE" });
      toast.success("Removed");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
            Our Place
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            Photos shown on the customer homepage gallery.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Add photo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label>Image URL</Label>
                  <Input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="Paste URL or upload below"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadFile(file);
                        setForm((f) => ({ ...f, image: url }));
                        toast.success("Uploaded");
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Upload failed"
                        );
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Alt text</Label>
                  <Input
                    value={form.alt}
                    onChange={(e) => setForm({ ...form, alt: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Caption</Label>
                  <Input
                    value={form.caption}
                    onChange={(e) =>
                      setForm({ ...form, caption: e.target.value })
                    }
                  />
                </div>
                {form.image && (
                  <div className="overflow-hidden rounded-lg bg-[var(--surface-container)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.image}
                      alt="Preview"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                )}
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Add to gallery"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div>
            {loading && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            )}
            {!loading && images.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-sm text-[var(--secondary)]">
                  No gallery photos yet.
                </CardContent>
              </Card>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img) => (
                <Card key={img._id} className="overflow-hidden">
                  <div className="aspect-[4/3] bg-[var(--surface-container)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image}
                      alt={img.alt || img.caption || "Gallery"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="flex items-start justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {img.caption || img.alt || "Untitled"}
                      </p>
                      <p className="text-xs text-[var(--secondary)]">
                        {img.isActive ? "Active" : "Hidden"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => remove(img._id)}
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
