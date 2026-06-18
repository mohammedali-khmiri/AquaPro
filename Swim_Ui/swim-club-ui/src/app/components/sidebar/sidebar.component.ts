import { Component, AfterViewInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import gsap from 'gsap';
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements AfterViewInit {
  constructor(
    public authService: AuthService,
    private router: Router,
    public layoutSvc: LayoutService
  ) {}

  get isLoggedIn(): boolean { return this.authService.isLoggedIn(); }
  get role(): string | null { return this.authService.getRole(); }
  get isAdmin(): boolean { return this.authService.hasRole('ADMIN'); }
  get isCoach(): boolean { return this.authService.hasRole('COACH'); }
  get isSwimmer(): boolean { return this.authService.hasRole('SWIMMER'); }
  get userInfo() { return this.authService.getUserInfo(); }

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

