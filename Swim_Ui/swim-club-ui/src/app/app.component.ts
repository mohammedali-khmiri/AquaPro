import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { QrScannerComponent } from './components/qr-scanner/qr-scanner.component';
import { MyQrComponent } from './components/my-qr/my-qr.component';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { LayoutService } from './services/layout.service';
import { QrStateService } from './services/qr-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, QrScannerComponent, MyQrComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'swim-club-ui';
  isAuthRoute = true; // true par défaut → pas de flash du mauvais layout

  constructor(
    private router: Router,
    private authService: AuthService,
    public layoutSvc: LayoutService,
    public qrSvc: QrStateService
  ) {}

  ngOnInit() {
    this.layoutSvc.initDarkMode();
    const checkRoute = (url: string) => {
      this.isAuthRoute = url.includes('/login') || url.includes('/register');
    };
    checkRoute(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      checkRoute(event.urlAfterRedirects);
    });
  }
}

