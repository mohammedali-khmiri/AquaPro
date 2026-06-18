package com.swimclub.service;

import com.swimclub.dto.CoachDTO;
import com.swimclub.dto.CreateCoachRequest;
import com.swimclub.entity.Coach;
import com.swimclub.entity.Role;
import com.swimclub.entity.User;
import com.swimclub.repository.CoachRepository;
import com.swimclub.repository.RoleRepository;
import com.swimclub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class CoachService {

    @Autowired
    private CoachRepository coachRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // CREATE
    public CoachDTO createCoach(CoachDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Coach coach = new Coach();
        mapDTOToEntity(dto, coach, user);

        Coach savedCoach = coachRepository.save(coach);
        return mapEntityToDTO(savedCoach);
    }

    // CREATE with user creation in one transaction
    public CoachDTO createCoachWithUser(CreateCoachRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email deja utilise: " + request.getEmail());
        }

        Role coachRole = roleRepository.findByName("COACH")
                .orElseThrow(() -> new RuntimeException("Role COACH not found"));

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setIsActive(true);
        Set<Role> roles = new HashSet<>();
        roles.add(coachRole);
        user.setRoles(roles);
        User savedUser = userRepository.save(user);

        Coach coach = new Coach();
        coach.setSpecialization(request.getSpecialization());
        coach.setCertificationNumber(request.getCertificationNumber());
        coach.setBio(request.getBio());
        coach.setExperience(request.getExperience());
        coach.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        coach.setUser(savedUser);

        return mapEntityToDTO(coachRepository.save(coach));
    }

    // READ
    public CoachDTO getCoachById(Long id) {
        Coach coach = coachRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coach not found with id: " + id));
        return mapEntityToDTO(coach);
    }

    public CoachDTO getCoachByUserId(Long userId) {
        Coach coach = coachRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Coach not found for user id: " + userId));
        return mapEntityToDTO(coach);
    }

    public List<CoachDTO> getAllCoaches() {
        return coachRepository.findAll()
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<CoachDTO> getActiveCoaches() {
        return coachRepository.findByIsActiveTrue()
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<CoachDTO> search(String q) {
        if (q == null || q.isBlank()) return getAllCoaches();
        return coachRepository.search(q.trim())
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<CoachDTO> getBySpecialization(String specialization) {
        return coachRepository.findBySpecialization(specialization)
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    // UPDATE
    public CoachDTO updateCoach(Long id, CoachDTO dto) {
        Coach coach = coachRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coach not found with id: " + id));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        mapDTOToEntity(dto, coach, user);
        Coach updatedCoach = coachRepository.save(coach);

        return mapEntityToDTO(updatedCoach);
    }

    // DELETE
    public void deleteCoach(Long id) {
        Coach coach = coachRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coach not found with id: " + id));

        coachRepository.delete(coach);
    }

    // Helper methods
    private CoachDTO mapEntityToDTO(Coach coach) {
        return CoachDTO.builder()
                .id(coach.getId())
                .specialization(coach.getSpecialization())
                .certificationNumber(coach.getCertificationNumber())
                .bio(coach.getBio())
                .experience(coach.getExperience())
                .isActive(coach.getIsActive())
                .userId(coach.getUser().getId())
                .userFirstName(coach.getUser().getFirstName())
                .userLastName(coach.getUser().getLastName())
                .userEmail(coach.getUser().getEmail())
                .build();
    }

    private void mapDTOToEntity(CoachDTO dto, Coach coach, User user) {
        coach.setSpecialization(dto.getSpecialization());
        coach.setCertificationNumber(dto.getCertificationNumber());
        coach.setBio(dto.getBio());
        coach.setExperience(dto.getExperience());
        if (dto.getIsActive() != null) {
            coach.setIsActive(dto.getIsActive());
        }
        coach.setUser(user);
    }
}
