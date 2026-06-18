import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwimmerService } from '../../services/swimmer.service';
import { AuthService } from '../../services/auth.service';
import { Swimmer } from '../../models';

@Component({
  selector: 'app-my-qr',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.75);backdrop-filter:blur(4px);">
      <div style="background:#fff;border-radius:1.25rem;box-shadow:0 25px 60px rgba(0,0,0,.3);width:100%;max-width:22rem;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.25rem;background:linear-gradient(135deg,#10b981,#0d9488);">
          <div style="display:flex;align-items:center;gap:.75rem;">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:1.25rem;height:1.25rem;color:#fff;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
            </svg>
            <span style="color:#fff;font-weight:700;font-size:.95rem;">Mon QR Code</span>
          </div>
          <button (click)="close.emit()" style="background:transparent;border:none;cursor:pointer;color:rgba(255,255,255,.8);padding:.25rem;">
            <svg xmlns="http://www.w3.org/2000/svg" style="width:1.25rem;height:1.25rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div style="padding:1.5rem;display:flex;flex-direction:column;align-items:center;gap:1rem;">

          <!-- Loading -->
          <div *ngIf="loading" style="display:flex;flex-direction:column;align-items:center;gap:.75rem;padding:2rem 0;">
            <svg style="width:2rem;height:2rem;animation:spin 1s linear infinite;color:#10b981;" fill="none" viewBox="0 0 24 24">
              <circle style="opacity:.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path style="opacity:.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p style="color:#64748b;font-size:.875rem;margin:0;">Chargement de votre profil...</p>
          </div>

          <!-- Error -->
          <div *ngIf="error && !loading" style="padding:.75rem;border-radius:.75rem;background:#fef2f2;border:1px solid #fecaca;color:#dc2626;font-size:.875rem;width:100%;text-align:center;">
            {{ error }}
          </div>

          <!-- QR Code content -->
          <ng-container *ngIf="swimmer && !loading">

            <!-- Swimmer name row -->
            <div style="display:flex;align-items:center;gap:.75rem;width:100%;">
              <div style="width:3rem;height:3rem;border-radius:9999px;background:#10b981;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1.1rem;flex-shrink:0;">
                {{ (swimmer.userFirstName || '?').charAt(0).toUpperCase() }}{{ (swimmer.userLastName || '').charAt(0).toUpperCase() }}
              </div>
              <div>
                <p style="font-weight:700;color:#1e293b;margin:0;">{{ swimmer.userFirstName }} {{ swimmer.userLastName }}</p>
                <p style="font-size:.75rem;color:#64748b;margin:0;">{{ swimmer.registrationNumber || ('ID: ' + swimmer.id) }}</p>
              </div>
            </div>

            <!-- QR canvas -->
            <!-- QR image -->
            <div id="my-qr-container" style="display:flex;align-items:center;justify-content:center;padding:.75rem;background:#fff;border-radius:.75rem;border:2px solid #d1fae5;box-shadow:inset 0 2px 8px rgba(0,0,0,.05);width:100%;min-height:11rem;">
              <img *ngIf="qrDataUrl" [src]="qrDataUrl" style="width:220px;height:220px;display:block;" alt="Mon QR Code">
              <p *ngIf="!qrDataUrl" style="font-size:.875rem;color:#94a3b8;margin:0;">Génération...</p>
            </div>

            <p style="font-size:.75rem;color:#94a3b8;text-align:center;margin:0;">
              Montrez ce QR code à votre coach ou administrateur
            </p>

            <!-- Download button -->
            <button (click)="downloadQr()" style="width:100%;padding:.6rem;border-radius:.75rem;font-size:.875rem;font-weight:600;color:#fff;background:linear-gradient(135deg,#0ea5e9,#0369a1);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" style="width:1rem;height:1rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Télécharger le QR Code
            </button>

          </ng-container>
        </div>
      </div>
    </div>
  `,
})
export class MyQrComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  swimmer: Swimmer | null = null;
  loading = true;
  error = '';
  qrDataUrl: string | null = null;

  constructor(
    private swimmerService: SwimmerService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.error = 'Utilisateur non connecté.';
      this.loading = false;
      return;
    }
    this.swimmerService.getSwimmersByUserId(userId).subscribe({
      next: (swimmers) => {
        this.swimmer = swimmers[0] || null;
        this.loading = false;
        if (!this.swimmer) {
          this.error = 'Aucun profil nageur trouvé pour ce compte.';
          return;
        }
        this.generateQr();
      },
      error: () => {
        this.error = 'Impossible de charger votre profil nageur.';
        this.loading = false;
      }
    });
  }

  generateQr(): void {
    const win = window as any;
    if (!win.QRCode || !this.swimmer) return;
    const offscreen = document.createElement('div');
    offscreen.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
    document.body.appendChild(offscreen);
    new win.QRCode(offscreen, {
      text: `SWIMMER:${this.swimmer.id}:${this.swimmer.userFirstName} ${this.swimmer.userLastName}:${this.swimmer.registrationNumber || ''}`,
      width: 220,
      height: 220,
      colorDark: '#064e3b',
      colorLight: '#ffffff',
      correctLevel: win.QRCode.CorrectLevel.H
    });
    setTimeout(() => {
      const canvas = offscreen.querySelector('canvas');
      if (canvas) { this.qrDataUrl = canvas.toDataURL('image/png'); }
      document.body.removeChild(offscreen);
    }, 100);
  }

  downloadQr(): void {
    if (!this.qrDataUrl) return;
    const link = document.createElement('a');
    const name = `${this.swimmer?.userFirstName || 'nageur'}_${this.swimmer?.userLastName || ''}`.replace(/\s+/g, '_');
    link.download = `MonQR_${name}.png`;
    link.href = this.qrDataUrl;
    link.click();
  }
}
