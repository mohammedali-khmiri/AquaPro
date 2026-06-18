package com.swimclub.controller;

import com.swimclub.service.AiContextService; // 🌟 Import du service
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
@RequiredArgsConstructor
public class ChatController {

    private final OllamaChatModel chatModel;
    private final AiContextService aiContextService; // 🌟 Injection du chercheur Mongo

    @GetMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> generateChatStream(@RequestParam(value = "message") String message) {
        try {
            // 1. On extrait les connaissances de MongoDB par rapport à la question
            String mongoContext = aiContextService.searchFederationContext(message);

            // 2. On fabrique un prompt enrichi (RAG) ultra puissant
            String systemInstructions =
                    "Tu es l'assistant IA officiel de l'application de natation AquaPro.\n" +
                            "En utilisant UNIQUEMENT les connaissances extraites de la Fédération Tunisienne ci-dessous, réponds à l'utilisateur.\n" +
                            "Si les connaissances sont vides ou ne contiennent pas la réponse, utilise tes connaissances générales pour l'aider poliment.\n\n" +
                            "CONNAISSANCES DE LA BASE DE DONNÉES MONGO :\n" +
                            "=========================================\n" +
                            (mongoContext.isEmpty() ? "Aucune donnée spécifique trouvée." : mongoContext) + "\n" +
                            "=========================================\n\n" +
                            "QUESTION DE L'UTILISATEUR : " + message + "\n" +
                            "RÉPONSE (en français fluide) :";

            // 3. On envoie le tout au flux de Llama3
            return chatModel.stream(systemInstructions);

        } catch (Exception e) {
            return Flux.just("Erreur système IA : " + e.getMessage());
        }
    }
}