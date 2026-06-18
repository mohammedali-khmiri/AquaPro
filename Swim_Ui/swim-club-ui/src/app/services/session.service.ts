import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrainingSession } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = `${environment.apiBaseUrl}/sessions`;

  constructor(private http: HttpClient) { }

  getAllSessions(): Observable<TrainingSession[]> {
    return this.http.get<TrainingSession[]>(this.apiUrl);
  }

  getActiveSessions(): Observable<TrainingSession[]> {
    return this.http.get<TrainingSession[]>(`${this.apiUrl}/active`);
  }

  getSessionById(id: number): Observable<TrainingSession> {
    return this.http.get<TrainingSession>(`${this.apiUrl}/${id}`);
  }

  getSessionsByCoach(coachId: number): Observable<TrainingSession[]> {
    return this.http.get<TrainingSession[]>(`${this.apiUrl}/coach/${coachId}`);
  }

  searchSessions(q: string): Observable<TrainingSession[]> {
    return this.http.get<TrainingSession[]>(`${this.apiUrl}/search`, { params: { q } });
  }

  createSession(session: TrainingSession): Observable<TrainingSession> {
    return this.http.post<TrainingSession>(this.apiUrl, session);
  }

  updateSession(id: number, session: Partial<TrainingSession>): Observable<TrainingSession> {
    return this.http.put<TrainingSession>(`${this.apiUrl}/${id}`, session);
  }

  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  addSwimmerToSession(sessionId: number, swimmerId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${sessionId}/swimmers/${swimmerId}`, {});
  }

  removeSwimmerFromSession(sessionId: number, swimmerId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sessionId}/swimmers/${swimmerId}`);
  }
}

