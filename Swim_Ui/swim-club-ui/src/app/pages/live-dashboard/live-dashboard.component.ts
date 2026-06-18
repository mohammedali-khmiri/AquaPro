import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IpCameraComponent } from '../ip-camera/ip-camera.component';
import { IotControlComponent } from '../iot-control/iot-control.component';

@Component({
  selector: 'app-live-dashboard',
  standalone: true,
  imports: [CommonModule, IpCameraComponent, IotControlComponent],
  template: `
    <div id="live-dashboard-container" class="min-h-screen bg-slate-50 dark:bg-slate-900 pt-6 pb-12">
      <!-- Dashboard Header -->
      <div class="max-w-[1600px] mx-auto px-6 mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-3">
            <span class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            AquaPro Live
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1">Supervision globale en temps réel</p>
        </div>
        
        <div class="flex gap-4">
          <!-- Fullscreen Button -->
          <button (click)="toggleFullscreen()" class="px-5 py-2.5 bg-slate-800 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-sm text-sm font-bold hover:opacity-90 transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Plein Écran
          </button>

          <!-- Link to the management app (login) -->
          <a href="/login" class="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-pool" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            Espace Club
          </a>
        </div>
      </div>

      <!-- Main Layout: Grid -->
      <div class="max-w-[1600px] mx-auto px-6 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        <!-- Left Column: Video Stream -->
        <div class="xl:col-span-7 space-y-6">
          <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <app-ip-camera></app-ip-camera>
          </div>
        </div>

        <!-- Right Column: IoT Control -->
        <div class="xl:col-span-5 space-y-6">
          <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-full">
            <app-iot-control></app-iot-control>
          </div>
        </div>

      </div>
    </div>
  `
})
export class LiveDashboardComponent {
  toggleFullscreen() {
    const elem = document.getElementById('live-dashboard-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => {
        console.error("Erreur d'activation du plein ecran: " + err.message);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
}
