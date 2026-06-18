import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface IotData {
  s1: number;
  s2: number;
  w1: boolean;
  w2: boolean;
  d1: 'open' | 'closed';
  d2: 'open' | 'closed';
  first: 0 | 1 | 2;
  race: 'waiting' | 'racing' | 'finished';
  time: number;
}

export interface IotState {
  connected: boolean;
  supported: boolean;
  data: IotData;
  firstDetectedAt: string | null;
  log: string[];
}

const DEFAULT_DATA: IotData = {
  s1: 999, s2: 999,
  w1: false, w2: false,
  d1: 'closed', d2: 'closed',
  first: 0,
  race: 'waiting',
  time: 0
};

@Injectable({ providedIn: 'root' })
export class IotService {

  private _state = new BehaviorSubject<IotState>({
    connected: false,
    supported: 'serial' in navigator,
    data: { ...DEFAULT_DATA },
    firstDetectedAt: null,
    log: []
  });

  state$ = this._state.asObservable();

  private port: any = null;
  private readLoopActive = false;
  private writer: any = null;
  private buffer = '';

  constructor(private zone: NgZone) {}

  get isSupported(): boolean { return 'serial' in navigator; }
  get isConnected(): boolean { return this._state.value.connected; }

  async connect(): Promise<void> {
    if (!this.isSupported) throw new Error('Web Serial API non supporté (utiliser Chrome/Edge)');
    const serial = (navigator as any).serial;
    this.port = await serial.requestPort();
    await this.port.open({ baudRate: 115200 });
    this.readLoopActive = true;
    this._patch({ connected: true });
    this._log('Connecté au port Arduino');
    this._startReadLoop();
  }

  async disconnect(): Promise<void> {
    this.readLoopActive = false;
    try {
      if (this.writer) { await this.writer.close(); this.writer = null; }
      if (this.port) { await this.port.close(); this.port = null; }
    } catch (_) {}
    this._patch({ connected: false, data: { ...DEFAULT_DATA } });
    this._log('Déconnecté');
  }

  async sendCommand(cmd: string): Promise<void> {
    if (!this.port?.writable) return;
    const encoder = new TextEncoderStream();
    const pipe = encoder.readable.pipeTo(this.port.writable, { preventClose: true });
    const w = encoder.writable.getWriter();
    await w.write(cmd + '\n');
    await w.close();
    await pipe;
    this._log(`→ ${cmd}`);
  }

  async openDoor(n: 1 | 2): Promise<void>  { await this.sendCommand(`DOOR${n}_OPEN`); }
  async closeDoor(n: 1 | 2): Promise<void> { await this.sendCommand(`DOOR${n}_CLOSE`); }
  async resetRace(): Promise<void> {
    await this.sendCommand('RESET');
    this._patch({
      firstDetectedAt: null,
      data: { ...this._state.value.data, first: 0, race: 'waiting', time: 0 }
    });
    this._log('Course réinitialisée');
  }

  private async _startReadLoop(): Promise<void> {
    const decoder = new TextDecoderStream();
    this.port.readable.pipeTo(decoder.writable, { preventClose: true }).catch(() => {});
    const reader = decoder.readable.getReader();
    try {
      while (this.readLoopActive) {
        const { value, done } = await reader.read();
        if (done) break;
        this.buffer += value;
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('{')) this._parseLine(trimmed);
        }
      }
    } catch (_) {
      this.zone.run(() => this._patch({ connected: false }));
    } finally {
      reader.releaseLock();
    }
  }

  private _parseLine(json: string): void {
    try {
      const data: IotData = JSON.parse(json);
      const prev = this._state.value.data;
      let firstDetectedAt = this._state.value.firstDetectedAt;

      // Record timestamp when first detection happens
      if (data.first !== 0 && prev.first === 0) {
        firstDetectedAt = new Date().toLocaleTimeString('fr-FR', { hour12: false });
      }
      // Reset time if Arduino sent reset
      if (data.first === 0 && prev.first !== 0) {
        firstDetectedAt = null;
      }

      // Log race state transitions
      if (data.race !== prev.race) {
        if (data.race === 'racing') {
          this._log('Course démarrée !');
        } else if (data.race === 'finished') {
          this._log('Course terminée !');
        } else if (data.race === 'waiting') {
          this._log('En attente de course');
        }
      }

      this.zone.run(() => this._patch({ data, firstDetectedAt }));
    } catch (_) {}
  }

  private _log(msg: string): void {
    const time = new Date().toLocaleTimeString('fr-FR', { hour12: false });
    const log = [`[${time}] ${msg}`, ...this._state.value.log].slice(0, 50);
    this._patch({ log });
  }

  private _patch(partial: Partial<IotState>): void {
    this._state.next({ ...this._state.value, ...partial });
  }
}
