"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield, UserCog, WalletCards } from "lucide-react";

type AdminUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
  credits: number;
  totalUsedCredits: number;
  createdAt: string;
  usageLogs: Array<{
    id: string;
    feature: string;
    model: string;
    creditsUsed: number;
    bypassed: boolean;
    status: string;
  }>;
};

export function AdminUsersPanel() {
  const [adminEmail, setAdminEmail] = useState("admin@togo.ai");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("togo-admin-email");
    if (saved) setAdminEmail(saved);
  }, []);

  async function loadUsers() {
    setLoading(true);
    setMessage(null);
    window.localStorage.setItem("togo-admin-email", adminEmail);
    try {
      const response = await fetch("/api/admin/users", {
        headers: { "x-togo-user-email": adminEmail }
      });
      const data = (await response.json()) as { users?: AdminUser[]; message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "Admin access failed.");
        return;
      }
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function adjustCredits(userId: string, amount: number) {
    await adminRequest("/api/admin/users/credits", "POST", {
      userId,
      amount,
      description: `Admin adjusted ${amount} credits`
    });
  }

  async function updateUser(userId: string, body: Partial<Pick<AdminUser, "role" | "status">>) {
    await adminRequest("/api/admin/users", "PATCH", { userId, ...body });
  }

  async function adminRequest(url: string, method: "POST" | "PATCH", body: Record<string, unknown>) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-togo-user-email": adminEmail
        },
        body: JSON.stringify(body)
      });
      const data = (await response.json()) as { message?: string };
      setMessage(response.ok ? "Admin action completed." : data.message ?? "Admin action failed.");
      await loadUsers();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-black/45 p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex rounded-md border border-cyan-400/30 bg-cyan-400/10 p-2 text-cyan-100">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-black text-white">Admin User Management</h2>
          <p className="mt-1 text-sm text-zinc-500">Manage credits, roles, account status, and AI usage logs.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <input
            className="h-11 min-w-0 rounded-md border border-white/10 bg-black/60 px-3 text-sm text-zinc-100 outline-none focus:border-cyan-300/60 sm:w-72"
            value={adminEmail}
            onChange={(event) => setAdminEmail(event.target.value)}
            placeholder="admin@togo.ai"
          />
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-black text-black transition hover:bg-cyan-100 disabled:opacity-60"
            onClick={loadUsers}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserCog className="h-4 w-4" aria-hidden="true" />}
            Load Users
          </button>
        </div>
      </div>

      {message ? <p className="mb-4 rounded-md border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">{message}</p> : null}

      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="grid grid-cols-[1.3fr_0.6fr_0.6fr_0.7fr_1.5fr] gap-0 bg-white/[0.06] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Credits</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-white/10">
          {users.map((user) => (
            <article key={user.id} className="grid grid-cols-[1.3fr_0.6fr_0.6fr_0.7fr_1.5fr] items-center gap-0 px-4 py-3 text-sm text-zinc-300">
              <div>
                <p className="font-bold text-white">{user.email}</p>
                <p className="text-xs text-zinc-500">Used {user.totalUsedCredits.toLocaleString()} credits</p>
              </div>
              <span>{user.role}</span>
              <span>{user.status}</span>
              <span className="font-black text-cyan-100">{user.credits.toLocaleString()}</span>
              <div className="flex flex-wrap gap-2">
                <AdminButton onClick={() => adjustCredits(user.id, 1000)}>+1000</AdminButton>
                <AdminButton onClick={() => adjustCredits(user.id, -100)}>-100</AdminButton>
                <AdminButton onClick={() => updateUser(user.id, { role: user.role === "ADMIN" ? "USER" : "ADMIN" })}>
                  {user.role === "ADMIN" ? "Set USER" : "Set ADMIN"}
                </AdminButton>
                <AdminButton onClick={() => updateUser(user.id, { status: user.status === "DISABLED" ? "ACTIVE" : "DISABLED" })}>
                  {user.status === "DISABLED" ? "Enable" : "Disable"}
                </AdminButton>
              </div>
            </article>
          ))}
          {users.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-8 text-sm text-zinc-500">
              <WalletCards className="h-4 w-4" aria-hidden="true" />
              No users loaded.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AdminButton({
  children,
  onClick
}: {
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      className="h-8 rounded-md border border-white/10 bg-white/[0.05] px-3 text-xs font-bold text-zinc-200 transition hover:border-cyan-400/40 hover:text-cyan-100"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
