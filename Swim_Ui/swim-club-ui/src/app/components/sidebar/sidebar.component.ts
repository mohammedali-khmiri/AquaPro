import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';
import { environment } from '../../../environments/environment';
import { UserService } from '../../services/user.service';


import { Client, IFrame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements AfterViewInit, OnInit, OnDestroy {
  pendingCount = 0;
  private stompClient!: Client;

  constructor(
    public authService: AuthService,
    private router: Router,
    public layoutSvc: LayoutService,
    private userService: UserService
  ) {}

  get isLoggedIn(): boolean { return this.authService.isLoggedIn(); }
  get role(): string | null { return this.authService.getRole(); }
  get isAdmin(): boolean { return this.authService.hasRole('ADMIN'); }
  get isCoach(): boolean { return this.authService.hasRole('COACH'); }
  get isSwimmer(): boolean { return this.authService.hasRole('SWIMMER'); }
  get userInfo() { return this.authService.getUserInfo(); }

  ngOnInit(): void {
    if (this.isAdmin) {
      this.loadInitialPendingCount();
      this.connectToApprovalNotifications();
    }
  }

  ngOnDestroy(): void {
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate();
    }
  }

  loadInitialPendingCount(): void {
    this.userService.getPendingUsers().subscribe({
      next: (users: any[]) => { // 🌟 Typé en any[] pour contourner l'erreur de modèle manquant
        this.pendingCount = users.length;
      },
      error: (err: any) => {
        console.error('Erreur requete approvals HTTP:', err);
      }
    });
  }

  connectToApprovalNotifications(): void {
    try {
      const socketUrl = `${environment.apiBaseUrl.replace('/api', '')}/ws-chat`;
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        reconnectDelay: 5000,
      });

      this.stompClient.onConnect = () => {
        this.stompClient.subscribe('/topic/admin/approvals', () => {
          this.pendingCount++;
        });
      };

      this.stompClient.onStompError = (frame: IFrame) => {
        console.warn('Statut temporaire WebSocket Approbations :', frame.body);
      };

      this.stompClient.activate();
    } catch (error) {
      console.error('Erreur initialisation WebSocket Approbations :', error);
    }
  }

  clearBadge(): void {
    this.pendingCount = 0;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngAfterViewInit() {
    gsap.from('a', {
      x: -20,
      opacity: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.out'
    });
  }
}
