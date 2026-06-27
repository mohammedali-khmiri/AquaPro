import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // L'URL de base pointera vers http://localhost:8082/api/users selon ta config Gateway
  private apiUrl = `${environment.apiBaseUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des utilisateurs en attente d'approbation par l'admin
   */
  getPendingUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`);
  }

  /**
   * Approuve ou rejette un utilisateur
   * @param id Identifiant de l'utilisateur
   * @param status 'APPROVED' ou 'REJECTED'
   */
  updateUserStatus(id: number, status: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/status`, { status });
  }
}
