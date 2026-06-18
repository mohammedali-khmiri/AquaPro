package com.swimclub.service;

import com.swimclub.dto.CompetitionDTO;
import com.swimclub.entity.Competition;
import com.swimclub.entity.Swimmer;
import com.swimclub.entity.User;
import com.swimclub.repository.CompetitionRepository;
import com.swimclub.repository.SwimmerRepository;
import com.swimclub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CompetitionService {

    @Autowired
    private CompetitionRepository competitionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SwimmerRepository swimmerRepository;

    // CREATE
    public CompetitionDTO createCompetition(CompetitionDTO dto) {
        User createdBy = null;
        if (dto.getCreatedBy() != null) {
            createdBy = userRepository.findById(dto.getCreatedBy())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        Competition competition = new Competition();
        mapDTOToEntity(dto, competition, createdBy);

        Competition savedCompetition = competitionRepository.save(competition);
        return mapEntityToDTO(savedCompetition);
    }

    // READ
    public CompetitionDTO getCompetitionById(Long id) {
        Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found with id: " + id));
        return mapEntityToDTO(competition);
    }

    public List<CompetitionDTO> getAllCompetitions() {
        return competitionRepository.findAll()
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<CompetitionDTO> getCompetitionsByStatus(String status) {
        return competitionRepository.findByStatus(status)
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<CompetitionDTO> search(String q) {
        if (q == null || q.isBlank()) return getAllCompetitions();
        return competitionRepository.search(q.trim())
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<CompetitionDTO> getByLevel(String level) {
        return competitionRepository.findByLevel(level)
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    // UPDATE
    public CompetitionDTO updateCompetition(Long id, CompetitionDTO dto) {
        Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found with id: " + id));

        User createdBy = null;
        if (dto.getCreatedBy() != null) {
            createdBy = userRepository.findById(dto.getCreatedBy())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        mapDTOToEntity(dto, competition, createdBy);
        Competition updatedCompetition = competitionRepository.save(competition);

        return mapEntityToDTO(updatedCompetition);
    }

    // DELETE
    public void deleteCompetition(Long id) {
        Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Competition not found with id: " + id));

        // Remove from all swimmers
        competition.getSwimmers().clear();

        competitionRepository.delete(competition);
    }

    // ADD SWIMMER TO COMPETITION
    public void addSwimmerToCompetition(Long competitionId, Long swimmerId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        Swimmer swimmer = swimmerRepository.findById(swimmerId)
                .orElseThrow(() -> new RuntimeException("Swimmer not found"));

        if (competition.getMaxParticipants() != null && 
            competition.getSwimmers().size() >= competition.getMaxParticipants()) {
            throw new RuntimeException("Competition is full");
        }

        competition.getSwimmers().add(swimmer);
        competitionRepository.save(competition);
    }

    // REMOVE SWIMMER FROM COMPETITION
    public void removeSwimmerFromCompetition(Long competitionId, Long swimmerId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new RuntimeException("Competition not found"));

        Swimmer swimmer = swimmerRepository.findById(swimmerId)
                .orElseThrow(() -> new RuntimeException("Swimmer not found"));

        competition.getSwimmers().remove(swimmer);
        competitionRepository.save(competition);
    }

    // Helper methods
    private CompetitionDTO mapEntityToDTO(Competition competition) {
        return CompetitionDTO.builder()
                .id(competition.getId())
                .name(competition.getName())
                .description(competition.getDescription())
                .startDate(competition.getStartDate())
                .endDate(competition.getEndDate())
                .location(competition.getLocation())
                .level(competition.getLevel())
                .maxParticipants(competition.getMaxParticipants())
                .status(competition.getStatus())
                .createdBy(competition.getCreatedBy() != null ? competition.getCreatedBy().getId() : null)
                .participantsCount(competition.getSwimmers().size())
                .build();
    }

    private void mapDTOToEntity(CompetitionDTO dto, Competition competition, User createdBy) {
        competition.setName(dto.getName());
        competition.setDescription(dto.getDescription());
        competition.setStartDate(dto.getStartDate());
        competition.setEndDate(dto.getEndDate());
        competition.setLocation(dto.getLocation());
        competition.setLevel(dto.getLevel());
        competition.setMaxParticipants(dto.getMaxParticipants());
        if (dto.getStatus() != null) {
            competition.setStatus(dto.getStatus());
        }
        competition.setCreatedBy(createdBy);
    }
}
