import { Component, EventEmitter, OnDestroy, Output, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SwimmerService } from '../../services/swimmer.service';
import { Swimmer } from '../../models';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-scanner.component.html',
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  scannedSwimmer: Swimmer | null = null;
  scanError: string | null = null;
  loading = false;
  private scanner: any = null;

  constructor(
    private swimmerService: SwimmerService,
    public layoutSvc: LayoutService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.startScanner(), 400);
  }

  startScanner(): void {
    const win = window as any;
    if (!win.Html5QrcodeScanner) {
      this.scanError = 'Scanner library not loaded. Recheck network or reload page.';
      return;
    }
    this.scanner = new win.Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    this.scanner.render(
      (decodedText: string) => this.onScanSuccess(decodedText),
      () => {}
    );
  }

  onScanSuccess(decodedText: string): void {
    if (this.loading || this.scannedSwimmer) return;
    this.scanError = null;
    const parts = decodedText.split(':');
    let swimmerId: number | null = null;
    if (parts[0] === 'SWIMMER' && parts[1]) {
      swimmerId = parseInt(parts[1], 10);
    } else {
      const parsed = parseInt(decodedText, 10);
      if (!isNaN(parsed)) swimmerId = parsed;
    }
    if (!swimmerId || isNaN(swimmerId)) {
      this.scanError = 'QR code invalide. Format attendu: SWIMMER:id';
      return;
    }
    this.loading = true;
    this.stopScanner();
    this.swimmerService.getSwimmerById(swimmerId).subscribe({
      next: (swimmer) => { this.scannedSwimmer = swimmer; this.loading = false; },
      error: () => { this.scanError = `Nageur ID ${swimmerId} introuvable.`; this.loading = false; }
    });
  }

  stopScanner(): void {
    if (this.scanner) { this.scanner.clear().catch(() => {}); this.scanner = null; }
  }

  rescan(): void {
    this.scannedSwimmer = null;
    this.scanError = null;
    setTimeout(() => this.startScanner(), 300);
  }

  onClose(): void { this.stopScanner(); this.close.emit(); }
  ngOnDestroy(): void { this.stopScanner(); }
}
