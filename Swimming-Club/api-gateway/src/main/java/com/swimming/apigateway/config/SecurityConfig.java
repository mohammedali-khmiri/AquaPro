package com.swimming.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    // 🌟 CHAÎNE 1 : SÉCURITÉ POUR LES ROUTES PUBLIQUES (Priorité Haute)
    // Elle ignore complètement Keycloak et l'analyse du Token pour le Scraper
    @Order(1)
    @Bean
    public SecurityWebFilterChain publicSecurityFilterChain(ServerHttpSecurity http) {
        http
                .csrf(csrf -> csrf.disable())
                .securityMatcher(exchange -> {
                    String path = exchange.getRequest().getURI().getPath();
                    // 🌟 LA CORRECTION ICI : On ajoute tes routes pour qu'elles bypassent Keycloak sur la Gateway
                    if (path.startsWith("/api/scrape") ||
                            path.startsWith("/api/data") ||
                            path.startsWith("/actuator") ||
                            path.startsWith("/api/auth") ||
                            path.startsWith("/api/sessions") ||
                            path.startsWith("/api/competitions") ||
                            path.startsWith("/api/ai") ||
                            path.startsWith("/api/pools") ||
                            path.startsWith("/api/coaches")) {
                        return ServerWebExchangeMatcher.MatchResult.match();
                    }
                    return ServerWebExchangeMatcher.MatchResult.notMatch();
                })
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges.anyExchange().permitAll());
        return http.build();
    }

    // 🌟 CHAÎNE 2 : SÉCURITÉ POUR LES ROUTES PROTÉGÉES (Par défaut)
    // Elle s'applique à tout le reste (Swimmers, Séances, Compétitions)
    @Order(2)
    @Bean
    public SecurityWebFilterChain securedSecurityFilterChain(ServerHttpSecurity http) {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}));
        return http.build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        NimbusReactiveJwtDecoder jwtDecoder = NimbusReactiveJwtDecoder
                .withJwkSetUri("http://keycloak:8080/realms/swimming-platform/protocol/openid-connect/certs")
                .build();

        OAuth2TokenValidator<Jwt> issuerValidator =
                new JwtIssuerValidator("http://localhost:8081/realms/swimming-platform");
        OAuth2TokenValidator<Jwt> timestampValidator = new JwtTimestampValidator();

        OAuth2TokenValidator<Jwt> absoluteValidator =
                new DelegatingOAuth2TokenValidator<>(timestampValidator, issuerValidator);

        jwtDecoder.setJwtValidator(absoluteValidator);
        return jwtDecoder;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList("http://localhost", "http://localhost:4200"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}