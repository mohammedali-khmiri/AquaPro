import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private apiUrl = `${environment.apiBaseUrl}/ai/chat`;

  constructor() {}

  // Cette méthode va lire le flux de texte mot par mot
  streamAIResponse(message: string, onChunk: (text: string) => void, onComplete: () => void, onError: (err: any) => void) {
    const token = localStorage.getItem('token'); // Récupère le token si la route est sécurisée
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(`${this.apiUrl}?message=${encodeURIComponent(message)}`, {
      method: 'GET',
      headers: headers
    })
    .then(response => {
      if (!response.ok) throw new Error('Échec de la connexion au moteur IA');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Impossible de lire le flux de données');

      const readChunk = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            onComplete();
            return;
          }

          // Décode le morceau de texte reçu
          const rawChunk = decoder.decode(value, { stream: true });

          // Le protocole SSE envoie les données sous la forme "data:MonTexte\n\n"
          const lines = rawChunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const content = line.substring(5);
              onChunk(content); // Envoie le mot au composant
            }
          }

          readChunk(); // Lit le morceau suivant
        }).catch(onError);
      };

      readChunk();
    })
    .catch(onError);
  }
}
