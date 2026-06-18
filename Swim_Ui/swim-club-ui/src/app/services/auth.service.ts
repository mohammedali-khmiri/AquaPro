import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/auth`;
  private tokenKey = 'swimclub_jwt_token';
  private userIdKey = 'swimclub_user_id';
  private userInfoKey = 'swimclub_user_info';
  private rolesKey = 'swimclub_roles';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.userIdKey, String(response.userId));
          localStorage.setItem(this.rolesKey, JSON.stringify(response.roles || []));
          localStorage.setItem(this.userInfoKey, JSON.stringify({
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName
          }));
        }
      })
    );
  }

  register(data: {
    email: string; password: string;
    firstName: string; lastName: string; role: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data, { responseType: 'text' });
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserId(): number | null {
    const id = localStorage.getItem(this.userIdKey);
    return id ? Number(id) : null;
  }

  getUserInfo(): { email: string; firstName: string; lastName: string } | null {
    const raw = localStorage.getItem(this.userInfoKey);
    return raw ? JSON.parse(raw) : null;
  }

  getRoles(): string[] {
    const raw = localStorage.getItem(this.rolesKey);
    return raw ? JSON.parse(raw) : [];
  }

  /** Returns the primary role (ADMIN > COACH > SWIMMER), strips ROLE_ prefix */
  getRole(): string | null {
    const roles = this.getRoles().map(r => r.replace(/^ROLE_/, ''));
    if (roles.includes('ADMIN')) return 'ADMIN';
    if (roles.includes('COACH')) return 'COACH';
    if (roles.includes('SWIMMER')) return 'SWIMMER';
    return null;
  }

  getRolesNormalized(): string[] {
    return this.getRoles().map(r => r.replace(/^ROLE_/, ''));
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.userInfoKey);
    localStorage.removeItem(this.rolesKey);
  }
}
