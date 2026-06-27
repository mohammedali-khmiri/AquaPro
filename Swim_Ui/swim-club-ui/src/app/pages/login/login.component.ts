import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    public layoutSvc: LayoutService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {

    }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

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
      error: (err) => {
        this.loading = false;
        if (err.error && err.error.message) {
          this.errorMsg = err.error.message;
        } else {
          this.errorMsg = 'Une erreur de connexion est survenue.';
        }
      }
    });
  }

  continueAsVisitor(): void {
    this.router.navigate(['/news']);
  }
}
