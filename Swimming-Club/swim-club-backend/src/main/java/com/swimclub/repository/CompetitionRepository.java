package com.swimclub.repository;

import com.swimclub.entity.Competition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CompetitionRepository extends JpaRepository<Competition, Long> {
    List<Competition> findByStatus(String status);
    List<Competition> findByStartDateBetween(LocalDateTime start, LocalDateTime end);
    List<Competition> findByLevel(String level);

    @Query("SELECT c FROM Competition c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.location) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(COALESCE(c.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Competition> search(@Param("q") String q);
}
