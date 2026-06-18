import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../services/ai.service';

interface Message {
  role: 'user' | 'assistant'; // Aligné sur votre HTML (msg.role)
  content: string;             // Aligné sur votre HTML (msg.content)
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewChecked {
  userInput: string = '';
  isLoading: boolean = false;

  // Historique initial avec votre assistant
  messages: Message[] = [
    {
      role: 'assistant',
      content: "Bonjour ! Je suis l'assistant intelligent d'AquaPro. Posez-moi vos questions sur les piscines, les nageurs ou les entraînements !",
      timestamp: new Date()
    }
  ];

  // 🌟 Récupération de votre identifiant HTML #chatContainer pour l'auto-scroll
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(private aiService: AiService) {}

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

  // 🌟 Votre méthode renommée pour correspondre au (click) et (keyup.enter) de votre UI
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
        // Fin de la génération, on cache l'animation des 3 petits points (animate-bounce)
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
