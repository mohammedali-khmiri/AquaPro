import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';

// Real swimming pools in Tunisia with coordinates
const TUNISIA_POOLS = [
  {
    name: 'Piscine Olympique d\'El Menzah',
    lat: 36.8415, lng: 10.1896,
    city: 'Tunis',
    type: 'Olympic (50m)',
    status: 'operational',
    temp: '27.5°C',
    occupancy: '42%',
    color: '#10b981'
  },
  {
    name: 'Piscine de Radès (Centre Sportif)',
    lat: 36.7718, lng: 10.2707,
    city: 'Radès, Ben Arous',
    type: 'Olympic (50m)',
    status: 'operational',
    temp: '27.0°C',
    occupancy: '58%',
    color: '#10b981'
  },
  {
    name: 'Piscine du Complexe Sportif Chedly Zouiten',
    lat: 36.8193, lng: 10.1783,
    city: 'Tunis',
    type: '25m Pool',
    status: 'operational',
    temp: '28.0°C',
    occupancy: '30%',
    color: '#10b981'
  },
  {
    name: 'Piscine de Sfax',
    lat: 34.7406, lng: 10.7603,
    city: 'Sfax',
    type: '25m Pool',
    status: 'operational',
    temp: '26.5°C',
    occupancy: '25%',
    color: '#10b981'
  },
  {
    name: 'Piscine Municipale de Sousse',
    lat: 35.8245, lng: 10.6346,
    city: 'Sousse',
    type: '25m Pool',
    status: 'maintenance',
    temp: '—',
    occupancy: '0%',
    color: '#f59e0b'
  },
  {
    name: 'Piscine de Monastir',
    lat: 35.7643, lng: 10.8113,
    city: 'Monastir',
    type: '25m Pool',
    status: 'operational',
    temp: '27.2°C',
    occupancy: '20%',
    color: '#10b981'
  },
  {
    name: 'Piscine de Nabeul',
    lat: 36.4518, lng: 10.7346,
    city: 'Nabeul',
    type: '25m Pool',
    status: 'operational',
    temp: '26.8°C',
    occupancy: '15%',
    color: '#10b981'
  },
  {
    name: 'Piscine de Gabès',
    lat: 33.8815, lng: 10.0982,
    city: 'Gabès',
    type: '25m Pool',
    status: 'closed',
    temp: '—',
    occupancy: '0%',
    color: '#ef4444'
  }
];

@Component({
  selector: 'app-pool-map',
  standalone: true,
  imports: [],
  templateUrl: './pool-map.component.html',
  styleUrl: './pool-map.component.css'
})
export class PoolMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map: L.Map | undefined;

  pools = TUNISIA_POOLS;

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap(): void {
    // Center on Tunisia
    this.map = L.map(this.mapContainer.nativeElement, { zoomControl: false }).setView([34.0, 9.5], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap, © CartoDB'
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    TUNISIA_POOLS.forEach(pool => {
      const statusColor = pool.status === 'operational' ? '#10b981'
                        : pool.status === 'maintenance' ? '#f59e0b' : '#ef4444';
      const statusLabel = pool.status === 'operational' ? 'Operational'
                        : pool.status === 'maintenance' ? 'Maintenance' : 'Closed';

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background-color:${statusColor};
          width:20px;height:20px;border-radius:50%;
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
          cursor:pointer;
          transition:transform 0.2s;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([pool.lat, pool.lng], { icon }).addTo(this.map!);
      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:200px;padding:4px;">
          <div style="font-weight:700;font-size:14px;color:#1e293b;margin-bottom:4px;">${pool.name}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:8px;">📍 ${pool.city} • ${pool.type}</div>
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <span style="background:${statusColor}20;color:${statusColor};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">${statusLabel}</span>
          </div>
          ${pool.status === 'operational' ? `
            <div style="font-size:12px;color:#475569;display:flex;gap:12px;">
              <span>🌡️ ${pool.temp}</span>
              <span>👥 ${pool.occupancy}</span>
            </div>
          ` : ''}
        </div>
      `, { maxWidth: 260 });
    });
  }
}
