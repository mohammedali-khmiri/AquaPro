package com.swimclub.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "swimmers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Swimmer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String registrationNumber;

    @Column(nullable = false)
    private String level; // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

    @Column(nullable = false)
    private String category; // CHILD, TEENAGER, ADULT

    private LocalDate dateOfBirth;

    private String medicalRecordPath;

    private Boolean isActive = true;

    private String firstName;
    private String lastName;
    private String email;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "swimmer_sessions",
            joinColumns = @JoinColumn(name = "swimmer_id"),
            inverseJoinColumns = @JoinColumn(name = "session_id")
    )
    private Set<Session> sessions = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "swimmer_competitions",
            joinColumns = @JoinColumn(name = "swimmer_id"),
            inverseJoinColumns = @JoinColumn(name = "competition_id")
    )
    private Set<Competition> competitions = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
