import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public layoutSvc: LayoutService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { email, password } = this.form.value;
    this.authService.login(email, password).subscribe({
      next: () => {
        this.loading = false;
        const role = this.authService.getRole();
        if (role === 'SWIMMER') {
          this.router.navigate(['/sessions']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Email ou mot de passe incorrect.';
      }
    });
  }

  continueAsVisitor(): void {
    this.router.navigate(['/news']);
  }
}
