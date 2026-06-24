package com.swimclub.service;

import com.swimclub.dto.LoginRequest;
import com.swimclub.dto.LoginResponse;
import com.swimclub.dto.RegisterRequest;
import com.swimclub.entity.Role;
import com.swimclub.entity.User;
import com.swimclub.repository.RoleRepository;
import com.swimclub.repository.UserRepository;
import com.swimclub.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class AuthenticationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public LoginResponse login(LoginRequest loginRequest) {
        // 1. Authentification standard (Vérification email/password)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 2. Récupération du profil complet depuis PostgreSQL
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // SÉCURITÉ GMAIL : Blocage si le compte n'est pas encore "enabled"
        if (!user.isEnabled()) {
            throw new RuntimeException("Votre compte n'est pas encore activé. Veuillez vérifier votre boîte e-mail pour valider votre inscription.");
        }

        // 3. Génération du Token JWT si le compte est actif
        String token = jwtTokenProvider.generateToken(authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.User
                ? (org.springframework.security.core.userdetails.User) authentication.getPrincipal()
                : org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password("")
                .authorities(new java.util.ArrayList<>())
                .build());

        java.util.List<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName())
                .collect(java.util.stream.Collectors.toList());

        // 4. Retour de la réponse complète au Frontend Angular
        return LoginResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(roleNames)
                .build();
    }

    public void register(RegisterRequest registerRequest) {
        // Check if user already exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setPhoneNumber(registerRequest.getPhoneNumber());
        user.setAddress(registerRequest.getAddress());
        user.setIsActive(true);

        // Determine role — ADMIN cannot be self-registered for security
        String requestedRole = registerRequest.getRole();
        final String roleName = "COACH".equalsIgnoreCase(requestedRole) ? "COACH" : "SWIMMER";

        Role assignedRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        Set<Role> roles = new HashSet<>();
        roles.add(assignedRole);
        user.setRoles(roles);

        userRepository.save(user);
    }

    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
