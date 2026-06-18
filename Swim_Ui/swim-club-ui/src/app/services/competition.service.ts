import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Competition } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompetitionService {
  private apiUrl = `${environment.apiBaseUrl}/competitions`;

  constructor(private http: HttpClient) { }

  getAllCompetitions(): Observable<Competition[]> {
    return this.http.get<Competition[]>(this.apiUrl);
  }

  getCompetitionById(id: number): Observable<Competition> {
    return this.http.get<Competition>(`${this.apiUrl}/${id}`);
  }

  getCompetitionsByStatus(status: string): Observable<Competition[]> {
    return this.http.get<Competition[]>(`${this.apiUrl}/status/${status}`);
  }

  searchCompetitions(q: string): Observable<Competition[]> {
    return this.http.get<Competition[]>(`${this.apiUrl}/search`, { params: { q } });
  }

  createCompetition(competition: Competition): Observable<Competition> {
    return this.http.post<Competition>(this.apiUrl, competition);
  }

  updateCompetition(id: number, competition: Partial<Competition>): Observable<Competition> {
    return this.http.put<Competition>(`${this.apiUrl}/${id}`, competition);
  }

  deleteCompetition(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addSwimmerToCompetition(competitionId: number, swimmerId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${competitionId}/swimmers/${swimmerId}`, {});
  }

  removeSwimmerFromCompetition(competitionId: number, swimmerId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${competitionId}/swimmers/${swimmerId}`);
  }
}

