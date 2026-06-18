package com.swimclub.controller;

import com.swimclub.dto.SessionDTO;
import com.swimclub.service.SessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
public class SessionController {

    @Autowired
    private SessionService sessionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<SessionDTO> createSession(@Valid @RequestBody SessionDTO sessionDTO) {
        SessionDTO created = sessionService.createSession(sessionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<SessionDTO>> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @GetMapping("/active")
    public ResponseEntity<List<SessionDTO>> getActiveSessions() {
        return ResponseEntity.ok(sessionService.getActiveSessions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionDTO> getSessionById(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSessionById(id));
    }

    @GetMapping("/coach/{coachId}")
    public ResponseEntity<List<SessionDTO>> getSessionsByCoachId(@PathVariable Long coachId) {
        return ResponseEntity.ok(sessionService.getSessionsByCoachId(coachId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<SessionDTO> updateSession(
            @PathVariable Long id,
            @Valid @RequestBody SessionDTO sessionDTO) {
        return ResponseEntity.ok(sessionService.updateSession(id, sessionDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        sessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{sessionId}/swimmers/{swimmerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH', 'SWIMMER')")
    public ResponseEntity<Void> addSwimmerToSession(
            @PathVariable Long sessionId,
            @PathVariable Long swimmerId) {
        sessionService.addSwimmerToSession(sessionId, swimmerId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{sessionId}/swimmers/{swimmerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH', 'SWIMMER')")
    public ResponseEntity<Void> removeSwimmerFromSession(
            @PathVariable Long sessionId,
            @PathVariable Long swimmerId) {
        sessionService.removeSwimmerFromSession(sessionId, swimmerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<SessionDTO>> searchSessions(@RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(sessionService.search(q));
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<List<SessionDTO>> getByLevel(@PathVariable String level) {
        return ResponseEntity.ok(sessionService.getByLevel(level));
    }
}
