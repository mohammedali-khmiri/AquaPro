import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Swimmer } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SwimmerService {
  private apiUrl = `${environment.apiBaseUrl}/swimmers`;

  constructor(private http: HttpClient) { }

  getAllSwimmers(): Observable<Swimmer[]> {
    return this.http.get<Swimmer[]>(this.apiUrl);
  }

  getSwimmerById(id: number): Observable<Swimmer> {
    return this.http.get<Swimmer>(`${this.apiUrl}/${id}`);
  }

  getSwimmersByUserId(userId: number): Observable<Swimmer[]> {
    return this.http.get<Swimmer[]>(`${this.apiUrl}/user/${userId}`);
  }

  createSwimmer(swimmer: Swimmer): Observable<Swimmer> {
    return this.http.post<Swimmer>(this.apiUrl, swimmer);
  }

  createSwimmerWithUser(payload: any): Observable<Swimmer> {
    return this.http.post<Swimmer>(`${this.apiUrl}/with-user`, payload);
  }

  updateSwimmer(id: number, swimmer: Swimmer): Observable<Swimmer> {
    return this.http.put<Swimmer>(`${this.apiUrl}/${id}`, swimmer);
  }

  deleteSwimmer(id: number): Observable<void> {
    return this.http.delete<void>(`${`${this.apiUrl}/${id}`}`);
  }
}
