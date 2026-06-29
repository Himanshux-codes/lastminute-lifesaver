"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { Loader2, ArrowLeft, Pencil, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { AchievementsPanel } from "@/components/AchievementsPanel";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (user?.displayName) setName(user.displayName);
  }, [user]);

  async function saveName() {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName: name.trim() });
      showToast("Profile updated.", { variant: "success" });
      setEditing(false);
    } catch (e) {
      showToast(`Couldn't update profile: ${(e as Error).message}`, { variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return <PageLoadingSkeleton />;
  }

  const joinDate = user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "—";

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted">
          <ArrowLeft size={12} /> Back to dashboard
        </a>

        <div className="mb-8 flex items-center gap-4">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt={`${user.displayName ?? "User"}'s avatar`} className="h-16 w-16 rounded-full" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-signal/20 text-xl font-medium text-signal-glow">
              {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <label htmlFor="display-name" className="sr-only">
                  Display name
                </label>
                <input
                  id="display-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg bg-base-700/60 px-3 py-1.5 text-sm text-ink outline-none"
                />
                <button
                  onClick={saveName}
                  disabled={saving}
                  aria-label="Save name"
                  className="rounded-full bg-signal p-1.5 text-white disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-display text-lg font-medium text-ink">{user.displayName ?? "Unnamed"}</p>
                <button onClick={() => setEditing(true)} aria-label="Edit display name" className="text-ink-faint hover:text-ink-muted">
                  <Pencil size={13} />
                </button>
              </div>
            )}
            <p className="text-xs text-ink-faint">{user.email}</p>
            <p className="text-xs text-ink-faint">Member since {joinDate}</p>
          </div>
        </div>

        <AchievementsPanel />
      </div>
    </main>
  );
}
