import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';
import { AuthService } from '../../services/auth.service'; // 🌟 AJOUT : Importation de ton service d'authentification

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  userInput: string = '';
  isLoading: boolean = false;
  membersList: any[] = []; // 🌟 AJOUT : Pour éviter les crashs HTML si connecté

  // Historique initial avec ton assistant
  messages: Message[] = [
    {
      role: 'assistant',
      content: "Bonjour ! Je suis l'assistant intelligent d'AquaPro. Posez-moi vos questions sur les piscines, les nageurs ou les entraînements !",
      timestamp: new Date()
    }
  ];

  // Récupération de l'identifiant HTML #chatContainer pour l'auto-scroll
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  // 🌟 MODIFICATION : Injection de l'AuthService en PUBLIC pour le template HTML
  constructor(
    private aiService: AiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // 🌟 AJOUT : Si l'utilisateur est connecté, on peut charger les membres du club
    if (this.authService.isLoggedIn()) {
      this.loadClubMembers();
    }
  }

  loadClubMembers(): void {
    // Ici, tu pourras appeler un service (ex: SwimmerService) pour alimenter ta liste de membres
    // Exemple temporaire : this.membersList = [{ firstName: 'Jean', lastName: 'Dupont' }];
  }

  // Force le défilement vers le bas dès qu'un nouveau mot s'affiche
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {
      // Évite de bloquer l'application si l'élément n'est pas encore rendu
    }
  }

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const userMsg = this.userInput;

    // 1. On pousse le message de l'utilisateur
    this.messages.push({
      role: 'user',
      content: userMsg,
      timestamp: new Date()
    });

    this.userInput = '';
    this.isLoading = true;

    // 2. On prépare la bulle de l'assistant qui va se remplir mot par mot
    const aiMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    this.messages.push(aiMessage);

    // 3. Connexion au flux Ollama
    this.aiService.streamAIResponse(
      userMsg,
      (chunk) => {
        // Dès qu'un mot arrive, on l'ajoute en direct à l'écran
        aiMessage.content += chunk;
      },
      () => {
        // Fin de la génération, on cache l'animation des 3 petits points
        this.isLoading = false;
      },
      (error) => {
        console.error("Erreur streaming:", error);
        aiMessage.content = "Désolé, je rencontre des difficultés à formuler une réponse. Vérifiez Docker.";
        this.isLoading = false;
      }
    );
  }
}
