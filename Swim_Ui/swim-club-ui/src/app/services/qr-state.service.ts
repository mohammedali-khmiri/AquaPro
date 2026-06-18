import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class QrStateService {
  isOpen = false;
  toggle() { this.isOpen = !this.isOpen; }
  close()  { this.isOpen = false; }

  myQrOpen = false;
  openMyQr()  { this.myQrOpen = true; }
  closeMyQr() { this.myQrOpen = false; }
}
