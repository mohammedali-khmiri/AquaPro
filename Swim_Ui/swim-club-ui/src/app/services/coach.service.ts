import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Coach } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CoachService {
  private apiUrl = `${environment.apiBaseUrl}/coaches`;

  constructor(private http: HttpClient) { }

  getAllCoaches(): Observable<Coach[]> {
    return this.http.get<Coach[]>(this.apiUrl);
  }

  getActiveCoaches(): Observable<Coach[]> {
    return this.http.get<Coach[]>(`${this.apiUrl}/active`);
  }

  getCoachById(id: number): Observable<Coach> {
    return this.http.get<Coach>(`${this.apiUrl}/${id}`);
  }

  getCoachByUserId(userId: number): Observable<Coach> {
    return this.http.get<Coach>(`${this.apiUrl}/user/${userId}`);
  }

  searchCoaches(q: string): Observable<Coach[]> {
    return this.http.get<Coach[]>(`${this.apiUrl}/search`, { params: { q } });
  }

  createCoach(coach: Coach): Observable<Coach> {
    return this.http.post<Coach>(this.apiUrl, coach);
  }

  createCoachWithUser(payload: any): Observable<Coach> {
    return this.http.post<Coach>(`${this.apiUrl}/with-user`, payload);
  }

  updateCoach(id: number, coach: Partial<Coach>): Observable<Coach> {
    return this.http.put<Coach>(`${this.apiUrl}/${id}`, coach);
  }

  deleteCoach(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

