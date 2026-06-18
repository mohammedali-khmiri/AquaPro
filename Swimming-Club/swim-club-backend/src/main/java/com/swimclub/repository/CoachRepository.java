package com.swimclub.repository;

import com.swimclub.entity.Coach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CoachRepository extends JpaRepository<Coach, Long> {
    Optional<Coach> findByUserId(Long userId);
    List<Coach> findByIsActiveTrue();
    List<Coach> findBySpecialization(String specialization);

    @Query("SELECT c FROM Coach c WHERE " +
           "LOWER(c.user.firstName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.user.lastName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.user.email) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.specialization) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.certificationNumber) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<Coach> search(@Param("q") String q);
}
