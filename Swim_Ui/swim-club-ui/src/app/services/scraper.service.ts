import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScraperService {
  // L'URL de votre API de scraping FastAPI
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  /**
   * Récupère les données d'une collection spécifique (posts, clubs, staff, etc.)
   * @param collectionName Nom de la collection Mongo
   * @param limit Nombre maximum de documents (défaut 10)
   */
  getCollectionData(collectionName: string, limit: number = 10): Observable<any> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<any>(`${this.apiUrl}/data/${collectionName}`, { params });
  }

  /**
   * Permet de lancer le scraper en arrière-plan depuis l'interface graphique
   */
  startScraper(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/scrape/start`, {
      skip_pdfs: false,
      ocr: false
    });
  }
}
