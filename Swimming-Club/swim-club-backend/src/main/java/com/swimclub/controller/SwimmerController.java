package com.swimclub.controller;

import com.swimclub.dto.SwimmerDTO;
import com.swimclub.dto.CreateSwimmerRequest;
import com.swimclub.service.SwimmerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/swimmers")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
public class SwimmerController {

    @Autowired
    private SwimmerService swimmerService;

    // CREATE with user account (swimmer can then log in)
    @PostMapping("/with-user")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<SwimmerDTO> createSwimmerWithUser(@Valid @RequestBody CreateSwimmerRequest request) {
        SwimmerDTO created = swimmerService.createSwimmerWithUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // CREATE
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<SwimmerDTO> createSwimmer(@Valid @RequestBody SwimmerDTO swimmerDTO) {
        SwimmerDTO created = swimmerService.createSwimmer(swimmerDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // READ - Get all
    @GetMapping
    public ResponseEntity<List<SwimmerDTO>> getAllSwimmers() {
        List<SwimmerDTO> swimmers = swimmerService.getAllSwimmers();
        return ResponseEntity.ok(swimmers);
    }

    // READ - Get by ID
    @GetMapping("/{id}")
    public ResponseEntity<SwimmerDTO> getSwimmerById(@PathVariable Long id) {
        SwimmerDTO swimmer = swimmerService.getSwimmerById(id);
        return ResponseEntity.ok(swimmer);
    }

    // READ - Get by user ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SwimmerDTO>> getSwimmersByUserId(@PathVariable Long userId) {
        List<SwimmerDTO> swimmers = swimmerService.getSwimmersByUserId(userId);
        return ResponseEntity.ok(swimmers);
    }

    // READ - Get by level
    @GetMapping("/level/{level}")
    public ResponseEntity<List<SwimmerDTO>> getSwimmersByLevel(@PathVariable String level) {
        List<SwimmerDTO> swimmers = swimmerService.getSwimmersByLevel(level);
        return ResponseEntity.ok(swimmers);
    }

    // UPDATE
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<SwimmerDTO> updateSwimmer(
            @PathVariable Long id,
            @Valid @RequestBody SwimmerDTO swimmerDTO) {
        SwimmerDTO updated = swimmerService.updateSwimmer(id, swimmerDTO);
        return ResponseEntity.ok(updated);
    }

    // DELETE
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<Void> deleteSwimmer(@PathVariable Long id) {
        swimmerService.deleteSwimmer(id);
        return ResponseEntity.noContent().build();
    }
}
