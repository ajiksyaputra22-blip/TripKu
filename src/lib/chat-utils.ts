/**
 * Shared types and utilities for the assignment negotiation chat feature.
 * Extracted here so they can be used in both API routes and client components
 * without exporting non-handler symbols from a Next.js App Router route file.
 */

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "TRAVEL" | "GUIDE" | "DRIVER" | "ADMIN";
  message: string;
  messageType: "text" | "price_offer" | "system";
  proposedFee?: number | null;
  /** Whether Travel side has approved THIS specific price offer */
  approvedByTravel?: boolean;
  /** Whether Worker side has approved THIS specific price offer */
  approvedByWorker?: boolean;
  /** True when a newer offer was made, making this offer superseded */
  superseded?: boolean;
  /** True when both parties approved — deal is finalized */
  isFixedDeal?: boolean;
  createdAt: string;
}

export function parseChatMessages(rawAgreement: string | null, assignment: any): ChatMessage[] {
  if (!rawAgreement) {
    // Initial offer from travel
    return [
      {
        id: "msg-initial",
        senderId: assignment.travel?.userId || "travel-system",
        senderName: assignment.travel?.businessName || "Agensi Travel",
        senderRole: "TRAVEL",
        messageType: "price_offer",
        message: `Tawaran penugasan awal: Rp ${Number(assignment.feeAmount || 500000).toLocaleString("id-ID")}`,
        proposedFee: assignment.feeAmount || 500000,
        approvedByTravel: false,
        approvedByWorker: false,
        superseded: false,
        createdAt: assignment.createdAt ? new Date(assignment.createdAt).toISOString() : new Date().toISOString(),
      },
    ];
  }

  const trimmed = rawAgreement.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as ChatMessage[];
      }
    } catch {
      // fallback to legacy parser below
    }
  }

  // Legacy plain text fallback
  return [
    {
      id: "msg-legacy",
      senderId: assignment.travel?.userId || "travel-system",
      senderName: assignment.travel?.businessName || "Agensi Travel",
      senderRole: "TRAVEL",
      messageType: "price_offer",
      message: trimmed || `Tawaran awal: Rp ${Number(assignment.feeAmount || 500000).toLocaleString("id-ID")}`,
      proposedFee: assignment.feeAmount || 500000,
      approvedByTravel: false,
      approvedByWorker: false,
      superseded: false,
      createdAt: assignment.createdAt ? new Date(assignment.createdAt).toISOString() : new Date().toISOString(),
    },
  ];
}

/** Find the latest non-superseded price offer in a message list */
export function getLatestOffer(messages: ChatMessage[]): ChatMessage | null {
  const offers = messages.filter((m) => m.messageType === "price_offer" && !m.superseded && !m.isFixedDeal);
  return offers.length > 0 ? offers[offers.length - 1] : null;
}
