import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/auth/auth.service';
import { AdminService, AdminResponse } from '../../core/services/admin.service';
import { ChatRoom, ChatMessage } from '../../core/models/chat.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-6rem)] max-h-[800px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex relative">

      <!-- Lệ trái: Danh sách phòng Chat -->
      <div class="w-1/3 md:w-1/4 border-r border-gray-200 dark:border-slate-700 flex flex-col bg-gray-50 dark:bg-slate-900/50">
        <div class="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            Tin nhắn
            <div class="h-2.5 w-2.5 rounded-full" [ngClass]="chatService.isConnected() ? 'bg-green-500' : 'bg-red-500'" title="Trạng thái kết nối SignalR"></div>
          </h2>
          <button (click)="openNewChatModal()" class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors" title="Trò chuyện mới">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div *ngIf="isLoadingRooms()" class="p-4 text-center text-sm text-gray-500">Đang tải...</div>

          <div *ngFor="let room of rooms()"
               (click)="selectRoom(room)"
               class="p-4 border-b border-gray-100 dark:border-slate-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
               [ngClass]="{'bg-blue-50 dark:bg-slate-800 border-l-4 border-l-blue-500': selectedRoom()?.partnerId === room.partnerId}">
            <div class="flex justify-between items-start mb-1">
              <span class="font-semibold text-gray-900 dark:text-slate-100 truncate pr-2">{{ room.partnerName }}</span>
              <span class="text-xs text-gray-500 whitespace-nowrap">{{ room.lastMessageTime ? (room.lastMessageTime + 'Z' | date:'HH:mm') : '' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-500 dark:text-slate-400 truncate w-4/5">{{ room.lastMessage || 'Chưa có tin nhắn' }}</span>
              <span *ngIf="room.unreadCount > 0" class="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {{ room.unreadCount }}
              </span>
            </div>
          </div>

          <div *ngIf="rooms().length === 0 && !isLoadingRooms()" class="p-8 text-center text-gray-500 dark:text-slate-400 text-sm">
            Chưa có đoạn hội thoại nào.
          </div>
        </div>
      </div>

      <!-- Lệ phải: Khung Chat Chi Tiết -->
      <div class="w-2/3 md:w-3/4 flex flex-col bg-white dark:bg-slate-800 relative">
        <ng-container *ngIf="selectedRoom(); else noRoomSelected">

          <!-- Chat Header -->
          <div class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 z-10">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-lg">
                {{ selectedRoom()?.partnerName?.charAt(0) | uppercase }}
              </div>
              <h3 class="font-bold text-gray-800 dark:text-slate-100">{{ selectedRoom()?.partnerName }}</h3>
            </div>
          </div>

          <!-- Chat Messages Area -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900/30" #scrollMe>
            <div *ngIf="isLoadingMessages()" class="text-center text-sm text-gray-500 my-4">Đang tải tin nhắn...</div>

            <div *ngFor="let msg of messages()" class="flex flex-col"
                 [ngClass]="msg.senderId === currentUserId ? 'items-end' : 'items-start'">
              <div class="max-w-[70%] rounded-2xl px-4 py-2"
                   [ngClass]="msg.senderId === currentUserId
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-600 shadow-sm rounded-bl-none'">
                <p class="text-sm whitespace-pre-wrap break-words">{{ msg.content }}</p>
              </div>
              <span class="text-[10px] text-gray-400 mt-1 mx-1">{{ msg.createdAt + 'Z' | date:'HH:mm dd/MM/yyyy' }}</span>
            </div>
            <div *ngIf="messages().length === 0 && !isLoadingMessages()" class="text-center text-sm text-gray-500 my-8">
              Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện.
            </div>
          </div>

          <!-- Chat Input Area -->
          <div class="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <form (ngSubmit)="sendMessage()" class="flex gap-2">
              <input type="text" [(ngModel)]="newMessage" name="message"
                     class="flex-1 bg-gray-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-full px-4 py-2.5 text-sm dark:text-slate-100 transition-all outline-none"
                     placeholder="Nhập tin nhắn..." autocomplete="off">
              <button type="submit" [disabled]="!newMessage.trim() || isSending()"
                      class="bg-blue-600 hover:bg-blue-700 text-white h-10 w-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>

        </ng-container>

        <ng-template #noRoomSelected>
          <div class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-900/30">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p class="text-lg font-medium">Chọn một hội thoại để bắt đầu</p>
          </div>
        </ng-template>
      </div>

      <!-- New Chat Modal Overlay -->
      <div *ngIf="showNewChatModal()" class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80%]">
          <div class="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
            <h3 class="font-bold text-lg text-gray-900 dark:text-white">Bắt đầu trò chuyện mới</h3>
            <button (click)="showNewChatModal.set(false)" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            <div *ngIf="isLoadingAdmins()" class="text-center p-4 text-sm text-gray-500">Đang tải danh sách...</div>
            <div *ngFor="let admin of adminList()"
                 (click)="startNewChat(admin)"
                 class="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer flex items-center gap-3 rounded-lg mx-2 my-1">
              <div class="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {{ admin.fullName.charAt(0) | uppercase }}
              </div>
              <div>
                <div class="font-semibold text-gray-900 dark:text-slate-100">{{ admin.fullName }}</div>
                <div class="text-xs text-gray-500">{{ admin.username }}</div>
              </div>
            </div>
            <div *ngIf="adminList().length === 0 && !isLoadingAdmins()" class="text-center p-4 text-sm text-gray-500">
              Không tìm thấy admin nào khác.
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  chatService = inject(ChatService);
  authService = inject(AuthService);
  adminService = inject(AdminService);

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  rooms = signal<ChatRoom[]>([]);
  selectedRoom = signal<ChatRoom | null>(null);
  messages = signal<ChatMessage[]>([]);

  isLoadingRooms = signal(false);
  isLoadingMessages = signal(false);
  isSending = signal(false);

  newMessage = '';
  currentUserId = 0;

  // New chat modal state
  showNewChatModal = signal(false);
  adminList = signal<AdminResponse[]>([]);
  isLoadingAdmins = signal(false);

  private msgSub!: Subscription;

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
    }

    if (!this.chatService.isConnected()) {
      this.chatService.startConnection();
    }

    this.loadRooms();

    this.msgSub = this.chatService.messageReceived$.subscribe((msg: ChatMessage) => {
      if (this.selectedRoom() && (this.selectedRoom()?.roomId === msg.roomId || this.selectedRoom()?.partnerId === msg.senderId)) {
        this.messages.update(msgs => [...msgs, msg]);
        this.scrollToBottom();

        if (msg.roomId && msg.roomId > 0) {
          this.chatService.markAsRead(msg.roomId).subscribe();
        }
      }
      this.loadRooms();
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    if (this.msgSub) {
      this.msgSub.unsubscribe();
    }
  }

  loadRooms() {
    this.isLoadingRooms.set(true);
    this.chatService.getRooms().subscribe({
      next: (data) => {
        const sorted = data.sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        // Preserve a newly created "fake" room if it hasn't been saved to DB yet
        const currentSelected = this.selectedRoom();
        if (currentSelected && currentSelected.roomId === 0) {
           const exists = sorted.find(r => r.partnerId === currentSelected.partnerId);
           if (!exists) {
             sorted.unshift(currentSelected); // keep the unsaved room at top
           } else {
             // It was just saved, update selected room to use real ID
             this.selectedRoom.set(exists);
           }
        }

        this.rooms.set(sorted);
        this.isLoadingRooms.set(false);
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách phòng', err);
        this.isLoadingRooms.set(false);
      }
    });
  }

  selectRoom(room: ChatRoom) {
    this.selectedRoom.set(room);
    if (room.roomId > 0) {
      this.loadMessages(room.roomId);
      if (room.unreadCount > 0) {
        this.chatService.markAsRead(room.roomId).subscribe(() => {
          this.loadRooms();
        });
      }
    } else {
      this.messages.set([]);
    }
  }

  loadMessages(roomId: number) {
    this.isLoadingMessages.set(true);
    this.chatService.getMessages(roomId, 1, 50).subscribe({
      next: (data) => {
        this.messages.set(data);
        this.isLoadingMessages.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Lỗi khi tải tin nhắn', err);
        this.isLoadingMessages.set(false);
      }
    });
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.selectedRoom()) return;

    this.isSending.set(true);
    const content = this.newMessage;
    this.newMessage = '';

    try {
      await this.chatService.sendMessageRealtime({
        receiverId: this.selectedRoom()!.partnerId,
        content: content
      });
      // The message will come back through SignalR to update the UI
    } catch (err) {
      console.error('Gửi lỗi', err);
      this.newMessage = content;
    } finally {
      this.isSending.set(false);
    }
  }

  openNewChatModal() {
    this.showNewChatModal.set(true);
    if (this.adminList().length === 0) {
      this.isLoadingAdmins.set(true);
      this.adminService.getAllAdmins().subscribe({
        next: (admins) => {
          // Filter out current user
          this.adminList.set(admins.filter(a => a.id !== this.currentUserId));
          this.isLoadingAdmins.set(false);
        },
        error: (err) => {
          console.error(err);
          this.isLoadingAdmins.set(false);
        }
      });
    }
  }

  startNewChat(admin: AdminResponse) {
    this.showNewChatModal.set(false);

    // Check if room already exists
    const existingRoom = this.rooms().find(r => r.partnerId === admin.id);
    if (existingRoom) {
      this.selectRoom(existingRoom);
    } else {
      // Create a fake room for UI until first message is sent
      const newRoom: ChatRoom = {
        roomId: 0,
        partnerId: admin.id,
        partnerName: admin.fullName || admin.username,
        unreadCount: 0
      };

      this.rooms.update(curr => [newRoom, ...curr]);
      this.selectRoom(newRoom);
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        setTimeout(() => {
          this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        }, 50);
      }
    } catch(err) { }
  }
}
