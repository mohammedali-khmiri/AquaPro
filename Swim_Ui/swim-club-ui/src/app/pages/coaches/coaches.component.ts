import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CoachService } from '../../services/coach.service';
import { AuthService } from '../../services/auth.service';
import { Coach } from '../../models';

@Component({
  selector: 'app-coaches',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './coaches.component.html',
  styleUrl: './coaches.component.css'
})
export class CoachesComponent implements OnInit {
  coaches: Coach[] = [];
  loading = true;
  error = '';
  showModal = false;
  isEditMode = false;
  selectedCoachId: number | null = null;
  coachForm!: FormGroup;
  searchTerm = '';
  filterStatus = '';

  constructor(
    private coachService: CoachService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCoaches();
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMIN');
  }

  get filteredCoaches(): Coach[] {
    return this.coaches.filter(c => {
      const fullName = `${c.userFirstName ?? ''} ${c.userLastName ?? ''}`.toLowerCase();
      const matchSearch = !this.searchTerm ||
        fullName.includes(this.searchTerm.toLowerCase()) ||
        (c.userEmail ?? '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (c.specialization ?? '').toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (c.certificationNumber ?? '').toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.filterStatus ||
        (this.filterStatus === 'active' && c.isActive === true) ||
        (this.filterStatus === 'inactive' && c.isActive === false);
      return matchSearch && matchStatus;
    });
  }

  initForm(): void {
    this.coachForm = this.fb.group({
      // User fields (only used for new coach creation)
      firstName: [''],
      lastName: [''],
      email: [''],
      password: [''],
      phoneNumber: [''],
      // Coach fields
      specialization: ['', Validators.required],
      certificationNumber: ['', Validators.required],
      bio: [''],
      experience: [null, [Validators.required, Validators.min(0)]],
      isActive: [true],
      userId: [null]
    });
  }

  loadCoaches(): void {
    this.loading = true;
    this.error = '';
    this.coachService.getAllCoaches().subscribe({
      next: (data) => { this.coaches = data; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les coachs.'; this.loading = false; }
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedCoachId = null;
    this.coachForm.reset({ isActive: true });
    // Required validators for new user creation
    this.coachForm.get('firstName')!.setValidators([Validators.required]);
    this.coachForm.get('lastName')!.setValidators([Validators.required]);
    this.coachForm.get('email')!.setValidators([Validators.required, Validators.email]);
    this.coachForm.get('password')!.setValidators([Validators.required, Validators.minLength(6)]);
    this.coachForm.get('userId')!.clearValidators();
    this.coachForm.updateValueAndValidity();
    this.showModal = true;
  }

  openEditModal(coach: Coach): void {
    this.isEditMode = true;
    this.selectedCoachId = coach.id!;
    // Clear user creation validators for edit mode
    this.coachForm.get('firstName')!.clearValidators();
    this.coachForm.get('lastName')!.clearValidators();
    this.coachForm.get('email')!.clearValidators();
    this.coachForm.get('password')!.clearValidators();
    this.coachForm.get('userId')!.setValidators([Validators.required]);
    this.coachForm.patchValue({
      specialization: coach.specialization,
      certificationNumber: coach.certificationNumber,
      bio: coach.bio,
      experience: coach.experience,
      isActive: coach.isActive,
      userId: coach.userId
    });
    this.coachForm.updateValueAndValidity();
    this.showModal = true;
  }

  onSubmit(): void {
    if (this.coachForm.invalid) return;
    const v = this.coachForm.value;
    if (this.isEditMode && this.selectedCoachId != null) {
      const payload: Partial<Coach> = {
        specialization: v.specialization,
        certificationNumber: v.certificationNumber,
        bio: v.bio,
        experience: v.experience,
        isActive: v.isActive,
        userId: v.userId
      };
      this.coachService.updateCoach(this.selectedCoachId, payload as Coach).subscribe({
        next: () => { this.closeModal(); this.loadCoaches(); },
        error: (err) => { this.error = err?.error?.message ?? 'Erreur lors de la mise a jour.'; }
      });
    } else {
      const payload = {
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        password: v.password,
        phoneNumber: v.phoneNumber,
        specialization: v.specialization,
        certificationNumber: v.certificationNumber,
        bio: v.bio,
        experience: v.experience,
        isActive: v.isActive
      };
      this.coachService.createCoachWithUser(payload).subscribe({
        next: () => { this.closeModal(); this.loadCoaches(); },
        error: (err) => { this.error = err?.error?.message ?? 'Erreur lors de la creation.'; }
      });
    }
  }

  onDeleteCoach(id: number): void {
    if (!confirm('Supprimer ce coach ?')) return;
    this.coachService.deleteCoach(id).subscribe({
      next: () => this.loadCoaches(),
      error: () => { this.error = 'Erreur lors de la suppression.'; }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.coachForm.reset({ isActive: true });
    this.error = '';
  }
}
