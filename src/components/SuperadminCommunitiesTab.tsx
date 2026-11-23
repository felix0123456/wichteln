"use client";

import React, { useState, useEffect } from "react";
import {
  Link2,
  Plus,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  KeyRound,
  Users,
  Shield,
  Ban,
} from "lucide-react";

interface CommunitySummary {
  id: string;
  slug: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  participantCount: number;
  subgroupCount: number;
  isDrawn: boolean;
}

interface InviteItem {
  id: string;
  token: string;
  label: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  community: {
    id: string;
    slug: string;
    name: string;
  } | null;
}

export default function SuperadminCommunitiesTab({
  onNotify,
}: {
  onNotify: (type: "success" | "error", text: string) => void;
}) {
  const [communities, setCommunities] = useState<CommunitySummary[]>([]);
  const [invites, setInvites] = useState<InviteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteLabel, setInviteLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("14");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  const loadData = async () => {
    try {
      const [cRes, iRes] = await Promise.all([
        fetch("/api/superadmin/communities"),
        fetch("/api/superadmin/invites"),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        setCommunities(cData.communities || []);
      }
      if (iRes.ok) {
        const iData = await iRes.json();
        setInvites(iData.invites || []);
      }
    } catch {
      onNotify("error", "Fehler beim Laden der Communities & Einladungen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingInvite(true);
    try {
      const res = await fetch("/api/superadmin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: inviteLabel.trim() || null,
          expiresInDays: expiresInDays === "never" ? 0 : Number(expiresInDays),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onNotify("error", data.error || "Einladungslink konnte nicht erstellt werden.");
      } else {
        setInviteLabel("");
        onNotify("success", "Neuer Einladungslink erstellt!");
        await loadData();
      }
    } catch {
      onNotify("error", "Netzwerkfehler beim Erstellen des Einladungslinks.");
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleCopyInvite = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevokeInvite = async (id: string) => {
    if (!confirm("Diesen Einladungslink wirklich widerrufen?")) return;
    try {
      const res = await fetch(`/api/superadmin/invites?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onNotify("success", "Einladungslink widerrufen.");
        await loadData();
      } else {
        const data = await res.json();
        onNotify("error", data.error || "Fehler beim Widerrufen.");
      }
    } catch {
      onNotify("error", "Netzwerkfehler.");
    }
  };

  const handleResetPassword = async (id: string) => {
    if (resetPasswordValue.trim().length < 6) {
      onNotify("error", "Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    try {
      const res = await fetch("/api/superadmin/communities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, newPassword: resetPasswordValue.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onNotify("success", "Admin-Passwort aktualisiert.");
        setResetTargetId(null);
        setResetPasswordValue("");
      } else {
        onNotify("error", data.error || "Fehler beim Zurücksetzen.");
      }
    } catch {
      onNotify("error", "Netzwerkfehler.");
    }
  };

  const handleDeleteCommunity = async (c: CommunitySummary) => {
    if (
      !confirm(
        `Community "${c.name}" (/c/${c.slug}) mit allen ${c.participantCount} Teilnehmern unwiderruflich löschen?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/superadmin/communities?id=${encodeURIComponent(c.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        onNotify("success", `Community "${c.name}" wurde gelöscht.`);
        await loadData();
      } else {
        onNotify("error", data.error || "Fehler beim Löschen.");
      }
    } catch {
      onNotify("error", "Netzwerkfehler.");
    }
  };

  const getInviteStatus = (inv: InviteItem) => {
    if (inv.usedAt) return { label: "Genutzt", cls: "badge-green" };
    if (inv.revokedAt) return { label: "Widerrufen", cls: "badge-red" };
    if (inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now()) {
      return { label: "Abgelaufen", cls: "badge-red" };
    }
    return { label: "Offen", cls: "badge-gold" };
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "28px", color: "var(--ink-secondary)" }}>
        Lade Communities &amp; Einladungen...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Invite Link Generator */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h2
          className="font-festive"
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--ink-primary)",
          }}
        >
          <Link2 size={18} color="var(--accent)" />
          Subadmin-Einladungslinks
        </h2>
        <p style={{ color: "var(--ink-secondary)", fontSize: "0.92rem", marginBottom: "18px" }}>
          Erstelle einen einmaligen Link, über den jemand eine eigene Wichtel-Community mit eigenem
          Admin-Passwort anlegen kann.
        </p>

        <form
          onSubmit={handleCreateInvite}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            className="festive-input"
            placeholder="Notiz / Empfänger (optional, z.B. Max Büro)"
            value={inviteLabel}
            onChange={(e) => setInviteLabel(e.target.value)}
            style={{ flex: "1 1 220px" }}
          />
          <select
            className="festive-input"
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            style={{ width: "175px" }}
          >
            <option value="7">Gültig: 7 Tage</option>
            <option value="14">Gültig: 14 Tage</option>
            <option value="30">Gültig: 30 Tage</option>
            <option value="never">Kein Ablaufdatum</option>
          </select>
          <button
            type="submit"
            className="btn-festive-red"
            disabled={creatingInvite}
            style={{ padding: "11px 18px" }}
          >
            <Plus size={16} />
            Einladungslink erstellen
          </button>
        </form>

        {invites.length === 0 ? (
          <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
            Noch keine Einladungslinks erstellt.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {invites.map((inv) => {
              const status = getInviteStatus(inv);
              const isOpen = status.label === "Offen";
              return (
                <div
                  key={inv.id}
                  style={{
                    background: "var(--bg-paper)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                      <strong style={{ color: "var(--ink-primary)" }}>
                        {inv.label || "Ohne Notiz"}
                      </strong>
                      {inv.community && (
                        <a
                          href={`/c/${inv.community.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono-code"
                          style={{
                            color: "var(--accent)",
                            fontSize: "0.82rem",
                            textDecoration: "underline",
                          }}
                        >
                          → {inv.community.name} (/c/{inv.community.slug})
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)", marginTop: "4px" }}>
                      Erstellt: {new Date(inv.createdAt).toLocaleDateString("de-DE")}
                      {inv.expiresAt &&
                        ` · Läuft ab: ${new Date(inv.expiresAt).toLocaleDateString("de-DE")}`}
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="btn-festive-outline"
                        onClick={() => handleCopyInvite(inv.token)}
                        style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                      >
                        {copiedToken === inv.token ? (
                          <>
                            <Check size={14} /> Kopiert!
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Link kopieren
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-festive-outline"
                        onClick={() => handleRevokeInvite(inv.id)}
                        style={{
                          padding: "6px 10px",
                          fontSize: "0.82rem",
                          color: "var(--status-err-ink)",
                          borderColor: "var(--status-err-border)",
                        }}
                        title="Widerrufen"
                      >
                        <Ban size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Communities List */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h2
          className="font-festive"
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--ink-primary)",
          }}
        >
          <Shield size={18} color="var(--accent)" />
          Alle Communities ({communities.length})
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {communities.map((c) => {
            const publicUrl = c.isDefault ? "/" : `/c/${c.slug}`;
            const adminUrl = c.isDefault ? "/admin" : `/c/${c.slug}/admin`;
            return (
              <div
                key={c.id}
                style={{
                  background: "var(--bg-paper)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "1.05rem", color: "var(--ink-primary)" }}>
                        {c.name}
                      </strong>
                      {c.isDefault && <span className="badge badge-gold">Standard</span>}
                      <span className={`badge ${c.isDrawn ? "badge-green" : "badge-gold"}`}>
                        {c.isDrawn ? "Ausgelost" : "Offen"}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.84rem",
                        color: "var(--ink-secondary)",
                        marginTop: "4px",
                        display: "flex",
                        gap: "14px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span className="font-mono-code">URL: {publicUrl}</span>
                      <span>
                        <Users size={13} style={{ display: "inline", marginRight: "4px" }} />
                        {c.participantCount} Teilnehmer · {c.subgroupCount} Gruppen
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-festive-outline"
                      style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                    >
                      <ExternalLink size={14} /> Seite
                    </a>
                    {!c.isDefault && (
                      <>
                        <a
                          href={adminUrl}
                          className="btn-festive-red"
                          style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                        >
                          Admin öffnen
                        </a>
                        <button
                          type="button"
                          className="btn-festive-outline"
                          onClick={() => {
                            setResetTargetId(resetTargetId === c.id ? null : c.id);
                            setResetPasswordValue("");
                          }}
                          style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                          title="Admin-Passwort zurücksetzen"
                        >
                          <KeyRound size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-festive-outline"
                          onClick={() => handleDeleteCommunity(c)}
                          style={{
                            padding: "6px 10px",
                            fontSize: "0.82rem",
                            color: "var(--status-err-ink)",
                            borderColor: "var(--status-err-border)",
                          }}
                          title="Community löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {resetTargetId === c.id && (
                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid var(--border-hairline)",
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <input
                      type="password"
                      className="festive-input"
                      placeholder="Neues Admin-Passwort (mind. 6 Zeichen)"
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      style={{ flex: "1 1 220px" }}
                    />
                    <button
                      type="button"
                      className="btn-festive-red"
                      onClick={() => handleResetPassword(c.id)}
                      style={{ padding: "8px 14px" }}
                    >
                      Passwort speichern
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
