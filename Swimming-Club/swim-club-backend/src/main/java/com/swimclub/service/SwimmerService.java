package com.swimclub.service;

import com.swimclub.dto.SwimmerDTO;
import com.swimclub.dto.CreateSwimmerRequest;
import com.swimclub.entity.Swimmer;
import com.swimclub.entity.User;
import com.swimclub.entity.Role;
import com.swimclub.repository.SwimmerRepository;
import com.swimclub.repository.UserRepository;
import com.swimclub.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.time.LocalDate;

@Service
@Transactional
public class SwimmerService {

    @Autowired
    private SwimmerRepository swimmerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // CREATE
    public SwimmerDTO createSwimmer(SwimmerDTO dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Swimmer swimmer = new Swimmer();
        mapDTOToEntity(dto, swimmer, user);

        Swimmer savedSwimmer = swimmerRepository.save(swimmer);
        return mapEntityToDTO(savedSwimmer);
    }

    // CREATE with user creation in one transaction
    public SwimmerDTO createSwimmerWithUser(CreateSwimmerRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email deja utilise: " + request.getEmail());
        }

        Role swimmerRole = roleRepository.findByName("SWIMMER")
                .orElseThrow(() -> new RuntimeException("Role SWIMMER not found"));

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setIsActive(true);
        Set<Role> roles = new HashSet<>();
        roles.add(swimmerRole);
        user.setRoles(roles);
        User savedUser = userRepository.save(user);

        Swimmer swimmer = new Swimmer();
        swimmer.setFirstName(request.getFirstName());
        swimmer.setLastName(request.getLastName());
        swimmer.setEmail(request.getEmail());
        swimmer.setRegistrationNumber(request.getRegistrationNumber());
        swimmer.setLevel(request.getLevel());
        swimmer.setCategory(request.getCategory());
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isBlank()) {
            swimmer.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
        }
        swimmer.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        swimmer.setUser(savedUser);

        return mapEntityToDTO(swimmerRepository.save(swimmer));
    }

    // READ
    public SwimmerDTO getSwimmerById(Long id) {
        Swimmer swimmer = swimmerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Swimmer not found with id: " + id));
        return mapEntityToDTO(swimmer);
    }

    public List<SwimmerDTO> getAllSwimmers() {
        return swimmerRepository.findAll()
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<SwimmerDTO> getSwimmersByUserId(Long userId) {
        return swimmerRepository.findByUserId(userId)
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<SwimmerDTO> getSwimmersByLevel(String level) {
        return swimmerRepository.findByLevel(level)
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    // UPDATE
    public SwimmerDTO updateSwimmer(Long id, SwimmerDTO dto) {
        Swimmer swimmer = swimmerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Swimmer not found with id: " + id));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        mapDTOToEntity(dto, swimmer, user);
        Swimmer updatedSwimmer = swimmerRepository.save(swimmer);

        return mapEntityToDTO(updatedSwimmer);
    }

    // DELETE
    public void deleteSwimmer(Long id) {
        Swimmer swimmer = swimmerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Swimmer not found with id: " + id));

        // Remove from all sessions
        swimmer.getSessions().clear();

        // Remove from all competitions
        swimmer.getCompetitions().clear();

        swimmerRepository.delete(swimmer);
    }

    // Helper methods
    private SwimmerDTO mapEntityToDTO(Swimmer swimmer) {
        return SwimmerDTO.builder()
                .id(swimmer.getId())
                .registrationNumber(swimmer.getRegistrationNumber())
                .level(swimmer.getLevel())
                .category(swimmer.getCategory())
                .dateOfBirth(swimmer.getDateOfBirth())
                .medicalRecordPath(swimmer.getMedicalRecordPath())
                .isActive(swimmer.getIsActive())
                .userId(swimmer.getUser() != null ? swimmer.getUser().getId() : null)
                .userFirstName(swimmer.getFirstName() != null ? swimmer.getFirstName() : (swimmer.getUser() != null ? swimmer.getUser().getFirstName() : ""))
                .userLastName(swimmer.getLastName() != null ? swimmer.getLastName() : (swimmer.getUser() != null ? swimmer.getUser().getLastName() : ""))
                .email(swimmer.getEmail() != null ? swimmer.getEmail() : (swimmer.getUser() != null ? swimmer.getUser().getEmail() : ""))
                .build();
    }

    private void mapDTOToEntity(SwimmerDTO dto, Swimmer swimmer, User user) {
        swimmer.setRegistrationNumber(dto.getRegistrationNumber());
        swimmer.setLevel(dto.getLevel());
        swimmer.setCategory(dto.getCategory());
        swimmer.setDateOfBirth(dto.getDateOfBirth());
        swimmer.setMedicalRecordPath(dto.getMedicalRecordPath());
        if (dto.getIsActive() != null) {
            swimmer.setIsActive(dto.getIsActive());
        }
        swimmer.setFirstName(dto.getUserFirstName());
        swimmer.setLastName(dto.getUserLastName());
        swimmer.setEmail(dto.getEmail());
        swimmer.setUser(user);
    }
}
