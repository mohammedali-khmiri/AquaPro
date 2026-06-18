import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['SWIMMER', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordsMatch });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { firstName, lastName, email, password, role } = this.form.value;
    this.authService.register({ firstName, lastName, email, password, role }).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Compte créé ! Vous pouvez maintenant vous connecter.';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.error || 'Erreur lors de la création du compte.';
      }
    });
  }
}
