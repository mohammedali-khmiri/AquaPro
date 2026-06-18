import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { IotService, IotState } from '../../services/iot.service';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-iot-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './iot-control.component.html',
  styleUrl: './iot-control.component.css'
})
export class IotControlComponent implements OnDestroy {
  state: IotState | null = null;
  error = '';
  private sub: Subscription;

  constructor(public iot: IotService, public layoutSvc: LayoutService) {
    this.sub = this.iot.state$.subscribe(s => this.state = s);
  }

  /** Distance bar width (0-100%) — inversed: closer = fuller */
  get distBar1(): number {
    const v = Math.min(this.state?.data.s1 ?? 999, 200);
    return Math.round((1 - v / 200) * 100);
  }
  get distBar2(): number {
    const v = Math.min(this.state?.data.s2 ?? 999, 200);
    return Math.round((1 - v / 200) * 100);
  }

  get barColor1(): string { return this._barColor(this.state?.data.w1 ?? false, this.state?.data.s1 ?? 999); }
  get barColor2(): string { return this._barColor(this.state?.data.w2 ?? false, this.state?.data.s2 ?? 999); }

  /** Format race time from ms to MM:SS.mmm */
  get formattedTime(): string {
    const ms = this.state?.data.time ?? 0;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = ms % 1000;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  }

  /** Current race phase */
  get racePhase(): string {
    return this.state?.data.race ?? 'waiting';
  }

  /** Winner lane label */
  get winnerLabel(): string {
    const first = this.state?.data.first ?? 0;
    if (first === 1) return 'COULOIR GAUCHE';
    if (first === 2) return 'COULOIR DROIT';
    return '---';
  }

  private _barColor(detected: boolean, dist: number): string {
    if (detected) return 'bg-red-500';
    if (dist < 100) return 'bg-amber-400';
    return 'bg-emerald-400';
  }

  async connect(): Promise<void> {
    this.error = '';
    try { await this.iot.connect(); }
    catch (e: any) { this.error = e.message || 'Erreur de connexion'; }
  }

  async disconnect(): Promise<void> { await this.iot.disconnect(); }
  async openDoor(n: 1 | 2): Promise<void>  { await this.iot.openDoor(n); }
  async closeDoor(n: 1 | 2): Promise<void> { await this.iot.closeDoor(n); }
  async resetRace(): Promise<void>          { await this.iot.resetRace(); }

  ngOnDestroy(): void { this.sub.unsubscribe(); }
}
