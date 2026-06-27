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
  form!: FormGroup;
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
    if (this.form.invalid) {
      // 🌟 LA MAGIE ICI : Si le formulaire est invalide, on marque tous les champs comme "touched".
      // Cela va instantanément forcer l'affichage du check rouge sur l'e-mail mal écrit !
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    this.successMsg = ''; // On nettoie les anciens messages de succès au cas où

    const { firstName, lastName, email, password, role } = this.form.value;

    this.authService.register({ firstName, lastName, email, password, role }).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.errorMsg = '';
        this.successMsg = "Inscription réussie ! Veuillez vérifier votre boîte e-mail pour activer votre compte.";

        this.form.reset();

        setTimeout(() => this.router.navigate(['/login']), 5000);
      },
      error: (err) => {
        // 🌟 CORRECTION DU BUG : On repasse loading à false ici aussi !
        // Sinon, en cas d'erreur, le bouton reste bloqué en mode "chargement".
        this.loading = false;
        this.successMsg = '';

        // 🌟 AMÉLIORATION : On extrait le vrai message d'erreur du backend s'il existe
        // (ex: "Cet e-mail est déjà utilisé"), sinon on met le message générique.
        this.errorMsg = err.error?.message || "Une erreur est survenue lors de l'inscription.";
      }
    });
  }
}
