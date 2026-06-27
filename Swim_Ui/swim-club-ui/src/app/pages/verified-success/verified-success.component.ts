import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verified-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verified-success.component.html'
})
export class VerifiedSuccessComponent implements OnInit {
  countdown = 5;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Compte à rebours avant redirection automatique
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) {
        clearInterval(interval);
        this.router.navigate(['/login'], { queryParams: { status: 'pending_admin' } });
      }
    }, 1000);
  }
}
