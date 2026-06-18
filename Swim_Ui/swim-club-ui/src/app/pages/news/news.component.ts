import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScraperService } from '../../services/scraper.service'; // Ajuste le chemin si nécessaire

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news.component.html',
  styleUrls: []
})
export class NewsComponent implements OnInit {
  posts: any[] = [];
  clubs: any[] = [];
  isLoadingPosts: boolean = true;
  isLoadingClubs: boolean = true;
  isScraping: boolean = false;

  constructor(private scraperService: ScraperService) {}

  ngOnInit(): void {
    this.loadFederationData();
  }

  loadFederationData() {
    this.isLoadingPosts = true;
    this.isLoadingClubs = true;

    // 1. Chargement des articles
    this.scraperService.getCollectionData('posts', 6).subscribe({
      next: (response) => {
        this.posts = response.data;
        this.isLoadingPosts = false;
      },
      error: (err) => {
        console.error('Erreur récupération posts:', err);
        this.isLoadingPosts = false;
      }
    });

    // 2. Chargement des clubs
    this.scraperService.getCollectionData('clubs', 5).subscribe({
      next: (response) => {
        this.clubs = response.data;
        this.isLoadingClubs = false;
      },
      error: (err) => {
        console.error('Erreur récupération clubs:', err);
        this.isLoadingClubs = false;
      }
    });
  }

  triggerSync() {
    this.isScraping = true;
    this.scraperService.startScraper().subscribe({
      next: (res) => {
        alert("🤖 Le robot vient de démarrer la synchronisation avec la FTN Natation en arrière-plan !");
        this.isScraping = false;
      },
      error: (err) => {
        console.error('Erreur lancement scraper:', err);
        this.isScraping = false;
      }
    });
  }
}
