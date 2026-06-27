package com.swimclub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // 🌟 C'est cette annotation qui va débloquer et créer le SimpMessagingTemplate !
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Active un broker simple en mémoire pour renvoyer les messages aux clients
        config.enableSimpleBroker("/topic", "/queue");

        // Préfixe pour les messages sortants du frontend vers le backend (ex: /app/chat)
        config.setApplicationDestinationPrefixes("/app");

        // Préfixe pour les files d'attente privées (utilisées pour ton chat privé)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Enregistre le point de contact que ton Angular utilise déjà
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*") // Permet les connexions depuis ton conteneur Angular
                .withSockJS(); // Active le support de repli SockJS
    }
}