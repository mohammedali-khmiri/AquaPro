import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CompetitionService } from '../../services/competition.service';
import { AuthService } from '../../services/auth.service';
import { Competition } from '../../models';

@Component({
  selector: 'app-competitions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './competitions.component.html',
  styleUrl: './competitions.component.css'
})
export class CompetitionsComponent implements OnInit {
  competitions: Competition[] = [];
  loading = true;
  error = '';
  showModal = false;
  isEditMode = false;
  selectedCompetitionId: number | null = null;
  competitionForm!: FormGroup;
  searchTerm = '';
  filterStatus = '';
  filterLevel = '';

  readonly statuses = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'];
  readonly levels = ['LOCAL', 'REGIONAL', 'NATIONAL', 'INTERNATIONAL'];

  constructor(
    private competitionService: CompetitionService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCompetitions();
  }

  get isAdmin(): boolean { return this.authService.hasRole('ADMIN'); }
  get isCoachOrAdmin(): boolean { return this.authService.hasRole('ADMIN') || this.authService.hasRole('COACH'); }

  get filteredCompetitions(): Competition[] {
    return this.competitions.filter(c => {
      const matchSearch = !this.searchTerm ||
        c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (c.location ?? '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.filterStatus || c.status === this.filterStatus;
      const matchLevel = !this.filterLevel || c.level === this.filterLevel;
      return matchSearch && matchStatus && matchLevel;
    });
  }

  initForm(): void {
    this.competitionForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      location: ['', Validators.required],
      level: [''],
      maxParticipants: [null],
      status: ['UPCOMING']
    });
  }

  loadCompetitions(): void {
    this.loading = true;
    this.error = '';
    this.competitionService.getAllCompetitions().subscribe({
      next: data => { this.competitions = data; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les compétitions.'; this.loading = false; }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedCompetitionId = null;
    this.competitionForm.reset({ status: 'UPCOMING' });
    this.showModal = true;
  }

  openEditModal(competition: Competition): void {
    this.isEditMode = true;
    this.selectedCompetitionId = competition.id!;
    this.competitionForm.patchValue({
      name: competition.name,
      description: competition.description,
      startDate: competition.startDate ? competition.startDate.substring(0, 16) : '',
      endDate: competition.endDate ? competition.endDate.substring(0, 16) : '',
      location: competition.location,
      level: competition.level,
      maxParticipants: competition.maxParticipants,
      status: competition.status
    });
    this.showModal = true;
  }

  onSubmit(): void {
    if (this.competitionForm.invalid) return;
    const payload: Competition = this.competitionForm.value;
    if (this.isEditMode && this.selectedCompetitionId != null) {
      this.competitionService.updateCompetition(this.selectedCompetitionId, payload).subscribe({
        next: () => { this.closeModal(); this.loadCompetitions(); },
        error: () => { this.error = 'Erreur lors de la mise à jour.'; }
      });
    } else {
      this.competitionService.createCompetition(payload).subscribe({
        next: () => { this.closeModal(); this.loadCompetitions(); },
        error: () => { this.error = 'Erreur lors de la création.'; }
      });
    }
  }

  onDeleteCompetition(id: number): void {
    if (!confirm('Supprimer cette compétition ?')) return;
    this.competitionService.deleteCompetition(id).subscribe({
      next: () => this.loadCompetitions(),
      error: () => { this.error = 'Erreur lors de la suppression.'; }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.competitionForm.reset({ status: 'UPCOMING' });
    this.error = '';
  }

  formatDate(dt: string | undefined): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('fr-FR', { dateStyle: 'short' });
  }

  statusClass(status: string | undefined): string {
    switch (status) {
      case 'UPCOMING': return 'bg-blue-100 text-blue-700';
      case 'ONGOING': return 'bg-emerald-100 text-emerald-700';
      case 'COMPLETED': return 'bg-slate-100 text-slate-600';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  }
}
