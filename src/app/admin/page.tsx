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
  DollarSign,
  Share2,
  Lock,
} from "lucide-react";

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

export default function AdminPage() {
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "members" | "pins" | "matrix" | "settings"
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

  // Modals & Form States
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#10b981");

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberSubgroup, setNewMemberSubgroup] = useState("");
  const [newMemberPin, setNewMemberPin] = useState("");

  const [bulkSubgroup, setBulkSubgroup] = useState("");
  const [bulkNames, setBulkNames] = useState("");

  // Privacy mask for matrix
  const [showMatrix, setShowMatrix] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const authRes = await fetch("/api/admin/auth");
      const authData = await authRes.json();
      if (!authData.authenticated) {
        router.push("/admin/login");
        return;
      }
      await loadAllData();
    } catch (err) {
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      const [subsRes, partsRes, setRes] = await Promise.all([
        fetch("/api/admin/subgroups"),
        fetch("/api/admin/participants"),
        fetch("/api/admin/settings"),
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
    router.push("/admin/login");
  };

  // Group Handlers
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch("/api/admin/subgroups", {
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
    } catch (err) {
      setAlertMessage({ type: "error", text: "Fehler beim Hinzufügen der Gruppe." });
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Gruppe wirklich löschen? Alle zugehörigen Teilnehmer werden ebenfalls gelöscht.")) return;

    try {
      const res = await fetch(`/api/admin/subgroups?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAlertMessage({ type: "success", text: "Gruppe gelöscht." });
        await loadAllData();
      }
    } catch (err) {
      setAlertMessage({ type: "error", text: "Fehler beim Löschen." });
    }
  };

  // Member Handlers
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberSubgroup) return;

    try {
      const res = await fetch("/api/admin/participants", {
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
    } catch (err) {
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

      const res = await fetch("/api/admin/participants", {
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
    } catch (err) {
      setAlertMessage({ type: "error", text: "Fehler beim Bulk-Import." });
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Teilnehmer wirklich entfernen?")) return;
    try {
      const res = await fetch(`/api/admin/participants?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setAlertMessage({ type: "success", text: "Teilnehmer gelöscht." });
        await loadAllData();
      }
    } catch (err) {
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
      const res = await fetch("/api/admin/draw", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setAlertMessage({
          type: "success",
          text: `🎉 Auslosung erfolgreich für ${data.count} Teilnehmer durchgeführt! Alle Einschränkungen (keine eigene Gruppe, keine 2er-Gegenseitigkeit) erfüllt.`,
        });
        await loadAllData();
      } else {
        setAlertMessage({ type: "error", text: data.error });
      }
    } catch (err) {
      setAlertMessage({ type: "error", text: "Fehler beim Ausführen der Auslosung." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDraw = async () => {
    if (!confirm("Möchtest du die Auslosung wirklich zurücksetzen?")) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/draw", { method: "DELETE" });
      if (res.ok) {
        setAlertMessage({ type: "success", text: "Auslosung zurückgesetzt." });
        await loadAllData();
      }
    } catch (err) {
      setAlertMessage({ type: "error", text: "Fehler beim Zurücksetzen." });
    } finally {
      setActionLoading(false);
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setAlertMessage({ type: "success", text: "Einstellungen gespeichert." });
      }
    } catch (err) {
      setAlertMessage({ type: "error", text: "Fehler beim Speichern." });
    }
  };

  // WhatsApp Message Generator
  const copyWhatsAppMessage = (p: Participant) => {
    const text = `Hallo ${p.name}! 🎄 Dein persönlicher Wichtel-PIN für dieses Jahr lautet: *${p.pin}*. Schau unter https://wichteln.felixresch.com nach, wen du beschenkst! 🎁`;
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--accent-gold)",
          fontSize: "1.1rem",
        }}
      >
        <Sparkles className="float-animation" /> &nbsp; Admin-Bereich wird geladen...
      </div>
    );
  }

  // Calculate stats
  const totalParticipants = participants.length;
  const revealedCount = participants.filter((p) => p.hasRevealed).length;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "30px 20px" }}>
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            className="font-festive"
            style={{ fontSize: "2.4rem", color: "#fff", display: "flex", alignItems: "center", gap: "12px" }}
          >
            🎅 Wichtel-Zentrale
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Verwalte Familienzweige, Teilnehmer und überwache die Auslosung.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <a href="/" target="_blank" className="btn-festive-outline" style={{ fontSize: "0.85rem" }}>
            Zur Teilnehmer-Seite ↗
          </a>
          <button onClick={handleLogout} className="btn-festive-outline" style={{ fontSize: "0.85rem", color: "#fb7185" }}>
            <LogOut size={16} />
            Abmelden
          </button>
        </div>
      </header>

      {/* Global Alert Notification */}
      {alertMessage && (
        <div
          style={{
            background:
              alertMessage.type === "success"
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(225, 29, 72, 0.15)",
            border: `1px solid ${
              alertMessage.type === "success" ? "#10b981" : "#e11d48"
            }`,
            color: alertMessage.type === "success" ? "#34d399" : "#fda4af",
            borderRadius: "14px",
            padding: "14px 18px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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

      {/* Navigation Tabs */}
      <nav
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "28px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {[
          { id: "overview", label: "Übersicht & Auslosung", icon: Sparkles },
          { id: "members", label: "Gruppen & Teilnehmer", icon: Users },
          { id: "pins", label: "PINs & WhatsApp", icon: Lock },
          { id: "matrix", label: "Wichtel-Matrix", icon: Gift },
          { id: "settings", label: "Einstellungen", icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "12px",
                fontSize: "0.95rem",
                fontWeight: active ? "700" : "500",
                color: active ? "#ffffff" : "var(--text-muted)",
                background: active ? "rgba(251, 191, 36, 0.15)" : "rgba(255, 255, 255, 0.03)",
                border: active
                  ? "1px solid rgba(251, 191, 36, 0.4)"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={17} color={active ? "#fbbf24" : "currentColor"} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: OVERVIEW & DRAW */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Quick Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px" }}>
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px" }}>
                Teilnehmer Gesamt
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: "#fff" }}>
                {totalParticipants}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px" }}>
                Familien-Untergruppen
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: "#fbbf24" }}>
                {subgroups.length}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px" }}>
                Status der Auslosung
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: "700", marginTop: "6px" }}>
                {settings.is_drawn ? (
                  <span className="badge badge-green">Fertig ausgelost</span>
                ) : (
                  <span className="badge badge-gold">Noch nicht ausgelost</span>
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px" }}>
                Los bereits aufgedeckt
              </div>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: "#34d399" }}>
                {revealedCount} / {totalParticipants}
              </div>
            </div>
          </div>

          {/* Draw Execution Panel */}
          <div className="glass-panel" style={{ padding: "32px", textAlign: "center" }}>
            <h2 className="font-festive" style={{ fontSize: "1.8rem", color: "#fff", marginBottom: "12px" }}>
              {settings.is_drawn ? "Auslosung ist aktiv! 🎁" : "Bereit für die Bescherung? 🎄"}
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto 28px", fontSize: "0.95rem" }}>
              Der Matching-Algorithmus stellt sicher, dass niemand ein Familienmitglied aus der eigenen
              Untergruppe zieht und schließt direkte 2er-Gegenseitigkeiten ($A \to B \to A$) vollständig aus.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleTriggerDraw}
                disabled={actionLoading || totalParticipants < 3}
                className="btn-festive-red"
                style={{ padding: "14px 28px", fontSize: "1.05rem" }}
              >
                <Sparkles size={20} />
                {settings.is_drawn ? "Neu auslosen" : "Wichteln jetzt auslosen!"}
              </button>

              {settings.is_drawn && (
                <button
                  type="button"
                  onClick={handleResetDraw}
                  disabled={actionLoading}
                  className="btn-festive-outline"
                  style={{ padding: "14px 24px" }}
                >
                  <RefreshCw size={18} />
                  Auslosung zurücksetzen
                </button>
              )}
            </div>

            {settings.drawn_at && (
              <div style={{ marginTop: "18px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Letzte Auslosung: {new Date(settings.drawn_at).toLocaleString("de-DE")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GROUPS & MEMBERS */}
      {activeTab === "members" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Subgroups Section */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.3rem", color: "#fff", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FolderTree size={20} color="#fbbf24" />
              1. Familien-Untergruppen (Haushalte / Zweige)
            </h3>

            {/* Subgroups List */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
              {subgroups.map((g) => (
                <div
                  key={g.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${g.color || "rgba(255, 255, 255, 0.15)"}`,
                    borderRadius: "12px",
                    padding: "8px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: g.color || "#10b981",
                    }}
                  />
                  <span style={{ fontWeight: "600", color: "#fff" }}>{g.name}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    ({participants.filter((p) => p.subgroupId === g.id).length} Pers.)
                  </span>
                  <button
                    onClick={() => handleDeleteGroup(g.id)}
                    title="Gruppe löschen"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#fb7185",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Create Subgroup Form */}
            <form onSubmit={handleAddGroup} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Neue Gruppe (z.B. Familie Müller, Oma & Opa)..."
                className="festive-input"
                style={{ flex: 1, minWidth: "220px" }}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <input
                type="color"
                value={newGroupColor}
                onChange={(e) => setNewGroupColor(e.target.value)}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                }}
                title="Gruppenfarbe wählen"
              />
              <button type="submit" className="btn-festive-gold">
                <Plus size={18} />
                Gruppe anlegen
              </button>
            </form>
          </div>

          {/* Add Members Section */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.3rem", color: "#fff", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={20} color="#fbbf24" />
              2. Einzelne Teilnehmer hinzufügen
            </h3>

            <form onSubmit={handleAddMember} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <input
                type="text"
                placeholder="Vor- und Nachname..."
                className="festive-input"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />

              <select
                className="festive-input"
                value={newMemberSubgroup}
                onChange={(e) => setNewMemberSubgroup(e.target.value)}
              >
                <option value="">-- Gruppe auswählen --</option>
                {subgroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="PIN (leer = automatisch 4-stellig)"
                maxLength={4}
                className="festive-input"
                value={newMemberPin}
                onChange={(e) => setNewMemberPin(e.target.value)}
              />

              <button type="submit" className="btn-festive-red">
                <Plus size={18} />
                Hinzufügen
              </button>
            </form>
          </div>

          {/* Quick Bulk-Add Helper */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.3rem", color: "#fff", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Share2 size={20} color="#34d399" />
              3. Schneller Mehrfach-Import (Bulk-Add)
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
              Füge eine ganze Familie auf einmal hinzu (Namen durch Komma oder Zeilenumbruch getrennt).
            </p>

            <form onSubmit={handleBulkAdd}>
              <div style={{ marginBottom: "12px" }}>
                <select
                  className="festive-input"
                  value={bulkSubgroup}
                  onChange={(e) => setBulkSubgroup(e.target.value)}
                >
                  <option value="">-- Ziel-Gruppe für diese Liste auswählen --</option>
                  {subgroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                className="festive-input"
                rows={3}
                placeholder="Papa Hans&#10;Mama Maria&#10;Lukas&#10;Sophie"
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                style={{ marginBottom: "12px", resize: "vertical" }}
              />

              <button type="submit" className="btn-festive-outline">
                Liste importieren
              </button>
            </form>
          </div>

          {/* Participants Table */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.3rem", color: "#fff", marginBottom: "16px" }}>
              Aktuelle Teilnehmer ({totalParticipants})
            </h3>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    <th style={{ padding: "10px" }}>Name</th>
                    <th style={{ padding: "10px" }}>Gruppe</th>
                    <th style={{ padding: "10px" }}>PIN</th>
                    <th style={{ padding: "10px" }}>Einsicht</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "12px 10px", fontWeight: "600", color: "#fff" }}>{p.name}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: p.subgroup.color ? `${p.subgroup.color}20` : "rgba(16, 185, 129, 0.15)",
                            color: p.subgroup.color || "#34d399",
                            border: `1px solid ${p.subgroup.color || "#10b981"}`,
                          }}
                        >
                          {p.subgroup.name}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", fontFamily: "monospace", fontSize: "1.05rem", color: "#fbbf24" }}>
                        {p.pin}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        {p.hasRevealed ? (
                          <span className="badge badge-green">Eingesehen</span>
                        ) : (
                          <span className="badge" style={{ color: "var(--text-muted)" }}>Noch offen</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 10px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteMember(p.id)}
                          style={{ background: "transparent", border: "none", color: "#fb7185", cursor: "pointer" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PINS & WHATSAPP DISTRIBUTION */}
      {activeTab === "pins" && (
        <div className="glass-panel" style={{ padding: "28px" }}>
          <h2 className="font-festive" style={{ fontSize: "1.8rem", color: "#fff", marginBottom: "8px" }}>
            🔑 PIN-Verteilung per WhatsApp
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>
            Kopiere mit einem Klick die fertige Einladungsnachricht für jeden Teilnehmer und sende sie bequem
            per WhatsApp oder Familien-Chat.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {participants.map((p) => {
              const isCopied = copiedId === p.id;
              return (
                <div
                  key={p.id}
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "14px",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "700", color: "#fff", fontSize: "1.05rem" }}>{p.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "2px" }}>
                      Gruppe: {p.subgroup.name} &bull; PIN: <strong style={{ color: "#fbbf24" }}>{p.pin}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => copyWhatsAppMessage(p)}
                    className={isCopied ? "btn-festive-gold" : "btn-festive-outline"}
                    style={{ fontSize: "0.85rem", padding: "8px 14px" }}
                  >
                    {isCopied ? (
                      <>
                        <Check size={15} /> Kopiert!
                      </>
                    ) : (
                      <>
                        <Copy size={15} /> WhatsApp-Text
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: WICHTEL-MATRIX */}
      {activeTab === "matrix" && (
        <div className="glass-panel" style={{ padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 className="font-festive" style={{ fontSize: "1.8rem", color: "#fff" }}>
                📜 Wichtel-Ergebnismatrix
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Übersicht aller gezogenen Zuteilungen zur Kontrolle.
              </p>
            </div>

            <button
              onClick={() => setShowMatrix(!showMatrix)}
              className="btn-festive-gold"
              style={{ fontSize: "0.9rem" }}
            >
              {showMatrix ? <EyeOff size={16} /> : <Eye size={16} />}
              {showMatrix ? "Ergebnisse verbergen (Spoiler-Schutz)" : "Ergebnisse aufdecken"}
            </button>
          </div>

          {!settings.is_drawn ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              Noch keine Auslosung durchgeführt. Wechsle zum Tab "Übersicht", um die Auslosung zu starten!
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    <th style={{ padding: "12px" }}>Wichtel (Schenker)</th>
                    <th style={{ padding: "12px" }}>Gruppe</th>
                    <th style={{ padding: "12px", textAlign: "center" }}>&rarr;</th>
                    <th style={{ padding: "12px" }}>Wichtelkind (Empfänger)</th>
                    <th style={{ padding: "12px" }}>Gruppe</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => {
                    const receiver = p.assignedTo;
                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "12px", fontWeight: "700", color: "#fff" }}>{p.name}</td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{p.subgroup.name}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "#fbbf24" }}>🎁</td>
                        <td
                          style={{
                            padding: "12px",
                            fontWeight: "700",
                            color: showMatrix ? "#34d399" : "transparent",
                            filter: showMatrix ? "none" : "blur(6px)",
                            userSelect: showMatrix ? "auto" : "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {receiver ? receiver.name : "—"}
                        </td>
                        <td
                          style={{
                            padding: "12px",
                            color: showMatrix ? "var(--text-secondary)" : "transparent",
                            filter: showMatrix ? "none" : "blur(6px)",
                            userSelect: showMatrix ? "auto" : "none",
                            transition: "all 0.2s ease",
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
        <div className="glass-panel" style={{ padding: "28px" }}>
          <h2 className="font-festive" style={{ fontSize: "1.8rem", color: "#fff", marginBottom: "8px" }}>
            ⚙️ Event-Einstellungen
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "24px" }}>
            Diese Angaben werden den Teilnehmern nach Eingabe ihrer PIN auf der Enthüllungsseite angezeigt.
          </p>

          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "8px" }}>
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
              <label style={{ display: "block", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "8px" }}>
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
              <label style={{ display: "block", color: "var(--text-secondary)", fontWeight: "600", marginBottom: "8px" }}>
                Hinweise & Wichtel-Regeln
              </label>
              <textarea
                className="festive-input"
                rows={4}
                value={settings.notes}
                onChange={(e) => setSettings({ ...settings, notes: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-festive-gold" style={{ alignSelf: "flex-start", padding: "12px 28px" }}>
              Einstellungen speichern
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
