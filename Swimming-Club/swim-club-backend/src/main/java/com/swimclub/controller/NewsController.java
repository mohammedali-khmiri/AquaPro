package com.swimclub.controller;

import com.swimclub.dto.NewsDTO;
import com.swimclub.service.NewsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
public class NewsController {

    @Autowired
    private NewsService newsService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<NewsDTO> createNews(@Valid @RequestBody NewsDTO newsDTO) {
        NewsDTO created = newsService.createNews(newsDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<NewsDTO>> getAllNews() {
        return ResponseEntity.ok(newsService.getAllNews());
    }

    @GetMapping("/public/all")
    public ResponseEntity<List<NewsDTO>> getPublishedNews() {
        return ResponseEntity.ok(newsService.getPublishedNews());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsDTO> getNewsById(@PathVariable Long id) {
        return ResponseEntity.ok(newsService.getNewsById(id));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<NewsDTO>> getNewsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(newsService.getNewsByUser(userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
    public ResponseEntity<NewsDTO> updateNews(
            @PathVariable Long id,
            @Valid @RequestBody NewsDTO newsDTO) {
        return ResponseEntity.ok(newsService.updateNews(id, newsDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteNews(@PathVariable Long id) {
        newsService.deleteNews(id);
        return ResponseEntity.noContent().build();
    }
}
