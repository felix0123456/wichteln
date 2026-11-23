"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  FolderTree,
  Sparkles,
  RefreshCw,
  LogOut,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Gift,
  Calendar,
  Share2,
  Lock,
  Edit2,
  X,
  ExternalLink,
  Shield,
  ArrowLeft,
} from "lucide-react";
import SuperadminCommunitiesTab from "@/components/SuperadminCommunitiesTab";

interface Subgroup {
  id: string;
  name: string;
  color?: string | null;
  _count?: { participants: number };
}

interface Participant {
  id: string;
  name: string;
  pin: string;
  subgroupId: string;
  subgroup: Subgroup;
  hasRevealed: boolean;
  revealedAt?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    subgroup: { id: string; name: string; color?: string | null };
  } | null;
}

interface SettingsData {
  budget: string;
  event_date: string;
  notes: string;
  is_drawn: boolean;
  drawn_at: string | null;
}

export default function AdminDashboard({
  communitySlug,
}: {
  communitySlug?: string;
}) {
  const router = useRouter();

  const apiUrl = (path: string) => {
    if (!communitySlug) return path;
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}community=${encodeURIComponent(communitySlug)}`;
  };

  // Auth & Community State
  const [authenticated, setAuthenticated] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [communityName, setCommunityName] = useState<string>(
    communitySlug ? communitySlug : "Wichtel-Zentrale"
  );
  const [communityNotFound, setCommunityNotFound] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "pins" | "matrix" | "settings" | "communities"
  >("overview");

  // Data
  const [subgroups, setSubgroups] = useState<Subgroup[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<SettingsData>({
    budget: "ca. 20-30 €",
    event_date: "24. Dezember 2026",
    notes: "Bitte halte dein Wichtelkind bis zur Bescherung streng geheim!",
    is_drawn: false,
    drawn_at: null,
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [reassignmentNotice, setReassignmentNotice] = useState<{
    deletedName: string;
    giverId: string;
    giverName: string;
    giverSubgroup: string;
    giverPin: string;
    hadAlreadyRevealed: boolean;
    sameSubgroupWarning: boolean;
  } | null>(null);
  const [copiedReassign, setCopiedReassign] = useState(false);

  // Modals & Form States
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#1E563B");

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberSubgroup, setNewMemberSubgroup] = useState("");
  const [newMemberPin, setNewMemberPin] = useState("");

  const [bulkSubgroup, setBulkSubgroup] = useState("");
  const [bulkNames, setBulkNames] = useState("");

  // Privacy mask for matrix
  const [showMatrix, setShowMatrix] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editing state for participants
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPin, setEditPin] = useState("");
  const [editSubgroupId, setEditSubgroupId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    checkAuthAndLoad();
  }, [communitySlug]);

  // Scroll-reveal observer for long admin sections
  useEffect(() => {
    const els = document.querySelectorAll(".scroll-reveal");
    if (els.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab, participants.length, subgroups.length]);

  const checkAuthAndLoad = async () => {
    try {
      const authRes = await fetch(apiUrl("/api/admin/auth"));
      if (authRes.status === 404) {
        setCommunityNotFound(true);
        return;
      }
      const authData = await authRes.json();
      if (authData.community?.name) {
        setCommunityName(authData.community.name);
      }
      setIsSuperadmin(Boolean(authData.isSuperadmin));

      if (!authData.authenticated) {
        if (!communitySlug) {
          router.push("/admin/login");
          return;
        }
        setAuthenticated(false);
        return;
      }
      setAuthenticated(true);
      await loadAllData();
    } catch {
      if (!communitySlug) {
        router.push("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: loginPassword,
          communitySlug,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Falsches Passwort.");
      } else {
        setLoginPassword("");
        setAuthenticated(true);
        setIsSuperadmin(data.role === "superadmin");
        await loadAllData();
      }
    } catch {
      setLoginError("Netzwerkfehler beim Login.");
    } finally {
      setLoggingIn(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [subsRes, partsRes, setRes] = await Promise.all([
        fetch(apiUrl("/api/admin/subgroups")),
        fetch(apiUrl("/api/admin/participants")),
        fetch(apiUrl("/api/admin/settings")),
      ]);

      if (subsRes.ok) {
        const d = await subsRes.json();
        setSubgroups(d.subgroups || []);
      }
      if (partsRes.ok) {
        const d = await partsRes.json();
        setParticipants(d.participants || []);
      }
      if (setRes.ok) {
        const d = await setRes.json();
        setSettings(d.settings || {});
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    if (communitySlug) {
      setAuthenticated(false);
      setIsSuperadmin(false);
    } else {
      router.push("/admin/login");
    }
  };

  // Group Handlers
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch(apiUrl("/api/admin/subgroups"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName, color: newGroupColor }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewGroupName("");
        setAlertMessage({ type: "success", text: "Gruppe hinzugefügt." });
        await loadAllData();
      } else {
        setAlertMessage({ type: "error", text: data.error });
      }
    } catch {
      setAlertMessage({ type: "error", text: "Fehler beim Hinzufügen der Gruppe." });
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Gruppe wirklich löschen? Alle zugehörigen Teilnehmer werden ebenfalls gelöscht.")) return;

    try {
      const res = await fetch(apiUrl(`/api/admin/subgroups?id=${id}`), { method: "DELETE" });
      if (res.ok) {
        setAlertMessage({ type: "success", text: "Gruppe gelöscht." });
        await loadAllData();
      }
    } catch {
      setAlertMessage({ type: "error", text: "Fehler beim Löschen." });
    }
  };

  // Member Handlers
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberSubgroup) return;

    try {
      const res = await fetch(apiUrl("/api/admin/participants"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMemberName,
          subgroupId: newMemberSubgroup,
          pin: newMemberPin || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewMemberName("");
        setNewMemberPin("");
        setAlertMessage({ type: "success", text: "Teilnehmer hinzugefügt." });
        await loadAllData();
      } else {
        setAlertMessage({ type: "error", text: data.error });
      }
    } catch {
      setAlertMessage({ type: "error", text: "Fehler beim Anlegen." });
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkSubgroup || !bulkNames.trim()) return;

    const names = bulkNames
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (names.length === 0) return;

    try {
      const participantsToCreate = names.map((name) => ({
        name,
        subgroupId: bulkSubgroup,
      }));

      const res = await fetch(apiUrl("/api/admin/participants"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participants: participantsToCreate }),
      });

      if (res.ok) {
        setBulkNames("");
        setAlertMessage({
          type: "success",
          text: `${names.length} Teilnehmer erfolgreich hinzugefügt!`,
        });
        await loadAllData();
      }
    } catch {
      setAlertMessage({ type: "error", text: "Fehler beim Bulk-Import." });
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Teilnehmer wirklich entfernen? Falls bereits ausgelost wurde, wird dessen Wichtelkind automatisch an seinen bisherigen Wichtel weitergegeben.")) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/participants?id=${id}`), { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        if (data.reassignment) {
          setReassignmentNotice({
            deletedName: data.deletedName,
            ...data.reassignment,
          });
          setAlertMessage({
            type: "success",
            text: `Teilnehmer "${data.deletedName}" gelöscht. Wichtelkind wurde an ${data.reassignment.giverName} (${data.reassignment.giverSubgroup}) übertragen!`,
          });
        } else {
          setAlertMessage({ type: "success", text: "Teilnehmer gelöscht." });
        }
        await loadAllData();
      } else {
        setAlertMessage({ type: "error", text: data.error || "Fehler beim Löschen." });
      }
    } catch {
      setAlertMessage({ type: "error", text: "Fehler beim Löschen." });
    }
  };

  // Draw Handler
  const handleTriggerDraw = async () => {
    if (settings.is_drawn) {
      if (
        !confirm(
          "Achtung: Es existiert bereits eine Auslosung! Wenn du neu auslost, werden alle bisherigen Zuteilungen überschrieben. Fortfahren?"
        )
      ) {
        return;
      }
    }

    setActionLoading(true);
    setAlertMessage(null);

    try {
      const res = await fetch(apiUrl("/api/admin/draw"), { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setAlertMessage({
          type: "success",
          text: `Auslosung erfolgreich für ${data.count} Teilnehmer durchgeführt! Alle Einschränkungen (keine eigene Gruppe, keine 2er-Gegenseitigkeit) erfüllt.`,
        });
        await loadAllData();
      } else {
        setAlertMessage({ type: "error", text: data.error });
      }
    } catch {
      setAlertMessage({ type: "error", text: "Fehler beim Ausführen der Auslosung." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDraw = async () => {
    if (!confirm("Möchtest du die Auslosung wirklich zurücksetzen?")) return;

    setActionLoading(true);
    try {
      const res = await fetch(apiUrl("/api/admin/draw"), { method: "DELETE" });
      if (res.ok) {
        setAlertMessage({ type: "success", text: "Auslosung zurückgesetzt." });
        await loadAllData();
      }
    } catch {
      setAlertMessage({ type: "error", text: "Fehler beim Zurücksetzen." });
    } finally {
      setActionLoading(false);
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/admin/settings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setAlertMessage({ type: "success", text: "Einstellungen gespeichert." });
      }
    } catch {
      setAlertMessage({ type: "error", text: "Fehler beim Speichern." });
    }
  };

  // Participant Editing Handlers
  const startEditing = (p: Participant) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPin(p.pin);
    setEditSubgroupId(p.subgroupId);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditPin("");
    setEditSubgroupId("");
  };

  const saveEditing = async (id: string) => {
    if (!editName.trim()) {
      setAlertMessage({ type: "error", text: "Name darf nicht leer sein." });
      return;
    }
    if (!editPin.trim()) {
      setAlertMessage({ type: "error", text: "PIN darf nicht leer sein." });
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(apiUrl("/api/admin/participants"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName.trim(),
          pin: editPin.trim(),
          subgroupId: editSubgroupId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAlertMessage({
          type: "success",
          text: `Teilnehmer "${editName}" erfolgreich aktualisiert!`,
        });
        cancelEditing();
        await loadAllData();
      } else {
        setAlertMessage({ type: "error", text: data.error || "Fehler beim Speichern." });
      }
    } catch {
      setAlertMessage({ type: "error", text: "Netzwerkfehler beim Speichern." });
    } finally {
      setSavingEdit(false);
    }
  };

  const portalPath = communitySlug ? `/c/${communitySlug}` : "/";

  const getDirectLink = (p: Participant) => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://wichteln.felixresch.com";
    return `${origin}${portalPath}?id=${p.id}&pin=${encodeURIComponent(p.pin)}`;
  };

  const getWhatsAppMessage = (p: Participant) => {
    const directLink = getDirectLink(p);
    return `Hallo ${p.name}! 🎄 Hier ist dein persönlicher Wichtel-Link für dieses Jahr:\n${directLink}\n\nKlicke einfach auf den Link, um direkt zu erfahren, wen du beschenkst (keine PIN-Eingabe nötig)! 🎁`;
  };

  const copyWhatsAppMessage = (p: Participant) => {
    const text = getWhatsAppMessage(p);
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) {
    return (
      <main className="admin-shell">
        <div style={{ padding: "80px 0", color: "var(--ink-secondary)", fontWeight: 500 }}>
          Admin-Bereich wird geladen...
        </div>
      </main>
    );
  }

  if (communityNotFound) {
    return (
      <main className="portal-shell">
        <div
          className="editorial-card-strong"
          style={{ maxWidth: "460px", margin: "64px auto", padding: "32px" }}
        >
          <span className="eyebrow" style={{ color: "var(--accent)" }}>
            404 · Nicht gefunden
          </span>
          <h1 className="font-festive" style={{ fontSize: "2rem", margin: "10px 0" }}>
            Community nicht gefunden
          </h1>
          <p style={{ color: "var(--ink-secondary)", marginBottom: "20px" }}>
            Diese Wichtel-Community existiert nicht.
          </p>
          <a href="/" className="btn-festive-outline">
            Zur Hauptseite
          </a>
        </div>
      </main>
    );
  }

  if (communitySlug && !authenticated) {
    return (
      <main className="portal-shell">
        <header
          className="stagger-in"
          style={{
            ["--stagger-index" as string]: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
            marginBottom: "clamp(32px, 6vw, 64px)",
            borderBottom: "1px solid var(--border-hairline)",
          }}
        >
          <span className="eyebrow font-mono-code" style={{ color: "var(--ink-primary)" }}>
            wichteln / {communitySlug} / admin
          </span>
          <a href={portalPath} className="btn-festive-outline" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
            <ArrowLeft size={14} />
            Zurück zur Gruppe
          </a>
        </header>

        <div className="portal-grid">
          <section className="portal-col-left stagger-in" style={{ ["--stagger-index" as string]: 1 }}>
            <span className="eyebrow" style={{ display: "block", marginBottom: "12px" }}>
              Community-Verwaltung
            </span>
            <h1
              className="font-festive"
              style={{
                fontSize: "clamp(2.2rem, 4vw, 3.1rem)",
                fontWeight: 700,
                lineHeight: 1.06,
                marginBottom: "14px",
              }}
            >
              {communityName}
            </h1>
            <p style={{ color: "var(--ink-secondary)", maxWidth: "38ch" }}>
              Melde dich mit dem bei der Registrierung gewählten Admin-Passwort an, um Teilnehmer
              und Auslosung zu verwalten.
            </p>
          </section>

          <section className="portal-col-right stagger-in" style={{ ["--stagger-index" as string]: 2 }}>
            <div className="editorial-card-strong" style={{ maxWidth: "460px", padding: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <span
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "var(--accent-tint)",
                    color: "var(--accent)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Lock size={18} />
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>Admin-Login</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--ink-muted)" }}>
                    Community-Passwort erforderlich
                  </div>
                </div>
              </div>

              {loginError && (
                <div
                  style={{
                    background: "var(--status-err-bg)",
                    border: "1px solid var(--status-err-border)",
                    color: "var(--status-err-ink)",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    marginBottom: "16px",
                    fontSize: "0.88rem",
                  }}
                >
                  {loginError}
                </div>
              )}

              <form onSubmit={handleCommunityLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <input
                  type="password"
                  className="festive-input"
                  placeholder="Community Admin-Passwort"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn-festive-red"
                  disabled={loggingIn}
                  style={{ padding: "12px" }}
                >
                  {loggingIn ? "Anmelden..." : "Anmelden"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const totalParticipants = participants.length;
  const revealedCount = participants.filter((p) => p.hasRevealed).length;

  const navTabs = [
    { id: "overview", label: "Übersicht & Auslosung", icon: Sparkles },
    { id: "members", label: "Gruppen & Teilnehmer", icon: Users },
    { id: "pins", label: "PINs & WhatsApp", icon: Lock },
    { id: "matrix", label: "Wichtel-Matrix", icon: Gift },
    { id: "settings", label: "Einstellungen", icon: Calendar },
    ...(!communitySlug
      ? [{ id: "communities", label: "Communities & Einladungen", icon: Shield }]
      : []),
  ];

  return (
    <div className="admin-shell">
      {/* Top Masthead */}
      <header
        className="stagger-in"
        style={{
          ["--stagger-index" as string]: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "28px",
          paddingBottom: "18px",
          borderBottom: "1px solid var(--border-hairline)",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span className="eyebrow" style={{ display: "block", marginBottom: "6px" }}>
            {communitySlug ? `Community · /c/${communitySlug}` : "Superadmin · Standard-Runde"}
          </span>
          <h1
            className="font-festive"
            style={{
              fontSize: "clamp(1.9rem, 3.2vw, 2.5rem)",
              fontWeight: 700,
              color: "var(--ink-primary)",
              lineHeight: 1.08,
            }}
          >
            {communitySlug ? communityName : "Wichtel-Zentrale"}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {communitySlug && isSuperadmin && (
            <a href="/admin" className="btn-festive-outline" style={{ fontSize: "0.85rem", padding: "8px 14px" }}>
              ← Superadmin
            </a>
          )}
          <a href={portalPath} target="_blank" className="btn-festive-outline" style={{ fontSize: "0.85rem", padding: "8px 14px" }}>
            Teilnehmer-Seite
            <ExternalLink size={14} />
          </a>
          <button
            onClick={handleLogout}
            className="btn-festive-outline"
            style={{
              fontSize: "0.85rem",
              padding: "8px 14px",
              color: "var(--status-err-ink)",
              borderColor: "var(--status-err-border)",
            }}
          >
            <LogOut size={15} />
            Abmelden
          </button>
        </div>
      </header>

      {/* Global Alert Notification */}
      {alertMessage && (
        <div
          style={{
            background: alertMessage.type === "success" ? "var(--status-ok-bg)" : "var(--status-err-bg)",
            border: `1px solid ${
              alertMessage.type === "success" ? "var(--status-ok-border)" : "var(--status-err-border)"
            }`,
            color: alertMessage.type === "success" ? "var(--status-ok-ink)" : "var(--status-err-ink)",
            borderRadius: "10px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 500,
          }}
        >
          <div>{alertMessage.text}</div>
          <button
            onClick={() => setAlertMessage(null)}
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Reassignment Notice Banner */}
      {reassignmentNotice && (
        <div
          style={{
            background: "var(--status-warn-bg)",
            border: "1px solid var(--status-warn-border)",
            color: "var(--status-warn-ink)",
            borderRadius: "12px",
            padding: "16px 18px",
            marginBottom: "22px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "1rem" }}>
              <AlertTriangle size={18} />
              Wichtelkind-Weitergabe nach Löschung von „{reassignmentNotice.deletedName}“
            </div>
            <button
              onClick={() => setReassignmentNotice(null)}
              style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "1rem" }}
              title="Hinweis schließen"
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: "0.92rem", lineHeight: 1.5, color: "var(--ink-primary)" }}>
            <strong>{reassignmentNotice.giverName}</strong> ({reassignmentNotice.giverSubgroup}) hatte bisher{" "}
            <strong>{reassignmentNotice.deletedName}</strong> als Wichtelkind gezogen und hat nun automatisch das Wichtelkind von{" "}
            <strong>{reassignmentNotice.deletedName}</strong> übernommen.
            {reassignmentNotice.hadAlreadyRevealed ? (
              <span>
                {" "}Da <strong>{reassignmentNotice.giverName}</strong> das alte Los bereits geöffnet hatte, gib{" "}
                <strong>{reassignmentNotice.giverName}</strong> bitte Bescheid, noch einmal über den persönlichen Link nachzuschauen!
              </span>
            ) : (
              <span>
                {" "}({reassignmentNotice.giverName} hatte das alte Los noch nicht geöffnet, sieht beim Aufrufen des Links also direkt das neue Wichtelkind.)
              </span>
            )}
          </div>

          {reassignmentNotice.sameSubgroupWarning && (
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--status-err-ink)",
                background: "var(--status-err-bg)",
                border: "1px solid var(--status-err-border)",
                padding: "8px 12px",
                borderRadius: "8px",
              }}
            >
              Hinweis: Durch diese direkte Übernahme befindet sich das neue Wichtelkind von{" "}
              {reassignmentNotice.giverName} in derselben Untergruppe ({reassignmentNotice.giverSubgroup}).
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => {
                const origin =
                  typeof window !== "undefined" && window.location.origin
                    ? window.location.origin
                    : "https://wichteln.felixresch.com";
                const link = `${origin}${portalPath}?id=${reassignmentNotice.giverId}&pin=${encodeURIComponent(reassignmentNotice.giverPin)}`;
                const msg = `Hallo ${reassignmentNotice.giverName}! 🎄 Da sich bei den Teilnehmern noch eine kleine Änderung ergeben hat, wurde dir ein neues Wichtelkind zugeteilt.\n\nBitte schau über deinen persönlichen Link noch einmal nach, wen du jetzt beschenkst:\n${link} 🎁`;
                navigator.clipboard.writeText(msg);
                setCopiedReassign(true);
                setTimeout(() => setCopiedReassign(false), 2500);
              }}
              className="btn-festive-red"
              style={{ padding: "8px 14px", fontSize: "0.85rem" }}
            >
              {copiedReassign ? <Check size={15} /> : <Share2 size={15} />}
              {copiedReassign
                ? "Nachricht kopiert!"
                : `Update-Nachricht für ${reassignmentNotice.giverName} kopieren`}
            </button>
          </div>
        </div>
      )}

      {/* Asymmetric Sidebar Rail + Main Workspace */}
      <div className="admin-layout">
        <nav
          className="admin-rail stagger-in"
          style={{ ["--stagger-index" as string]: 1 }}
          aria-label="Admin-Navigation"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--accent-ink)" : "var(--ink-secondary)",
                  background: active ? "var(--ink-primary)" : "transparent",
                  border: active ? "1px solid var(--ink-primary)" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "background-color 150ms var(--ease-editorial), color 150ms var(--ease-editorial)",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                }}
              >
                <Icon size={16} color={active ? "var(--accent-ink)" : "var(--ink-muted)"} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="stagger-in" style={{ ["--stagger-index" as string]: 2, minWidth: 0 }}>
          {/* TAB 1: OVERVIEW & DRAW (Asymmetric 1.55fr / 1fr split) */}
          {activeTab === "overview" && (
            <div className="admin-overview-grid">
              <div
                className="editorial-card-strong"
                style={{
                  padding: "28px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "24px",
                }}
              >
                <div>
                  <span className="eyebrow" style={{ display: "block", marginBottom: "8px" }}>
                    Auslosungs-Steuerung
                  </span>
                  <h2
                    className="font-festive"
                    style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--ink-primary)", marginBottom: "10px" }}
                  >
                    {settings.is_drawn ? "Auslosung ist aktiv" : "Bereit für die Auslosung?"}
                  </h2>
                  <p style={{ color: "var(--ink-secondary)", fontSize: "0.95rem", lineHeight: 1.55 }}>
                    Der Matching-Algorithmus verhindert Zuteilungen innerhalb derselben Untergruppe
                    und schließt direkte 2er-Gegenseitigkeiten (A → B → A) vollständig aus.
                  </p>
                </div>

                <div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={handleTriggerDraw}
                      disabled={actionLoading || totalParticipants < 3}
                      className="btn-festive-red"
                      style={{ padding: "13px 24px" }}
                    >
                      <Sparkles size={18} />
                      {settings.is_drawn ? "Neu auslosen" : "Wichteln jetzt auslosen"}
                    </button>

                    {settings.is_drawn && (
                      <button
                        type="button"
                        onClick={handleResetDraw}
                        disabled={actionLoading}
                        className="btn-festive-outline"
                        style={{ padding: "13px 20px" }}
                      >
                        <RefreshCw size={16} />
                        Zurücksetzen
                      </button>
                    )}
                  </div>

                  {settings.drawn_at && (
                    <div style={{ marginTop: "14px", color: "var(--ink-muted)", fontSize: "0.82rem" }}>
                      Letzte Auslosung: {new Date(settings.drawn_at).toLocaleString("de-DE")}
                    </div>
                  )}
                </div>
              </div>

              {/* Compact Stacked KPI Ledger */}
              <div className="glass-panel" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ paddingBottom: "14px", borderBottom: "1px solid var(--border-hairline)" }}>
                  <div className="eyebrow" style={{ marginBottom: "6px" }}>Status</div>
                  {settings.is_drawn ? (
                    <span className="badge badge-green">Fertig ausgelost</span>
                  ) : (
                    <span className="badge badge-gold">Noch nicht ausgelost</span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: "14px", borderBottom: "1px solid var(--border-hairline)" }}>
                  <span style={{ color: "var(--ink-secondary)", fontSize: "0.9rem" }}>Teilnehmer</span>
                  <span className="font-mono-code" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--ink-primary)" }}>
                    {totalParticipants}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: "14px", borderBottom: "1px solid var(--border-hairline)" }}>
                  <span style={{ color: "var(--ink-secondary)", fontSize: "0.9rem" }}>Untergruppen</span>
                  <span className="font-mono-code" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--ink-primary)" }}>
                    {subgroups.length}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ color: "var(--ink-secondary)", fontSize: "0.9rem" }}>Los aufgedeckt</span>
                  <span className="font-mono-code" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--status-ok-ink)" }}>
                    {revealedCount}/{totalParticipants}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GROUPS & MEMBERS */}
          {activeTab === "members" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="admin-members-grid">
                {/* Subgroups Section */}
                <div className="glass-panel" style={{ padding: "22px" }}>
                  <h3
                    className="font-festive"
                    style={{ fontSize: "1.35rem", fontWeight: 600, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <FolderTree size={18} color="var(--accent)" />
                    1. Untergruppen
                  </h3>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
                    {subgroups.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          background: "var(--bg-paper)",
                          border: "1px solid var(--border-hairline)",
                          borderRadius: "8px",
                          padding: "6px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor: g.color || "var(--status-ok-ink)",
                          }}
                        />
                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{g.name}</span>
                        <span style={{ color: "var(--ink-muted)", fontSize: "0.8rem" }}>
                          ({participants.filter((p) => p.subgroupId === g.id).length})
                        </span>
                        <button
                          onClick={() => handleDeleteGroup(g.id)}
                          title="Gruppe löschen"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--status-err-ink)",
                            cursor: "pointer",
                            padding: "2px",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddGroup} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="Neue Gruppe..."
                      className="festive-input"
                      style={{ flex: 1, minWidth: "160px" }}
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <input
                      type="color"
                      value={newGroupColor}
                      onChange={(e) => setNewGroupColor(e.target.value)}
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-hairline)",
                        cursor: "pointer",
                        background: "var(--bg-surface)",
                        padding: "3px",
                      }}
                      title="Gruppenfarbe wählen"
                    />
                    <button type="submit" className="btn-festive-red" style={{ width: "100%" }}>
                      <Plus size={16} />
                      Gruppe anlegen
                    </button>
                  </form>
                </div>

                {/* Add Members + Bulk Add */}
                <div className="glass-panel" style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <h3
                      className="font-festive"
                      style={{ fontSize: "1.35rem", fontWeight: 600, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <Users size={18} color="var(--accent)" />
                      2. Teilnehmer hinzufügen
                    </h3>

                    <form onSubmit={handleAddMember} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <input
                        type="text"
                        placeholder="Name..."
                        className="festive-input"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                      />
                      <select
                        className="festive-input"
                        value={newMemberSubgroup}
                        onChange={(e) => setNewMemberSubgroup(e.target.value)}
                      >
                        <option value="">-- Gruppe --</option>
                        {subgroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="PIN (leer = auto)"
                        maxLength={4}
                        className="festive-input font-mono-code"
                        value={newMemberPin}
                        onChange={(e) => setNewMemberPin(e.target.value)}
                      />
                      <button type="submit" className="btn-festive-red">
                        <Plus size={16} />
                        Hinzufügen
                      </button>
                    </form>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-hairline)", paddingTop: "18px" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "6px" }}>
                      3. Schneller Mehrfach-Import
                    </h4>
                    <p style={{ color: "var(--ink-muted)", fontSize: "0.82rem", marginBottom: "10px" }}>
                      Namen durch Komma oder Zeilenumbruch trennen.
                    </p>
                    <form onSubmit={handleBulkAdd} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <select
                        className="festive-input"
                        value={bulkSubgroup}
                        onChange={(e) => setBulkSubgroup(e.target.value)}
                      >
                        <option value="">-- Ziel-Gruppe auswählen --</option>
                        {subgroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      <textarea
                        className="festive-input"
                        rows={2}
                        placeholder="Papa Hans, Mama Maria, Lukas..."
                        value={bulkNames}
                        onChange={(e) => setBulkNames(e.target.value)}
                      />
                      <button type="submit" className="btn-festive-outline" style={{ alignSelf: "flex-start" }}>
                        Liste importieren
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Participants Ledger Table */}
              <div className="glass-panel scroll-reveal" style={{ padding: "24px" }}>
                <h3 className="font-festive" style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "16px" }}>
                  Aktuelle Teilnehmer ({totalParticipants})
                </h3>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1.5px solid var(--border-strong)", color: "var(--ink-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        <th style={{ padding: "10px" }}>Name</th>
                        <th style={{ padding: "10px" }}>Gruppe</th>
                        <th style={{ padding: "10px" }}>PIN</th>
                        <th style={{ padding: "10px" }}>Einsicht</th>
                        <th style={{ padding: "10px", textAlign: "right" }}>Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((p) => {
                        const isEditing = editingId === p.id;
                        return (
                          <tr key={p.id} style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                            <td style={{ padding: "11px 10px" }}>
                              {isEditing ? (
                                <input
                                  type="text"
                                  className="festive-input"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  style={{ padding: "6px 10px", fontSize: "0.9rem" }}
                                  autoFocus
                                />
                              ) : (
                                <span style={{ fontWeight: 600, color: "var(--ink-primary)" }}>{p.name}</span>
                              )}
                            </td>
                            <td style={{ padding: "11px 10px" }}>
                              {isEditing ? (
                                <select
                                  className="festive-input"
                                  value={editSubgroupId}
                                  onChange={(e) => setEditSubgroupId(e.target.value)}
                                  style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                                >
                                  {subgroups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="badge">{p.subgroup.name}</span>
                              )}
                            </td>
                            <td style={{ padding: "11px 10px" }}>
                              {isEditing ? (
                                <input
                                  type="text"
                                  maxLength={6}
                                  className="festive-input font-mono-code"
                                  value={editPin}
                                  onChange={(e) => setEditPin(e.target.value)}
                                  style={{ padding: "6px 10px", width: "90px", fontWeight: 700 }}
                                />
                              ) : (
                                <span className="font-mono-code" style={{ fontWeight: 600, color: "var(--ink-primary)" }}>
                                  {p.pin}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "11px 10px" }}>
                              {isEditing ? (
                                <span className="badge badge-gold">Bearbeitung</span>
                              ) : p.hasRevealed ? (
                                <span className="badge badge-green">Eingesehen</span>
                              ) : (
                                <span className="badge">Offen</span>
                              )}
                            </td>
                            <td style={{ padding: "11px 10px", textAlign: "right" }}>
                              {isEditing ? (
                                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                  <button
                                    onClick={() => saveEditing(p.id)}
                                    disabled={savingEdit}
                                    className="btn-festive-red"
                                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                                  >
                                    <Check size={14} /> Speichern
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="btn-festive-outline"
                                    style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                  <button
                                    onClick={() => startEditing(p)}
                                    style={{ background: "transparent", border: "none", color: "var(--ink-secondary)", cursor: "pointer", padding: "4px" }}
                                    title="Name oder PIN bearbeiten"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMember(p.id)}
                                    style={{ background: "transparent", border: "none", color: "var(--status-err-ink)", cursor: "pointer", padding: "4px" }}
                                    title="Löschen"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PINS & WHATSAPP */}
          {activeTab === "pins" && (
            <div className="glass-panel" style={{ padding: "24px" }}>
              <h2 className="font-festive" style={{ fontSize: "1.6rem", fontWeight: 600, marginBottom: "6px" }}>
                PIN-Verteilung per WhatsApp
              </h2>
              <p style={{ color: "var(--ink-secondary)", fontSize: "0.94rem", marginBottom: "22px" }}>
                Kopiere mit einem Klick die fertige Einladungsnachricht für jeden Teilnehmer oder öffne sie direkt in WhatsApp.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
                {participants.map((p) => {
                  const isCopied = copiedId === p.id;
                  const directLink = getDirectLink(p);
                  const waText = getWhatsAppMessage(p);
                  const waHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
                  const isEditingThis = editingId === p.id;

                  return (
                    <div
                      key={p.id}
                      style={{
                        background: "var(--bg-paper)",
                        border: isEditingThis ? "1.5px solid var(--border-strong)" : "1px solid var(--border-hairline)",
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {isEditingThis ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <input
                            type="text"
                            className="festive-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ padding: "8px 10px" }}
                            autoFocus
                          />
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <select
                              className="festive-input"
                              value={editSubgroupId}
                              onChange={(e) => setEditSubgroupId(e.target.value)}
                              style={{ padding: "8px 10px" }}
                            >
                              {subgroups.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              maxLength={6}
                              className="festive-input font-mono-code"
                              value={editPin}
                              onChange={(e) => setEditPin(e.target.value)}
                              style={{ padding: "8px 10px", fontWeight: 700 }}
                            />
                          </div>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => saveEditing(p.id)}
                              disabled={savingEdit}
                              className="btn-festive-red"
                              style={{ padding: "7px 14px", fontSize: "0.82rem" }}
                            >
                              <Check size={14} /> Speichern
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="btn-festive-outline"
                              style={{ padding: "7px 12px", fontSize: "0.82rem" }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--ink-primary)" }}>
                                {p.name}
                              </div>
                              <div style={{ color: "var(--ink-muted)", fontSize: "0.82rem" }}>
                                Gruppe: {p.subgroup.name}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span className="badge font-mono-code" style={{ fontSize: "0.85rem" }}>
                                PIN: {p.pin}
                              </span>
                              <button
                                onClick={() => startEditing(p)}
                                title="Bearbeiten"
                                className="btn-festive-outline"
                                style={{ padding: "5px 7px" }}
                              >
                                <Edit2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div
                            style={{
                              background: "var(--bg-surface)",
                              border: "1px solid var(--border-hairline)",
                              borderRadius: "8px",
                              padding: "7px 10px",
                              fontSize: "0.78rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              color: "var(--ink-secondary)",
                            }}
                          >
                            <span className="font-mono-code" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {directLink}
                            </span>
                            <a
                              href={directLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Link testen"
                              style={{ color: "var(--accent)", marginLeft: "8px", flexShrink: 0 }}
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-festive-outline"
                              style={{
                                fontSize: "0.82rem",
                                padding: "8px 10px",
                                color: "var(--status-ok-ink)",
                                borderColor: "var(--status-ok-border)",
                                background: "var(--status-ok-bg)",
                              }}
                            >
                              <Share2 size={14} /> WhatsApp
                            </a>

                            <button
                              onClick={() => copyWhatsAppMessage(p)}
                              className={isCopied ? "btn-festive-red" : "btn-festive-outline"}
                              style={{ fontSize: "0.82rem", padding: "8px 10px" }}
                            >
                              {isCopied ? (
                                <>
                                  <Check size={14} /> Kopiert!
                                </>
                              ) : (
                                <>
                                  <Copy size={14} /> Text kopieren
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: WICHTEL-MATRIX */}
          {activeTab === "matrix" && (
            <div className="glass-panel" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h2 className="font-festive" style={{ fontSize: "1.6rem", fontWeight: 600 }}>
                    Wichtel-Ergebnismatrix
                  </h2>
                  <p style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>
                    Übersicht aller gezogenen Zuteilungen zur Kontrolle.
                  </p>
                </div>

                <button
                  onClick={() => setShowMatrix(!showMatrix)}
                  className="btn-festive-red"
                  style={{ fontSize: "0.88rem" }}
                >
                  {showMatrix ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showMatrix ? "Ergebnisse verbergen" : "Ergebnisse aufdecken"}
                </button>
              </div>

              {!settings.is_drawn ? (
                <div style={{ padding: "32px 0", color: "var(--ink-muted)" }}>
                  Noch keine Auslosung durchgeführt. Wechsle zur Übersicht, um die Auslosung zu starten.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1.5px solid var(--border-strong)", color: "var(--ink-muted)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        <th style={{ padding: "11px" }}>Wichtel (Schenker)</th>
                        <th style={{ padding: "11px" }}>Gruppe</th>
                        <th style={{ padding: "11px", textAlign: "center" }}>&rarr;</th>
                        <th style={{ padding: "11px" }}>Wichtelkind (Empfänger)</th>
                        <th style={{ padding: "11px" }}>Gruppe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((p) => {
                        const receiver = p.assignedTo;
                        return (
                          <tr key={p.id} style={{ borderBottom: "1px solid var(--border-hairline)" }}>
                            <td style={{ padding: "11px", fontWeight: 700, color: "var(--ink-primary)" }}>{p.name}</td>
                            <td style={{ padding: "11px", color: "var(--ink-secondary)" }}>{p.subgroup.name}</td>
                            <td style={{ padding: "11px", textAlign: "center", color: "var(--accent)" }}>→</td>
                            <td
                              style={{
                                padding: "11px",
                                fontWeight: 700,
                                color: showMatrix ? "var(--status-ok-ink)" : "transparent",
                                filter: showMatrix ? "none" : "blur(6px)",
                                userSelect: showMatrix ? "auto" : "none",
                                transition: "filter 180ms var(--ease-editorial)",
                              }}
                            >
                              {receiver ? receiver.name : "—"}
                            </td>
                            <td
                              style={{
                                padding: "11px",
                                color: showMatrix ? "var(--ink-secondary)" : "transparent",
                                filter: showMatrix ? "none" : "blur(6px)",
                                userSelect: showMatrix ? "auto" : "none",
                                transition: "filter 180ms var(--ease-editorial)",
                              }}
                            >
                              {receiver ? receiver.subgroup.name : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === "settings" && (
            <div className="glass-panel" style={{ padding: "24px", maxWidth: "680px" }}>
              <h2 className="font-festive" style={{ fontSize: "1.6rem", fontWeight: 600, marginBottom: "6px" }}>
                Event-Einstellungen
              </h2>
              <p style={{ color: "var(--ink-secondary)", fontSize: "0.92rem", marginBottom: "22px" }}>
                Diese Angaben werden den Teilnehmern nach Eingabe ihrer PIN angezeigt.
              </p>

              <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                    Budget-Richtwert
                  </label>
                  <input
                    type="text"
                    className="festive-input"
                    placeholder="z.B. ca. 20-30 €"
                    value={settings.budget}
                    onChange={(e) => setSettings({ ...settings, budget: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                    Datum der Bescherung
                  </label>
                  <input
                    type="text"
                    className="festive-input"
                    placeholder="z.B. 24. Dezember 2026 um 18:00 Uhr"
                    value={settings.event_date}
                    onChange={(e) => setSettings({ ...settings, event_date: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-secondary)", marginBottom: "6px" }}>
                    Hinweise &amp; Wichtel-Regeln
                  </label>
                  <textarea
                    className="festive-input"
                    rows={4}
                    value={settings.notes}
                    onChange={(e) => setSettings({ ...settings, notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-festive-red" style={{ alignSelf: "flex-start" }}>
                  Einstellungen speichern
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: COMMUNITIES & INVITES (Superadmin only) */}
          {!communitySlug && activeTab === "communities" && (
            <SuperadminCommunitiesTab
              onNotify={(type, text) => setAlertMessage({ type, text })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
