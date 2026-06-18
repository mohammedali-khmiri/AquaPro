import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoolService, Pool } from '../../services/pool.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-pools',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './pools.component.html'
})
export class PoolsComponent implements OnInit {

  pools: Pool[] = [];
  isModalOpen = false;
  isEditing = false;
  currentPool: Partial<Pool> = {};
  tagsInput = '';
  searchTerm = '';
  isAdmin = false;
  isCoach = false;
  isSwimmer = false;

  readonly colorOptions = [
    { value: '#0ea5e9', label: 'Bleu' },
    { value: '#10b981', label: 'Vert' },
    { value: '#f59e0b', label: 'Ambre' },
    { value: '#ef4444', label: 'Rouge' },
    { value: '#8b5cf6', label: 'Violet' },
    { value: '#64748b', label: 'Gris' },
  ];

  constructor(private poolService: PoolService, public authService: AuthService) {}

  ngOnInit() {
    this.isAdmin = this.authService.hasRole('ADMIN');
    this.isCoach = this.authService.hasRole('COACH');
    this.isSwimmer = this.authService.hasRole('SWIMMER');
    this.loadPools();
  }

  get filteredPools(): Pool[] {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.pools;
    return this.pools.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.location?.toLowerCase().includes(term) ||
      p.status?.toLowerCase().includes(term)
    );
  }

  loadPools() {
    this.poolService.getPools().subscribe({
      next: (data) => this.pools = data,
      error: (err) => console.error('Erreur chargement piscines', err)
    });
  }

  openModal(pool?: Pool) {
    this.isModalOpen = true;
    if (pool) {
      this.isEditing = true;
      this.currentPool = { ...pool };
      this.tagsInput = pool.tags ? pool.tags.join(', ') : '';
    } else {
      this.isEditing = false;
      this.tagsInput = '';
      this.currentPool = { name: '', location: '', dimensions: '', lanes: 4, status: 'Open', iconColor: '#0ea5e9', tags: [] };
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.currentPool = {};
    this.tagsInput = '';
  }

  savePool() {
    this.currentPool.tags = this.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (this.isEditing && this.currentPool.id) {
      this.poolService.updatePool(this.currentPool.id, this.currentPool as Pool).subscribe({
        next: () => { this.loadPools(); this.closeModal(); },
        error: (err) => console.error('Erreur modification', err)
      });
    } else {
      this.poolService.addPool(this.currentPool as Pool).subscribe({
        next: () => { this.loadPools(); this.closeModal(); },
        error: (err) => console.error('Erreur ajout', err)
      });
    }
  }

  onDelete(id: string | undefined) {
    if (id && confirm('Supprimer ce bassin ?')) {
      this.poolService.deletePool(id).subscribe({
        next: () => this.loadPools(),
        error: (err) => console.error('Erreur suppression', err)
      });
    }
  }

  statusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'open': return '#10b981';
      case 'closed': return '#ef4444';
      case 'maintenance': return '#f59e0b';
      default: return '#64748b';
    }
  }

  statusBg(status: string): string {
    switch (status?.toLowerCase()) {
      case 'open': return '#d1fae5';
      case 'closed': return '#fee2e2';
      case 'maintenance': return '#fef3c7';
      default: return '#f1f5f9';
    }
  }
}
