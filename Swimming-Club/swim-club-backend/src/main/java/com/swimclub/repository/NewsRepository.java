package com.swimclub.repository;

import com.swimclub.entity.News;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {
    List<News> findByIsPublishedTrue();
    List<News> findByCreatedBy_Id(Long userId);
    List<News> findAllByOrderByCreatedAtDesc();
}
