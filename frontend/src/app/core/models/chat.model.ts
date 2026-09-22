export interface ChatRoom {
  roomId: number;
  partnerId: number;
  partnerName: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  receiverId: number;
  content: string;
}

