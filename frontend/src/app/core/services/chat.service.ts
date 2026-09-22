import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../auth/auth.service';
import { ChatRoom, ChatMessage, SendMessageRequest } from '../models/chat.model';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private hubConnection: signalR.HubConnection | null = null;

  private apiUrl = 'http://localhost:5075/api/v1/chat';
  private hubUrl = 'http://localhost:5075/hubs/chat';

  // Observable to emit received messages to components
  private messageReceivedSource = new Subject<ChatMessage>();
  public messageReceived$ = this.messageReceivedSource.asObservable();

  public isConnected = signal(false);

  constructor() {}

  public startConnection() {
    const token = this.authService.getToken();
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR Connection Started');
        this.isConnected.set(true);
        this.addReceiveMessageListener();
      })
      .catch(err => {
        console.error('Error while starting connection: ' + err);
        this.isConnected.set(false);
      });

    this.hubConnection.onreconnecting(() => this.isConnected.set(false));
    this.hubConnection.onreconnected(() => this.isConnected.set(true));
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => {
          this.isConnected.set(false);
          console.log('SignalR Connection Stopped');
        });
    }
  }

  private addReceiveMessageListener() {
    this.hubConnection?.on('ReceiveMessage', (message: ChatMessage) => {
      this.messageReceivedSource.next(message);
    });
  }

  public sendMessageRealtime(request: SendMessageRequest): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      return Promise.reject('Connection not established');
    }
    return this.hubConnection.invoke('SendMessage', request);
  }

  // REST API Endpoints
  public getRooms(): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.apiUrl}/rooms`);
  }

  public getMessages(roomId: number, page: number = 1, pageSize: number = 20): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/rooms/${roomId}/messages?page=${page}&pageSize=${pageSize}`);
  }

  public markAsRead(roomId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/rooms/${roomId}/read`, {});
  }
}

