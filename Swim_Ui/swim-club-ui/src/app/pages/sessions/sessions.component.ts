import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SessionService } from '../../services/session.service';
import { CoachService } from '../../services/coach.service';
import { AuthService } from '../../services/auth.service';
import { TrainingSession, Coach } from '../../models';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './sessions.component.html',
  styleUrl: './sessions.component.css'
})
export class SessionsComponent implements OnInit {
  sessions: TrainingSession[] = [];
  coaches: Coach[] = [];
  loading = true;
  error = '';
  showModal = false;
  isEditMode = false;
  selectedSessionId: number | null = null;
  sessionForm!: FormGroup;
  searchTerm = '';
  filterLevel = '';
  filterStatus = '';
  minDate: string;

  readonly levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE'];

  constructor(
    private sessionService: SessionService,
    private coachService: CoachService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    const today = new Date();
    this.minDate = today.toISOString().substring(0, 16);
  }

  ngOnInit(): void {
    this.initForm();
    this.loadSessions();
    this.loadCoaches();
  }

  loadCoaches(): void {
    this.coachService.getAllCoaches().subscribe({
      next: allCoaches => {
        if (this.isAdmin) {
          this.coaches = allCoaches;
        } else if (this.authService.hasRole('COACH')) {
          const coachId = this.authService.getUserId();
          this.coaches = allCoaches.filter(c => c.id === coachId);
        }
      }
    });
  }

  get isAdmin(): boolean { return this.authService.hasRole('ADMIN'); }
  get isCoachOrAdmin(): boolean { return this.authService.hasRole('ADMIN') || this.authService.hasRole('COACH'); }

  get filteredSessions(): TrainingSession[] {
    return this.sessions.filter(s => {
      const matchSearch = !this.searchTerm ||
        s.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (s.location ?? '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (s.coachName ?? '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchLevel = !this.filterLevel || s.level === this.filterLevel;
      const matchStatus = !this.filterStatus ||
        (this.filterStatus === 'active' && !s.isCancelled) ||
        (this.filterStatus === 'cancelled' && s.isCancelled === true);
      return matchSearch && matchLevel && matchStatus;
    });
  }

  initForm(): void {
    this.sessionForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      location: ['', Validators.required],
      maxCapacity: [null, [Validators.required, Validators.min(1)]],
      level: [''],
      isCancelled: [false],
      coachId: ['', Validators.required]
    });
  }

  loadSessions(): void {
    this.loading = true;
    this.error = '';
    this.sessionService.getAllSessions().subscribe({
      next: data => { this.sessions = data; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les séances.'; this.loading = false; }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedSessionId = null;
    this.sessionForm.reset({ isCancelled: false, coachId: '' });
    if (this.authService.hasRole('COACH')) {
      this.sessionForm.patchValue({ coachId: this.authService.getUserId() });
    }
    this.showModal = true;
  }

  openEditModal(session: TrainingSession): void {
    this.isEditMode = true;
    this.selectedSessionId = session.id!;
    this.sessionForm.patchValue({
      title: session.title,
      description: session.description,
      startTime: session.startTime ? session.startTime.substring(0, 16) : '',
      endTime: session.endTime ? session.endTime.substring(0, 16) : '',
      location: session.location,
      maxCapacity: session.maxCapacity,
      level: session.level,
      isCancelled: session.isCancelled,
      coachId: session.coachId
    });
    this.showModal = true;
  }

  onSubmit(): void {
    if (this.sessionForm.invalid) return;
    const v = this.sessionForm.value;
    const payload: TrainingSession = {
      ...v,
      coachId: Number(v.coachId),
      createdBy: this.authService.getUserId() ?? undefined,
      startTime: v.startTime ? v.startTime.substring(0, 16) : v.startTime,
      endTime: v.endTime ? v.endTime.substring(0, 16) : v.endTime
    };
    if (this.isEditMode && this.selectedSessionId != null) {
      this.sessionService.updateSession(this.selectedSessionId, payload).subscribe({
        next: () => { this.closeModal(); this.loadSessions(); },
        error: (err) => { this.error = err?.error?.message ?? 'Erreur lors de la mise a jour.'; }
      });
    } else {
      this.sessionService.createSession(payload).subscribe({
        next: () => { this.closeModal(); this.loadSessions(); },
        error: (err) => { this.error = err?.error?.message ?? 'Erreur lors de la creation.'; }
      });
    }
  }

  onDeleteSession(id: number): void {
    if (!confirm('Supprimer cette séance ?')) return;
    this.sessionService.deleteSession(id).subscribe({
      next: () => this.loadSessions(),
      error: () => { this.error = 'Erreur lors de la suppression.'; }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.sessionForm.reset({ isCancelled: false });
    this.error = '';
  }

  formatDateTime(dt: string | undefined): string {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }
}
