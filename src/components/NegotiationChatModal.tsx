"use client";

import { useState, useEffect, useRef } from "react";
import { formatRupiah, formatDateTime } from "@/lib/utils";
import {
  X,
  Send,
  Minus,
  DollarSign,
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Car,
  Compass,
} from "lucide-react";
import { ChatMessage, getLatestOffer } from "@/lib/chat-utils";
import { useToast } from "@/components/Toast";

interface NegotiationChatModalProps {
  assignmentId: string;
  isOpen: boolean;
  onClose: () => void;
  onFeeUpdated?: () => void;
  currentUserRole?: "TRAVEL" | "GUIDE" | "DRIVER" | "ADMIN";
}

export default function NegotiationChatModal({
  assignmentId,
  isOpen,
  onClose,
  onFeeUpdated,
  currentUserRole = "TRAVEL",
}: NegotiationChatModalProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Text message input
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // Price offer input
  const [offerPanelOpen, setOfferPanelOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerNote, setOfferNote] = useState("");

  // Approve state
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChat = async (isBackground = false) => {
    if (!assignmentId) return;
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/chat`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setAssignment(data.assignment);
        const latestFee =
          data.assignment?.negotiatedAmount || data.assignment?.feeAmount || 500000;
        if (!offerAmount) setOfferAmount(String(latestFee));
      }
    } catch (err) {
      console.error("Fetch chat error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Poll every 3 seconds when open and not minimized
  useEffect(() => {
    if (!isOpen || !assignmentId) return;
    fetchChat();
    const interval = setInterval(() => fetchChat(true), 3000);
    return () => clearInterval(interval);
  }, [isOpen, assignmentId]);

  useEffect(() => {
    if (messages.length > 0 && !minimized) scrollToBottom();
  }, [messages.length, minimized]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !offerPanelOpen) return;
    if (offerPanelOpen && (!offerAmount || isNaN(Number(offerAmount)) || Number(offerAmount) <= 0)) {
      toast.warning("Masukkan nominal fee yang valid.");
      return;
    }

    setSending(true);
    try {
      const payload: any = { message: inputText.trim() || undefined };
      if (offerPanelOpen && offerAmount) {
        payload.proposedFee = parseFloat(offerAmount);
        if (offerNote.trim()) payload.message = offerNote.trim();
      }

      const res = await fetch(`/api/assignments/${assignmentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setInputText("");
        setOfferNote("");
        setOfferPanelOpen(false);
        onFeeUpdated?.();
        setTimeout(scrollToBottom, 50);
        if (offerPanelOpen && offerAmount) {
          toast.success("Tawaran fee berhasil diajukan!");
        }
      } else {
        toast.error(data.error || "Gagal mengirim pesan.");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setSending(false);
    }
  };

  const handleApproveOffer = async (offerId: string) => {
    setApprovingId(offerId);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/chat`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setAssignment((prev: any) => ({ ...prev, status: data.status }));
        onFeeUpdated?.();
        setTimeout(scrollToBottom, 50);
        toast.success("Kesepakatan fee berhasil disetujui!");
      } else {
        toast.error(data.error || "Gagal menyetujui tawaran.");
      }
    } catch {
      toast.error("Terjadi kesalahan koneksi.");
    } finally {
      setApprovingId(null);
    }
  };

  if (!isOpen) return null;

  const isAccepted = assignment?.status === "ACCEPTED";
  const isNegotiating = assignment?.status === "NEGOTIATING";
  const crewRole = assignment?.role;
  const crewIcon = crewRole === "GUIDE" ? <Compass className="w-3 h-3" /> : <Car className="w-3 h-3" />;
  const crewEmoji = crewRole === "GUIDE" ? "🧭" : "🚗";

  const latestOffer = getLatestOffer(messages);

  const isMe = (msg: ChatMessage) => {
    if (currentUserRole === "TRAVEL" || currentUserRole === "ADMIN") {
      return msg.senderRole === "TRAVEL" || msg.senderRole === "ADMIN";
    }
    return msg.senderRole === currentUserRole;
  };

  // Can I approve this offer? Only the OTHER party can approve
  const canApprove = (msg: ChatMessage) => {
    if (isAccepted || msg.superseded || msg.isFixedDeal) return false;
    if (msg.messageType !== "price_offer") return false;
    const iAmTravel = currentUserRole === "TRAVEL" || currentUserRole === "ADMIN";
    const proposedByTravel = msg.senderRole === "TRAVEL" || msg.senderRole === "ADMIN";
    // Counter-party approves
    if (iAmTravel) {
      return !proposedByTravel && !msg.approvedByTravel;
    } else {
      return proposedByTravel && !msg.approvedByWorker;
    }
  };

  const myApprovalKey = (currentUserRole === "TRAVEL" || currentUserRole === "ADMIN")
    ? "approvedByTravel"
    : "approvedByWorker";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      {/* Backdrop — only clickable to close when not minimized */}
      <div
        className="absolute inset-0 pointer-events-auto"
        onClick={onClose}
      />

      {/* Chat Widget — Messenger-style popup, bottom-right */}
      <div
        className={`relative pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
          minimized ? "h-14" : "h-[520px] max-h-[90vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ───── HEADER ───── */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-900 text-white shrink-0 cursor-pointer select-none"
          onClick={() => setMinimized(!minimized)}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center text-lg shrink-0">
            {crewEmoji}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-white truncate">
                {assignment?.worker?.name || "Kru"}
              </span>
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-700 text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                {crewIcon}
                <span>{crewRole}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate leading-none mt-0.5">
              {assignment?.trip?.package?.name || "Paket Wisata"}
            </p>
          </div>

          {/* Status badge */}
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${
            isAccepted
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : isNegotiating
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "bg-slate-700 text-slate-400"
          }`}>
            {isAccepted ? "✓ Fix" : isNegotiating ? "Negosiasi" : "Menunggu"}
          </span>

          {/* Controls */}
          <div className="flex items-center gap-0.5 ml-1">
            {refreshing && <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />}
            <button
              onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
              className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={minimized ? "Buka chat" : "Minimize"}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ───── BODY (hidden when minimized) ───── */}
        {!minimized && (
          <>
            {/* Message stream */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-slate-50/60">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600" />
                </div>
              ) : messages.length === 0 ? (
                /* Empty state — Messenger style */
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                    {crewEmoji}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{assignment?.worker?.name || "Kru"}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{assignment?.trip?.package?.name}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
                    Percakapan ini khusus untuk negosiasi fee penugasan. Harga belum fix sebelum kedua pihak menyetujui.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = isMe(msg);

                  /* ── System / Deal Final Card ── */
                  if (msg.isFixedDeal && msg.messageType === "system") {
                    return (
                      <div key={msg.id} className="my-1">
                        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-3 text-white text-center space-y-1 shadow-md">
                          <div className="flex items-center justify-center gap-1.5 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Harga Fix Disepakati</span>
                          </div>
                          <div className="text-lg font-black text-white">
                            {formatRupiah(msg.proposedFee || 0)}
                          </div>
                          <p className="text-[10px] text-emerald-100">{msg.message}</p>
                          <p className="text-[9px] text-emerald-200/70">{formatDateTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    );
                  }

                  /* ── Price Offer Bubble ── */
                  if (msg.messageType === "price_offer") {
                    const approved = msg.approvedByTravel && msg.approvedByWorker;
                    const myApproved = msg[myApprovalKey as keyof ChatMessage] as boolean;
                    const canIApprove = canApprove(msg);

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                        <span className="text-[9px] text-slate-400 mb-1 px-1">
                          {msg.senderName} • {formatDateTime(msg.createdAt)}
                        </span>

                        <div className={`w-full max-w-[88%] rounded-xl overflow-hidden border shadow-xs ${
                          msg.superseded
                            ? "opacity-40 border-slate-200"
                            : approved || msg.isFixedDeal
                            ? "border-emerald-400"
                            : isMine
                            ? "border-emerald-400/60"
                            : "border-amber-300"
                        }`}>
                          {/* Offer Card Header */}
                          <div className={`px-3 py-2 flex items-center justify-between ${
                            isMine ? "bg-emerald-600" : "bg-amber-50"
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className={`w-3.5 h-3.5 ${isMine ? "text-emerald-200" : "text-amber-600"}`} />
                              <span className={`text-[10px] font-bold ${isMine ? "text-emerald-100" : "text-amber-900"}`}>
                                {msg.superseded ? "Penawaran Lama" : "💰 Pengajuan Harga"}
                              </span>
                            </div>
                            {msg.superseded && (
                              <span className="text-[9px] text-slate-400 font-medium">Tergantikan</span>
                            )}
                          </div>

                          {/* Fee Amount */}
                          <div className={`px-3 pt-2 pb-1 ${isMine ? "bg-emerald-600" : "bg-white"}`}>
                            <div className={`text-xl font-black leading-none ${isMine ? "text-white" : "text-slate-900"}`}>
                              {formatRupiah(msg.proposedFee || 0)}
                            </div>
                            {msg.message && (
                              <p className={`text-[10px] mt-1 ${isMine ? "text-emerald-100" : "text-slate-500"}`}>
                                {msg.message}
                              </p>
                            )}
                          </div>

                          {/* Approval Status (non-superseded, non-fixed) */}
                          {!msg.superseded && !msg.isFixedDeal && (
                            <div className={`px-3 pb-2 pt-1.5 space-y-1.5 ${isMine ? "bg-emerald-700" : "bg-white"}`}>
                              {/* Approval indicators */}
                              <div className="flex items-center gap-2 text-[9px]">
                                <span className={`flex items-center gap-1 ${msg.approvedByTravel ? "text-emerald-400" : isMine ? "text-emerald-200/50" : "text-slate-400"}`}>
                                  {msg.approvedByTravel ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  Travel
                                </span>
                                <span className={isMine ? "text-emerald-300/40" : "text-slate-300"}>•</span>
                                <span className={`flex items-center gap-1 ${msg.approvedByWorker ? "text-emerald-400" : isMine ? "text-emerald-200/50" : "text-slate-400"}`}>
                                  {msg.approvedByWorker ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  Kru
                                </span>
                              </div>

                              {/* Action buttons — only for the other party */}
                              {!msg.superseded && (
                                <div className="flex gap-1.5 pt-0.5">
                                  {canIApprove && (
                                    <button
                                      onClick={() => handleApproveOffer(msg.id)}
                                      disabled={!!approvingId}
                                      className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-60 cursor-pointer"
                                    >
                                      {approvingId === msg.id ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3" />
                                      )}
                                      <span>Setuju ✓</span>
                                    </button>
                                  )}
                                  {canIApprove && !isAccepted && (
                                    <button
                                      onClick={() => {
                                        setOfferAmount(String(msg.proposedFee || ""));
                                        setOfferPanelOpen(true);
                                      }}
                                      className="flex-1 py-1.5 px-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <ChevronRight className="w-3 h-3" />
                                      <span>Tawar Balik</span>
                                    </button>
                                  )}
                                  {/* If I'm the proposer and awaiting counter-party */}
                                  {!canIApprove && !myApproved && !isAccepted && (
                                    <div className="flex items-center gap-1 text-[9px] text-emerald-200/70 italic">
                                      <Clock className="w-3 h-3" />
                                      <span>Menunggu persetujuan lawan bicara…</span>
                                    </div>
                                  )}
                                  {!canIApprove && myApproved && !isAccepted && (
                                    <div className="flex items-center gap-1 text-[9px] text-emerald-300 font-semibold">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Anda sudah setuju — menunggu konfirmasi…</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  /* ── Regular Text Bubble ── */
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      <span className="text-[9px] text-slate-400 mb-1 px-1">
                        {msg.senderName} • {formatDateTime(msg.createdAt)}
                      </span>
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-xs ${
                        isMine
                          ? "bg-emerald-600 text-white rounded-br-xs"
                          : "bg-white text-slate-900 border border-slate-200 rounded-bl-xs"
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ───── OFFER PANEL ───── */}
            {offerPanelOpen && !isAccepted && (
              <div className="px-3 py-2.5 bg-amber-50 border-t border-amber-200 space-y-2 shrink-0 animate-in slide-in-from-bottom duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Ajukan Harga Baru (Rp)
                  </span>
                  <button onClick={() => setOfferPanelOpen(false)} className="text-[9px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer">
                    Batal
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="10000"
                    step="50000"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Nominal fee..."
                    className="flex-1 py-1.5 px-2.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <input
                  type="text"
                  value={offerNote}
                  onChange={(e) => setOfferNote(e.target.value)}
                  placeholder="Catatan (opsional)..."
                  className="w-full py-1.5 px-2.5 bg-white border border-amber-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-300"
                />
                {/* Preset chips */}
                <div className="flex gap-1.5 flex-wrap">
                  {[300000, 500000, 700000, 1000000].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOfferAmount(String(p))}
                      className="px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-[9px] font-bold cursor-pointer transition-colors"
                    >
                      {formatRupiah(p)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ───── COMPOSER FOOTER ───── */}
            {isAccepted ? (
              /* Chat locked after deal */
              <div className="px-3 py-2.5 bg-emerald-50 border-t border-emerald-200 flex items-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-[10px] text-emerald-800 font-semibold">
                  Harga fix telah disepakati. Chat negosiasi ditutup.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="px-2.5 py-2 bg-white border-t border-slate-200 flex items-center gap-1.5 shrink-0"
              >
                {/* Offer fee button */}
                <button
                  type="button"
                  onClick={() => setOfferPanelOpen(!offerPanelOpen)}
                  title="Ajukan Harga"
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    offerPanelOpen
                      ? "bg-amber-500 text-white"
                      : "text-amber-600 hover:bg-amber-50"
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={offerPanelOpen ? "Tambah catatan..." : "Tulis pesan..."}
                  className="flex-1 py-2 px-3 bg-slate-100 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />

                {/* Send */}
                <button
                  type="submit"
                  disabled={sending || (!inputText.trim() && !offerPanelOpen)}
                  className="p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                >
                  {sending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
