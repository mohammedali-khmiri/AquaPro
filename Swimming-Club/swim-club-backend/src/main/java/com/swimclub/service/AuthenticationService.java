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
import org.springframework.security.authentication.BadCredentialsException;

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

        // 1. On récupère d'abord l'utilisateur en BDD
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("PASSWORD_OR_EMAIL_INVALID")); // 🌟 Changé en RuntimeException

        // 2. PRIORITÉ ABSOLUE : Vérification du mot de passe (Sécurisée contre les crashs BCrypt)
        boolean passwordMatches = false;
        try {
            passwordMatches = passwordEncoder.matches(loginRequest.getPassword(), user.getPassword());
        } catch (Exception e) {
            // Si le mot de passe en BDD n'est pas encodé (texte brut), on évite le crash système
            passwordMatches = false;
        }

        if (!passwordMatches) {
            throw new RuntimeException("PASSWORD_OR_EMAIL_INVALID");
        }

        // 2. ✉️ CHECK 1 (Prioritaire) : On teste le mail en premier
        if (!user.isEnabled()) {
            throw new RuntimeException("MAIL_NOT_VERIFIED");
        }

        // 3. 👑 CHECK 2 : Si le mail est OK, on vérifie l'approbation de l'admin
        if (!user.getIsActive()) {
            throw new RuntimeException("ADMIN_NOT_APPROVED");
        }

        // 4. 🔑 SEULEMENT ICI : Si les deux verrous manuels sont passés, on vérifie le mot de passe
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        // 5. Génération du Token JWT si tout est au vert
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
