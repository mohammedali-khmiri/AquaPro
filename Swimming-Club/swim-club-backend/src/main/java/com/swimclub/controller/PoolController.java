package com.swimclub.controller;

import com.swimclub.dto.PoolDto;
import com.swimclub.service.PoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pools")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
@RequiredArgsConstructor
public class PoolController {

    private final PoolService poolService;

    @GetMapping
    public ResponseEntity<List<PoolDto>> getAllPools() {
        return ResponseEntity.ok(poolService.getAllPools());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<PoolDto> createPool(@RequestBody PoolDto poolDto) {
        return ResponseEntity.ok(poolService.createPool(poolDto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<PoolDto> updatePool(@PathVariable String id, @RequestBody PoolDto poolDto) {
        return ResponseEntity.ok(poolService.updatePool(id, poolDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<Void> deletePool(@PathVariable String id) {
        poolService.deletePool(id);
        return ResponseEntity.noContent().build();
    }
}
