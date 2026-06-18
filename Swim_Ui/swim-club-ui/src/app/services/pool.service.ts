import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Pool {
  id?: string;
  name: string;
  location: string;
  dimensions: string;
  lanes: number;
  status: string;
  iconColor: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PoolService {
  private apiUrl = `${environment.apiBaseUrl}/pools`;

  constructor(private http: HttpClient) {}

getPools(): Observable<Pool[]> {
  // 🌟 On ajoute ?t=[timestamp] pour détruire le cache du navigateur et du Service Worker
  const cacheBusterUrl = `${this.apiUrl}?t=${new Date().getTime()}`;

  return this.http.get<Pool[]>(cacheBusterUrl);
}

  addPool(pool: Pool): Observable<Pool> {
    return this.http.post<Pool>(this.apiUrl, pool);
  }

  updatePool(id: string, pool: Pool): Observable<Pool> {
    return this.http.put<Pool>(`${this.apiUrl}/${id}`, pool);
  }

  deletePool(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
