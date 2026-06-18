package com.swimclub.controller;

import com.swimclub.dto.CoachDTO;
import com.swimclub.dto.CreateCoachRequest;
import com.swimclub.service.CoachService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/coaches")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
public class CoachController {

    @Autowired
    private CoachService coachService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CoachDTO> createCoach(@Valid @RequestBody CoachDTO coachDTO) {
        CoachDTO created = coachService.createCoach(coachDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/with-user")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CoachDTO> createCoachWithUser(@Valid @RequestBody CreateCoachRequest request) {
        CoachDTO created = coachService.createCoachWithUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<CoachDTO>> getAllCoaches() {
        return ResponseEntity.ok(coachService.getAllCoaches());
    }

    @GetMapping("/active")
    public ResponseEntity<List<CoachDTO>> getActiveCoaches() {
        return ResponseEntity.ok(coachService.getActiveCoaches());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CoachDTO> getCoachById(@PathVariable Long id) {
        return ResponseEntity.ok(coachService.getCoachById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<CoachDTO> getCoachByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(coachService.getCoachByUserId(userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CoachDTO> updateCoach(
            @PathVariable Long id,
            @Valid @RequestBody CoachDTO coachDTO) {
        return ResponseEntity.ok(coachService.updateCoach(id, coachDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCoach(@PathVariable Long id) {
        coachService.deleteCoach(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<CoachDTO>> searchCoaches(@RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(coachService.search(q));
    }

    @GetMapping("/specialization/{specialization}")
    public ResponseEntity<List<CoachDTO>> getBySpecialization(@PathVariable String specialization) {
        return ResponseEntity.ok(coachService.getBySpecialization(specialization));
    }
}
