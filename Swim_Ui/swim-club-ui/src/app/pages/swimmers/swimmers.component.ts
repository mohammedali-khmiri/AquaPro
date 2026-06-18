import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { SwimmerService } from '../../services/swimmer.service';
import { AuthService } from '../../services/auth.service';
import { Swimmer } from '../../models';

@Component({
  selector: 'app-swimmers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './swimmers.component.html',
  styleUrl: './swimmers.component.css'
})
export class SwimmersComponent implements OnInit {
  swimmers: Swimmer[] = [];
  loading = true;
  error = '';
  
  showModal = false;
  isEditMode = false;
  selectedSwimmerId: number | null = null;
  swimmerForm!: FormGroup;

  // QR code modal
  qrSwimmer: Swimmer | null = null;
  showQrModal = false;
  qrDataUrl: string | null = null;

  // Search & Filter controls
  searchTerm = '';
  filterLevel = 'ALL';
  filterStatus = 'ALL';

  constructor(
    private swimmerService: SwimmerService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadSwimmers();
  }

  initForm(): void {
    this.swimmerForm = this.fb.group({
      userFirstName: ['', Validators.required],
      userLastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      registrationNumber: ['', Validators.required],
      level: ['BEGINNER', Validators.required],
      category: ['TEENAGER', Validators.required],
      dateOfBirth: ['2005-01-01', Validators.required],
      isActive: [true],
      userId: [null]
    });
  }

  loadSwimmers(): void {
    this.loading = true;
    this.swimmerService.getAllSwimmers().subscribe({
      next: (data) => {
        this.swimmers = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load swimmers';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // Live filter computed property
  get filteredSwimmers(): Swimmer[] {
    return this.swimmers.filter(swimmer => {
      // 1. Text Search (FirstName, LastName, Email, RegistrationNumber)
      const query = this.searchTerm.toLowerCase().trim();
      const matchesSearch = !query || 
        (swimmer.userFirstName?.toLowerCase().includes(query)) ||
        (swimmer.userLastName?.toLowerCase().includes(query)) ||
        (swimmer.email?.toLowerCase().includes(query)) ||
        (swimmer.registrationNumber?.toLowerCase().includes(query));

      // 2. Squad / Level filter
      const matchesLevel = this.filterLevel === 'ALL' || swimmer.level === this.filterLevel;

      // 3. Status filter
      let matchesStatus = true;
      if (this.filterStatus === 'ACTIVE') {
        matchesStatus = swimmer.isActive === true;
      } else if (this.filterStatus === 'INACTIVE') {
        matchesStatus = swimmer.isActive === false;
      }

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedSwimmerId = null;
    this.showModal = true;
    this.swimmerForm.reset({
      userFirstName: '',
      userLastName: '',
      email: '',
      password: '',
      registrationNumber: '',
      level: 'BEGINNER',
      category: 'TEENAGER',
      isActive: true,
      userId: null,
      dateOfBirth: '2005-01-01'
    });
    this.swimmerForm.get('password')!.setValidators(Validators.required);
    this.swimmerForm.get('password')!.updateValueAndValidity();
  }

  openEditModal(swimmer: Swimmer): void {
    this.isEditMode = true;
    this.selectedSwimmerId = swimmer.id || null;
    this.showModal = true;
    this.swimmerForm.get('password')!.clearValidators();
    this.swimmerForm.get('password')!.updateValueAndValidity();
    this.swimmerForm.patchValue({
      userFirstName: swimmer.userFirstName,
      userLastName: swimmer.userLastName,
      email: swimmer.email,
      password: '',
      registrationNumber: swimmer.registrationNumber,
      level: swimmer.level,
      category: swimmer.category,
      dateOfBirth: swimmer.dateOfBirth ? swimmer.dateOfBirth.substring(0, 10) : '2005-01-01',
      isActive: swimmer.isActive,
      userId: swimmer.userId || null
    });
  }

  closeModal(): void {
    this.showModal = false;
  }

  openQrCode(swimmer: Swimmer): void {
    console.log('[QR] Swimmer:', swimmer.id, swimmer.userFirstName, swimmer.userLastName, 'userId:', swimmer.userId);
    this.qrSwimmer = swimmer;
    this.qrDataUrl = null;
    this.showQrModal = true;
    // Generate QR off-screen and store as data URL — no DOM timing issues
    const win = window as any;
    if (!win.QRCode) return;
    const offscreen = document.createElement('div');
    offscreen.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
    document.body.appendChild(offscreen);
    new win.QRCode(offscreen, {
      text: `SWIMMER:${swimmer.id}:${swimmer.userFirstName} ${swimmer.userLastName}:${swimmer.registrationNumber || ''}`,
      width: 220,
      height: 220,
      colorDark: '#0c4a6e',
      colorLight: '#ffffff',
      correctLevel: win.QRCode.CorrectLevel.H
    });
    // QRCode renders synchronously into a canvas — extract data URL immediately
    setTimeout(() => {
      const canvas = offscreen.querySelector('canvas');
      if (canvas) { this.qrDataUrl = canvas.toDataURL('image/png'); }
      document.body.removeChild(offscreen);
    }, 100);
  }

  closeQrModal(): void {
    this.showQrModal = false;
    this.qrSwimmer = null;
    this.qrDataUrl = null;
  }

  downloadQrCode(): void {
    if (!this.qrDataUrl) return;
    const link = document.createElement('a');
    const name = `${this.qrSwimmer?.userFirstName || 'swimmer'}_${this.qrSwimmer?.userLastName || ''}`.replace(/\s+/g, '_');
    link.download = `QR_${name}.png`;
    link.href = this.qrDataUrl;
    link.click();
  }

  onDeleteSwimmer(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce nageur ? Cette action est irréversible.')) {
      this.swimmerService.deleteSwimmer(id).subscribe({
        next: () => {
          // Remove from local array
          this.swimmers = this.swimmers.filter(s => s.id !== id);
        },
        error: (err) => {
          console.error('Error deleting swimmer', err);
          alert('Erreur lors de la suppression du nageur. Vérifiez vos autorisations de Coach.');
        }
      });
    }
  }

  onSubmit(): void {
    if (this.swimmerForm.invalid) {
      return;
    }

    const formData = this.swimmerForm.value;

    if (this.isEditMode && this.selectedSwimmerId !== null) {
      // Edit / Update mode
      const updatedSwimmer: Swimmer = {
        id: this.selectedSwimmerId,
        ...formData
      };

      this.swimmerService.updateSwimmer(this.selectedSwimmerId, updatedSwimmer).subscribe({
        next: (response) => {
          // Update in local list
          const index = this.swimmers.findIndex(s => s.id === this.selectedSwimmerId);
          if (index !== -1) {
            this.swimmers[index] = response;
          }
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating swimmer', err);
          alert('Erreur lors de la modification du nageur.');
        }
      });
    } else {
      // Create mode — create user account + swimmer in one call
      const payload = {
        firstName: formData.userFirstName,
        lastName: formData.userLastName,
        email: formData.email,
        password: formData.password,
        registrationNumber: formData.registrationNumber,
        level: formData.level,
        category: formData.category,
        dateOfBirth: formData.dateOfBirth,
        isActive: formData.isActive
      };

      this.swimmerService.createSwimmerWithUser(payload).subscribe({
        next: (created) => {
          this.swimmers.push(created);
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating swimmer', err);
          alert('Erreur : ' + (err.error?.message || err.error || 'Impossible de créer le nageur.'));
        }
      });
    }
  }
}
