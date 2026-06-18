package com.swimclub.repository;

import com.swimclub.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByCoachId(Long coachId);
    List<Session> findByCreatedBy_Id(Long userId);
    List<Session> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    List<Session> findByIsCancelledFalse();
    List<Session> findByLevel(String level);

    @Query("SELECT s FROM Session s WHERE " +
           "LOWER(s.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(s.location) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(COALESCE(s.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Session> search(@Param("q") String q);
}
