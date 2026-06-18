package com.swimclub.service;

import com.swimclub.dto.SessionDTO;
import com.swimclub.entity.Coach;
import com.swimclub.entity.Session;
import com.swimclub.entity.Swimmer;
import com.swimclub.entity.User;
import com.swimclub.repository.CoachRepository;
import com.swimclub.repository.SessionRepository;
import com.swimclub.repository.SwimmerRepository;
import com.swimclub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SessionService {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private CoachRepository coachRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SwimmerRepository swimmerRepository;

    // CREATE
    public SessionDTO createSession(SessionDTO dto) {
        Coach coach = coachRepository.findById(dto.getCoachId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        User createdBy = null;
        if (dto.getCreatedBy() != null) {
            createdBy = userRepository.findById(dto.getCreatedBy())
                    .orElse(null);
        }

        Session session = new Session();
        mapDTOToEntity(dto, session, coach, createdBy);

        Session savedSession = sessionRepository.save(session);
        return mapEntityToDTO(savedSession);
    }

    // READ
    public SessionDTO getSessionById(Long id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found with id: " + id));
        return mapEntityToDTO(session);
    }

    public List<SessionDTO> getAllSessions() {
        return sessionRepository.findAll()
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<SessionDTO> getSessionsByCoachId(Long coachId) {
        return sessionRepository.findByCoachId(coachId)
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<SessionDTO> getActiveSessions() {
        return sessionRepository.findByIsCancelledFalse()
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<SessionDTO> search(String q) {
        if (q == null || q.isBlank()) return getAllSessions();
        return sessionRepository.search(q.trim())
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<SessionDTO> getByLevel(String level) {
        return sessionRepository.findByLevel(level)
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    // UPDATE
    public SessionDTO updateSession(Long id, SessionDTO dto) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found with id: " + id));

        Coach coach = coachRepository.findById(dto.getCoachId())
                .orElseThrow(() -> new RuntimeException("Coach not found"));

        User createdBy = null;
        if (dto.getCreatedBy() != null) {
            createdBy = userRepository.findById(dto.getCreatedBy())
                    .orElse(null);
        }

        mapDTOToEntity(dto, session, coach, createdBy);
        Session updatedSession = sessionRepository.save(session);

        return mapEntityToDTO(updatedSession);
    }

    // DELETE
    public void deleteSession(Long id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found with id: " + id));

        // Remove from all swimmers
        session.getSwimmers().clear();

        sessionRepository.delete(session);
    }

    // ADD SWIMMER TO SESSION
    public void addSwimmerToSession(Long sessionId, Long swimmerId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Swimmer swimmer = swimmerRepository.findById(swimmerId)
                .orElseThrow(() -> new RuntimeException("Swimmer not found"));

        if (session.getSwimmers().size() >= session.getMaxCapacity()) {
            throw new RuntimeException("Session is full");
        }

        session.getSwimmers().add(swimmer);
        sessionRepository.save(session);
    }

    // REMOVE SWIMMER FROM SESSION
    public void removeSwimmerFromSession(Long sessionId, Long swimmerId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Swimmer swimmer = swimmerRepository.findById(swimmerId)
                .orElseThrow(() -> new RuntimeException("Swimmer not found"));

        session.getSwimmers().remove(swimmer);
        sessionRepository.save(session);
    }

    // Helper methods
    private SessionDTO mapEntityToDTO(Session session) {
        return SessionDTO.builder()
                .id(session.getId())
                .title(session.getTitle())
                .description(session.getDescription())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .location(session.getLocation())
                .maxCapacity(session.getMaxCapacity())
                .level(session.getLevel())
                .isCancelled(session.getIsCancelled())
                .coachId(session.getCoach().getId())
                .coachName(session.getCoach().getUser().getFirstName() + " " + session.getCoach().getUser().getLastName())
                .createdBy(session.getCreatedBy() != null ? session.getCreatedBy().getId() : null)
                .swimmersCount(session.getSwimmers().size())
                .build();
    }

    private void mapDTOToEntity(SessionDTO dto, Session session, Coach coach, User createdBy) {
        session.setTitle(dto.getTitle());
        session.setDescription(dto.getDescription());
        session.setStartTime(dto.getStartTime());
        session.setEndTime(dto.getEndTime());
        session.setLocation(dto.getLocation());
        session.setMaxCapacity(dto.getMaxCapacity());
        session.setLevel(dto.getLevel());
        if (dto.getIsCancelled() != null) {
            session.setIsCancelled(dto.getIsCancelled());
        }
        session.setCoach(coach);
        session.setCreatedBy(createdBy);
    }
}
