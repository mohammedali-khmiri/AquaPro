package com.swimclub.controller;

import com.swimclub.dto.CompetitionDTO;
import com.swimclub.service.CompetitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/competitions")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
public class CompetitionController {

    @Autowired
    private CompetitionService competitionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompetitionDTO> createCompetition(
            @Valid @RequestBody CompetitionDTO competitionDTO) {
        CompetitionDTO created = competitionService.createCompetition(competitionDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<CompetitionDTO>> getAllCompetitions() {
        return ResponseEntity.ok(competitionService.getAllCompetitions());
    }

    @GetMapping("/public/all")
    public ResponseEntity<List<CompetitionDTO>> getPublicCompetitions() {
        return ResponseEntity.ok(competitionService.getAllCompetitions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompetitionDTO> getCompetitionById(@PathVariable Long id) {
        return ResponseEntity.ok(competitionService.getCompetitionById(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<CompetitionDTO>> getCompetitionsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(competitionService.getCompetitionsByStatus(status));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<CompetitionDTO> updateCompetition(
            @PathVariable Long id,
            @Valid @RequestBody CompetitionDTO competitionDTO) {
        return ResponseEntity.ok(competitionService.updateCompetition(id, competitionDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCompetition(@PathVariable Long id) {
        competitionService.deleteCompetition(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{competitionId}/swimmers/{swimmerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH', 'SWIMMER')")
    public ResponseEntity<Void> addSwimmerToCompetition(
            @PathVariable Long competitionId,
            @PathVariable Long swimmerId) {
        competitionService.addSwimmerToCompetition(competitionId, swimmerId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{competitionId}/swimmers/{swimmerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH', 'SWIMMER')")
    public ResponseEntity<Void> removeSwimmerFromCompetition(
            @PathVariable Long competitionId,
            @PathVariable Long swimmerId) {
        competitionService.removeSwimmerFromCompetition(competitionId, swimmerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<CompetitionDTO>> searchCompetitions(@RequestParam(defaultValue = "") String q) {
        return ResponseEntity.ok(competitionService.search(q));
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<List<CompetitionDTO>> getByLevel(@PathVariable String level) {
        return ResponseEntity.ok(competitionService.getByLevel(level));
    }
}
