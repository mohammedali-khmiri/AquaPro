import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LayoutService } from '../../services/layout.service';
import { QrStateService } from '../../services/qr-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  showProfile = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    public layoutSvc: LayoutService,
    public qrSvc: QrStateService
  ) {}

  get userInfo() { return this.authService.getUserInfo(); }
  get role(): string | null { return this.authService.getRole(); }
  get roles(): string[] { return this.authService.getRolesNormalized(); }
  get userId(): number | null { return this.authService.getUserId(); }

  toggleProfile() { this.showProfile = !this.showProfile; }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-wrapper')) {
      this.showProfile = false;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

