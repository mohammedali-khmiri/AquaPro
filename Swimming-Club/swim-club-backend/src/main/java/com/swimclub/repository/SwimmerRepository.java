package com.swimclub.repository;

import com.swimclub.entity.Swimmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SwimmerRepository extends JpaRepository<Swimmer, Long> {
    List<Swimmer> findByUserId(Long userId);
    List<Swimmer> findByLevel(String level);
    List<Swimmer> findByIsActiveTrue();
}
