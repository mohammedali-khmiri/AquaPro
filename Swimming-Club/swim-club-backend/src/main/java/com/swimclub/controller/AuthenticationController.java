package com.swimclub.controller;

import com.swimclub.service.EmailService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import com.swimclub.entity.User;
import com.swimclub.entity.Role;
import com.swimclub.repository.UserRepository;
import com.swimclub.repository.RoleRepository;
import com.swimclub.dto.LoginRequest;
import com.swimclub.dto.LoginResponse;
import com.swimclub.dto.RegisterRequest;
import com.swimclub.service.AuthenticationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.BadCredentialsException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
public class AuthenticationController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = authenticationService.login(loginRequest);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            String errorMessage = e.getMessage();

            // 📺 Affiche l'erreur exacte dans ton terminal Docker pour comprendre ce qui bloque
            System.out.println("🔴 [LOGIN ERROR SYSTEM] : " + errorMessage);

            // ❌ 1. Mauvais mot de passe OU Email inconnu
            if (errorMessage != null && (
                    errorMessage.contains("PASSWORD_OR_EMAIL_INVALID") ||
                            errorMessage.contains("Email ou mot de passe incorrect") ||
                            errorMessage.toLowerCase().contains("bad credentials"))) {

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(java.util.Map.of("message", "Email ou mot de passe incorrect."));
            }

            //  Si l'erreur contient le code du Mail
            if (errorMessage != null && errorMessage.contains("MAIL_NOT_VERIFIED")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(java.util.Map.of("message", "Votre compte n'est pas encore activé. Veuillez vérifier votre boîte e-mail pour valider votre inscription."));
            }

            // Si l'erreur contient le code de l'Admin
            if (errorMessage != null && errorMessage.contains("ADMIN_NOT_APPROVED")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(java.util.Map.of("message", "Votre compte est inactif. Veuillez contacter votre administrateur pour approuver votre compte."));
            }


            // Cas de secours général
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("message", "Une erreur de connexion est survenue."));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<Void> verifyAccount(@RequestParam("token") String token) {
        java.util.Optional<User> userOptional = userRepository.findByVerificationToken(token);

        if (userOptional.isEmpty()) {
            // Redirection vers une page d'erreur Angular si le token est faux
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", "http://localhost/login?error=invalid_token")
                    .build();
        }

        User user = userOptional.get();
        user.setEnabled(true);
        user.setVerificationToken(null);
        userRepository.save(user);

        // REDIRECTION : On envoie l'utilisateur vers le login Angular avec le statut d'attente admin
        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", "http://localhost/login?status=pending_admin")
                .build();
    }

    // 🌟 CORRECTION : Réintégration de l'annotation POST et de la capture du Body JSON
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            // 1. Vérification doublon email
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Cet e-mail est déjà utilisé.");
            }

            // 2. Création de l'entité Utilisateur
            User user = new User();
            user.setFirstName(registerRequest.getFirstName());
            user.setLastName(registerRequest.getLastName());
            user.setEmail(registerRequest.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setEnabled(false); // Verrouillé par défaut
            user.setIsActive(false); // Bloqué tant que l'admin n'a pas approuvé

            // SÉCURITÉ : Récupérer et valider le rôle envoyé par Angular
            String requestedRole = registerRequest.getRole();

            // On bloque les petits malins qui tenteraient de forcer le rôle ADMIN via Postman
            if ("ADMIN".equalsIgnoreCase(requestedRole)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(java.util.Map.of("message", "Action interdite : Impossible de créer un compte Administrateur."));
            }

            // Chercher le rôle correspondant en BDD (ex: "SWIMMER" ou "COACH")
            com.swimclub.entity.Role userRole = roleRepository.findByName(requestedRole)
                    .orElseThrow(() -> new RuntimeException("Erreur : Le rôle " + requestedRole + " n'existe pas en base de données."));

            if (user.getRoles() == null) {
                user.setRoles(new java.util.HashSet<>());
            }
            user.getRoles().add(userRole);

            // Génération du Token unique (UUID)
            String token = UUID.randomUUID().toString();
            user.setVerificationToken(token);

            // Sauvegarde dans PostgreSQL
            userRepository.save(user);

            // Envoi du vrai e-mail via le SMTP de Google
            try {
                emailService.sendVerificationEmail(user.getEmail(), token);
            } catch (Exception e) {
                // On affiche l'erreur dans la console Docker pour le débug, sans bloquer la transaction
                System.err.println("🔴 Erreur d'envoi Gmail : " + e.getMessage());
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(java.util.Map.of("message", "Veuillez vérifier votre compte sur votre boîte mail pour vous connecter."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Registration failed: " + e.getMessage());
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestParam Long userId,
            @RequestParam String oldPassword,
            @RequestParam String newPassword) {
        try {
            authenticationService.changePassword(userId, oldPassword, newPassword);
            return ResponseEntity.ok("Password changed successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: " + e.getMessage());
        }
    }
}