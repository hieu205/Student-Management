import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/auth/auth.service';
import { AdminService, AdminResponse } from '../../core/services/admin.service';
import { ChatRoom, ChatMessage, ChatAttachment } from '../../core/models/chat.model';
import { Subscription, firstValueFrom } from 'rxjs';
import { SecureImagePipe } from '../../shared/pipes/secure-image.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, SecureImagePipe],
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

            <!-- Search Messages -->
            <div class="relative flex items-center">
              <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" (keyup.enter)="executeSearch()"
                     placeholder="Tìm kiếm tin nhắn..."
                     class="bg-gray-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 rounded-full pl-10 pr-4 py-1.5 text-sm dark:text-slate-100 transition-all outline-none w-48 focus:w-64">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button *ngIf="isShowingSearchResults()" (click)="clearSearch()" class="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Chat Messages Area -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900/30" #scrollMe>
            <div *ngIf="isLoadingMessages() || isSearching()" class="text-center text-sm text-gray-500 my-4">Đang tải...</div>

            <div *ngIf="isShowingSearchResults()" class="text-center text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg mb-4">
              Hiển thị kết quả tìm kiếm cho "{{ searchQuery() }}"
            </div>

            <div *ngFor="let msg of messages(); trackBy: trackByMessageId" class="flex flex-col mb-2 group/msg"
                 [ngClass]="msg.senderId === currentUserId ? 'items-end' : 'items-start'">
              <div class="flex items-center gap-2 max-w-[70%]" [ngClass]="msg.senderId === currentUserId ? 'flex-row-reverse' : 'flex-row'">
                <div class="rounded-2xl px-4 py-2 flex flex-col gap-2"
                     [ngClass]="msg.isDeleted
                              ? 'bg-gray-100 dark:bg-slate-700/50 text-gray-500 italic border border-gray-200 dark:border-slate-600'
                              : (msg.senderId === currentUserId
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-600 shadow-sm rounded-bl-none')">

                  <p class="text-sm whitespace-pre-wrap break-words" *ngIf="msg.content">{{ msg.content }}</p>

                  <!-- Attachments -->
                  <div *ngIf="msg.attachments && msg.attachments.length > 0 && !msg.isDeleted" class="flex flex-col gap-2 mt-1">
                    <div *ngFor="let att of msg.attachments; trackBy: trackByAttachmentId" class="relative group rounded overflow-hidden">
                       <ng-container *ngIf="att.kind === 'Image'">
                         <ng-container *ngIf="att.previewUrl | secureImage | async as src; else loadingImage">
                           <img [src]="src" alt="attachment" class="max-w-full h-auto rounded-lg max-h-60 object-cover cursor-pointer hover:opacity-90" (click)="openImagePreview(src, att)">
                         </ng-container>
                         <ng-template #loadingImage>
                           <div class="h-32 w-48 bg-black/10 dark:bg-white/10 animate-pulse rounded-lg flex items-center justify-center">
                             <svg class="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                             </svg>
                           </div>
                         </ng-template>
                       </ng-container>
                       <ng-container *ngIf="att.kind !== 'Image'">
                         <div class="flex items-center gap-2 p-2 rounded bg-black/10 dark:bg-white/10 cursor-pointer hover:bg-black/20" (click)="downloadAttachment(att)">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white opacity-80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                           <div class="flex flex-col overflow-hidden">
                             <span class="text-sm font-semibold truncate text-white">{{ att.fileName }}</span>
                             <span class="text-xs text-white opacity-70">{{ formatBytes(att.sizeBytes) }}</span>
                           </div>
                         </div>
                       </ng-container>
                    </div>
                  </div>

                </div>

                <!-- Recall Action -->
                <button *ngIf="msg.senderId === currentUserId && !msg.isDeleted && msg.id > 0"
                        (click)="recallMessage(msg)"
                        class="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full shrink-0"
                        title="Thu hồi tin nhắn">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <span class="text-[10px] text-gray-400 mt-1 mx-1">{{ msg.createdAt + 'Z' | date:'HH:mm dd/MM/yyyy' }}</span>
            </div>
            <div *ngIf="messages().length === 0 && !isLoadingMessages()" class="text-center text-sm text-gray-500 my-8">
              Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện.
            </div>
          </div>

          <!-- Chat Input Area -->
          <div class="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col gap-2 z-10 relative">

            <!-- Selected files preview -->
            <div *ngIf="selectedFiles().length > 0" class="flex gap-2 overflow-x-auto pb-2">
               <div *ngFor="let f of selectedFiles(); let i = index" class="relative shrink-0 w-16 h-16 rounded bg-gray-100 dark:bg-slate-700 flex flex-col items-center justify-center border border-gray-200 dark:border-slate-600 overflow-hidden group">
                  <ng-container *ngIf="f.url; else noImage">
                    <img [src]="f.url" alt="preview" class="w-full h-full object-cover cursor-pointer hover:opacity-80" (click)="openLocalPreview(f.url, f.file.name)">
                  </ng-container>
                  <ng-template #noImage>
                    <span class="text-[10px] text-gray-500 truncate w-full text-center px-1">{{ f.file.name }}</span>
                  </ng-template>
                  <!-- Hover overlay for image names -->
                  <div *ngIf="f.url" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                    <span class="text-[8px] text-white truncate w-full text-center px-1" [title]="f.file.name">{{ f.file.name }}</span>
                  </div>
                  <button type="button" (click)="removeSelectedFile(i)" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 focus:outline-none z-10 scale-90">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
            </div>

            <!-- Input form -->
            <form (ngSubmit)="sendMessage()" class="flex gap-2 items-center">
              <button type="button" (click)="fileInput.click()" class="text-gray-400 hover:text-blue-600 transition-colors shrink-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input type="file" #fileInput multiple hidden (change)="onFileSelected($event)">

              <input type="text" [(ngModel)]="newMessage" name="message"
                     class="flex-1 bg-gray-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-full px-4 py-2.5 text-sm dark:text-slate-100 transition-all outline-none"
                     placeholder="Nhập tin nhắn..." autocomplete="off">
              <button type="submit" [disabled]="(!newMessage.trim() && selectedFiles().length === 0) || isSending() || isUploading()"
                      class="bg-blue-600 hover:bg-blue-700 text-white h-10 w-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                <svg *ngIf="!isSending() && !isUploading()" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                <svg *ngIf="isSending() || isUploading()" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
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

      <!-- Image Lightbox Overlay -->
      <div *ngIf="previewingImage()" class="fixed inset-0 z-[100] bg-black/95 backdrop-blur flex flex-col items-center justify-center">
        <div class="absolute top-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
          <div class="text-white text-sm truncate max-w-sm font-medium">{{ previewingImage()?.fileName }}</div>
          <div class="flex items-center gap-3">
            <button *ngIf="previewingImage()?.att" (click)="downloadAttachment(previewingImage()!.att!)" class="text-white hover:text-blue-400 transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer" title="Tải xuống">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button (click)="closeImagePreview()" class="text-white hover:text-red-400 transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer" title="Đóng">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <img [src]="previewingImage()?.url" class="max-w-[95vw] max-h-[85vh] object-contain select-none shadow-2xl rounded" (click)="closeImagePreview()">
      </div>

      <!-- Alert Modal Overlay -->
      <div *ngIf="showAlertModal()" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm transition-opacity" (click)="showAlertModal.set(false)"></div>

        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-gray-100 dark:border-slate-700">
            <div class="bg-white dark:bg-slate-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 sm:mx-0 sm:h-10 sm:w-10">
                  <svg class="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 class="text-lg font-semibold leading-6 text-gray-900 dark:text-white">Thông báo</h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500 dark:text-slate-400">{{ alertMessage() }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100 dark:border-slate-700/50">
              <button (click)="showAlertModal.set(false)" type="button" class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:w-auto transition-colors">Đã hiểu</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirm Modal Overlay -->
      <div *ngIf="showConfirmModal()" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm transition-opacity" (click)="showConfirmModal.set(false)"></div>
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-800 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-gray-100 dark:border-slate-700">
            <div class="bg-white dark:bg-slate-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                  <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 class="text-lg font-semibold leading-6 text-gray-900 dark:text-white">Xác nhận</h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500 dark:text-slate-400">{{ confirmMessage() }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 dark:bg-slate-800/80 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-100 dark:border-slate-700/50">
              <button (click)="executeConfirmAction()" type="button" class="inline-flex w-full justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto transition-colors">Xác nhận</button>
              <button (click)="showConfirmModal.set(false)" type="button" class="mt-3 inline-flex w-full justify-center rounded-lg bg-white dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto transition-colors">Hủy bỏ</button>
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
  isUploading = signal(false);

  newMessage = '';
  currentUserId = 0;
  selectedFiles = signal<{file: File, url?: string}[]>([]);

  // New chat modal state
  showNewChatModal = signal(false);
  adminList = signal<AdminResponse[]>([]);
  isLoadingAdmins = signal(false);

  // Lightbox state
  previewingImage = signal<{url: any, fileName: string, att?: ChatAttachment} | null>(null);

  // Custom Modal states
  showAlertModal = signal(false);
  alertMessage = signal('');

  showConfirmModal = signal(false);
  confirmMessage = signal('');
  confirmAction = signal<(() => void) | null>(null);

  // Search states
  searchQuery = signal('');
  isSearching = signal(false);
  isShowingSearchResults = signal(false);

  private msgSub!: Subscription;
  private msgDelSub!: Subscription;

  trackByMessageId(index: number, msg: ChatMessage) {
    return msg.id || msg.clientMessageId;
  }

  trackByAttachmentId(index: number, att: ChatAttachment) {
    return att.id;
  }

  formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  openImagePreview(url: any, att: ChatAttachment) {
    this.previewingImage.set({ url, fileName: att.fileName, att });
  }

  openLocalPreview(url: string | undefined, fileName: string) {
    if (url) {
      this.previewingImage.set({ url, fileName });
    }
  }

  closeImagePreview() {
    this.previewingImage.set(null);
  }

  showCustomAlert(msg: string) {
    this.alertMessage.set(msg);
    this.showAlertModal.set(true);
  }

  showCustomConfirm(msg: string, action: () => void) {
    this.confirmMessage.set(msg);
    this.confirmAction.set(action);
    this.showConfirmModal.set(true);
  }

  executeConfirmAction() {
    const action = this.confirmAction();
    if (action) action();
    this.showConfirmModal.set(false);
  }

  executeSearch() {
    const query = this.searchQuery().trim();
    if (!query) {
      this.clearSearch();
      return;
    }

    const roomId = this.selectedRoom()?.roomId;
    if (!roomId) return;

    this.isSearching.set(true);
    this.isShowingSearchResults.set(true);

    this.chatService.searchMessages(roomId, query).subscribe({
      next: (data) => {
        this.messages.set(data.reverse()); // Assume search returns latest first, reverse to show chronological order
        this.isSearching.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Lỗi khi tìm kiếm', err);
        this.isSearching.set(false);
        this.showCustomAlert('Có lỗi xảy ra khi tìm kiếm tin nhắn.');
      }
    });
  }

  clearSearch() {
    this.searchQuery.set('');
    this.isShowingSearchResults.set(false);
    if (this.selectedRoom()?.roomId) {
      this.loadMessages(this.selectedRoom()!.roomId);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files as FileList;
    if (files.length > 0) {
      const arr = Array.from(files);
      if (this.selectedFiles().length + arr.length > 5) {
        this.showCustomAlert('Tối đa 5 tệp mỗi lần gửi');
        return;
      }
      let totalSize = this.selectedFiles().reduce((acc, f) => acc + f.file.size, 0);
      arr.forEach(f => totalSize += f.size);
      if (totalSize > 25 * 1024 * 1024) {
        this.showCustomAlert('Tổng dung lượng các tệp vượt quá 25MB');
        return;
      }

      const newFiles = arr.map(f => ({
        file: f,
        url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
      }));

      this.selectedFiles.update(curr => [...curr, ...newFiles]);
      event.target.value = '';
    }
  }

  removeSelectedFile(index: number) {
    this.selectedFiles.update(curr => {
      const target = curr[index];
      if (target && target.url) {
        URL.revokeObjectURL(target.url);
      }
      return curr.filter((_, i) => i !== index);
    });
  }

  recallMessage(msg: ChatMessage) {
    this.showCustomConfirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?', () => {
      this.chatService.deleteMessage(msg.id).subscribe({
        error: (err) => {
          console.error('Lỗi khi thu hồi', err);
          this.showCustomAlert('Không thể thu hồi tin nhắn. Vui lòng thử lại.');
        }
      });
    });
  }

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

    this.msgDelSub = this.chatService.messageDeleted$.subscribe(data => {
      if (this.selectedRoom() && this.selectedRoom()?.roomId === data.roomId) {
        this.messages.update(msgs => {
          const index = msgs.findIndex(m => m.id === data.messageId);
          if (index !== -1) {
            const newMsgs = [...msgs];
            newMsgs[index] = { ...newMsgs[index], isDeleted: true, content: 'Tin nhắn đã bị thu hồi', attachments: [] };
            return newMsgs;
          }
          return msgs;
        });
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
    if (this.msgDelSub) {
      this.msgDelSub.unsubscribe();
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
    if ((!this.newMessage.trim() && this.selectedFiles().length === 0) || !this.selectedRoom()) return;

    this.isSending.set(true);
    const content = this.newMessage;
    this.newMessage = '';
    const fileObjects = this.selectedFiles();
    this.selectedFiles.set([]);

    // Revoke object URLs to avoid memory leaks
    fileObjects.forEach(f => {
      if (f.url) URL.revokeObjectURL(f.url);
    });

    const filesToUpload = fileObjects.map(f => f.file);
    let attachmentIds: string[] = [];

    try {
      if (filesToUpload.length > 0) {
        this.isUploading.set(true);
        const atts = await firstValueFrom(this.chatService.uploadAttachments(this.selectedRoom()!.partnerId, filesToUpload));
        if (atts) {
          attachmentIds = atts.map(a => a.id);
        }
        this.isUploading.set(false);
      }

      const clientMessageId = crypto.randomUUID();

      await this.chatService.sendMessageRealtime({
        receiverId: this.selectedRoom()!.partnerId,
        content: content,
        attachmentIds: attachmentIds,
        clientMessageId: clientMessageId
      });
    } catch (err) {
      console.error('Gửi lỗi', err);
      this.newMessage = content;
      // Re-create object URLs for the files since we revoked them
      const restoredFiles = fileObjects.map(f => ({
        file: f.file,
        url: f.file.type.startsWith('image/') ? URL.createObjectURL(f.file) : undefined
      }));
      this.selectedFiles.set(restoredFiles);
      this.showCustomAlert('Không thể gửi tin nhắn hoặc upload file. Vui lòng thử lại!');
      this.isUploading.set(false);
    } finally {
      this.isSending.set(false);
    }
  }

  downloadAttachment(att: ChatAttachment) {
    const token = this.authService.getToken();
    fetch(`http://localhost:5075${att.downloadUrl}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error('Error downloading file', err);
      this.showCustomAlert('Lỗi tải tệp xuống!');
    });
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
