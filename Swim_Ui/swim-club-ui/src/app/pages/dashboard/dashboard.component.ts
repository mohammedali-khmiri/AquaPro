import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { SwimmerService } from '../../services/swimmer.service';
import { CoachService } from '../../services/coach.service';
import { CompetitionService } from '../../services/competition.service';
import { AuthService } from '../../services/auth.service';
import { IotControlComponent } from '../iot-control/iot-control.component';
import { IpCameraComponent } from '../ip-camera/ip-camera.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslatePipe, IotControlComponent, IpCameraComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChildren('bar') bars!: QueryList<ElementRef>;
  @ViewChild('header') header!: ElementRef;
  @ViewChild('subtitle') subtitle!: ElementRef;
  @ViewChild('cardContainer') cardContainer!: ElementRef;

  activeSwimmersCount = 0;
  activeCoachesCount = 0;
  upcomingCompetitionsCount = 0;

  constructor(
    private swimmerService: SwimmerService,
    private coachService: CoachService,
    private compService: CompetitionService,
    private authService: AuthService,
    private router: Router
  ) {}

  get userName(): string {
    const info = this.authService.getUserInfo();
    return info ? info.firstName : 'vous';
  }

  openNewSession(): void {
    this.router.navigate(['/sessions']);
  }

  ngOnInit() {
    this.swimmerService.getAllSwimmers().subscribe(data => {
      this.activeSwimmersCount = data.filter(s => s.isActive !== false).length;
    });
    this.coachService.getAllCoaches().subscribe(data => {
      this.activeCoachesCount = data.filter(c => c.isActive !== false).length;
    });
    this.compService.getAllCompetitions().subscribe(data => {
      this.upcomingCompetitionsCount = data.filter(c => c.status === 'UPCOMING' || c.status === 'Open').length;
    });
  }

  ngAfterViewInit() {
    // Header texts
    gsap.from('h1, p', {
      y: -20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out'
    });

    // Top buttons/components
    gsap.from('button, select', {
      x: 20,
      opacity: 0,
      duration: 0.5,
      delay: 0.2,
      stagger: 0.1,
      ease: 'power2.out'
    });

    // Stagger fade-up animation for all metric cards and main grids
    gsap.from('.glass', {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.1
    });
    
    // CSS bar chart inner bars
    gsap.from('.group > div > div', {
      scaleY: 0,
      transformOrigin: "bottom center",
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'back.out(1.7)',
      delay: 0.4
    });
  }
}
