export interface ChatRoom {
  roomId: number;
  partnerId: number;
  partnerName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface ChatAttachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  kind: string;
  downloadUrl: string;
  previewUrl?: string;
  expiresAt?: string;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  clientMessageId?: string;
  isDeleted?: boolean;
  attachments?: ChatAttachment[];
}

export interface SendMessageRequest {
  receiverId: number;
  content: string;
  attachmentIds?: string[];
  clientMessageId?: string;
}

