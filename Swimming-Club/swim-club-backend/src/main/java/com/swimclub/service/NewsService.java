package com.swimclub.service;

import com.swimclub.dto.NewsDTO;
import com.swimclub.entity.News;
import com.swimclub.entity.User;
import com.swimclub.repository.CommentRepository;
import com.swimclub.repository.NewsRepository;
import com.swimclub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NewsService {

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CommentRepository commentRepository;

    // CREATE
    public NewsDTO createNews(NewsDTO dto) {
        User createdBy = userRepository.findById(dto.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("User not found"));

        News news = new News();
        mapDTOToEntity(dto, news, createdBy);

        News savedNews = newsRepository.save(news);
        return mapEntityToDTO(savedNews);
    }

    // READ
    public NewsDTO getNewsById(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found with id: " + id));
        
        // Increment views
        news.setViews((news.getViews() != null ? news.getViews() : 0) + 1);
        newsRepository.save(news);
        
        return mapEntityToDTO(news);
    }

    public List<NewsDTO> getAllNews() {
        return newsRepository.findAll()
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<NewsDTO> getPublishedNews() {
        return newsRepository.findByIsPublishedTrue()
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<NewsDTO> getNewsByUser(Long userId) {
        return newsRepository.findByCreatedBy_Id(userId)
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    // UPDATE
    public NewsDTO updateNews(Long id, NewsDTO dto) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

        User createdBy = userRepository.findById(dto.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("User not found"));

        mapDTOToEntity(dto, news, createdBy);
        News updatedNews = newsRepository.save(news);

        return mapEntityToDTO(updatedNews);
    }

    // DELETE - WITH CASCADE DELETE OF COMMENTS
    public void deleteNews(Long id) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("News not found with id: " + id));

        // Delete all associated comments first
        commentRepository.deleteAll(news.getComments());

        // Then delete the news
        newsRepository.delete(news);
    }

    // Helper methods
    private NewsDTO mapEntityToDTO(News news) {
        return NewsDTO.builder()
                .id(news.getId())
                .title(news.getTitle())
                .content(news.getContent())
                .imageUrl(news.getImageUrl())
                .views(news.getViews())
                .isPublished(news.getIsPublished())
                .createdBy(news.getCreatedBy().getId())
                .createdByName(news.getCreatedBy().getFirstName() + " " + news.getCreatedBy().getLastName())
                .commentsCount(news.getComments().size())
                .build();
    }

    private void mapDTOToEntity(NewsDTO dto, News news, User createdBy) {
        news.setTitle(dto.getTitle());
        news.setContent(dto.getContent());
        news.setImageUrl(dto.getImageUrl());
        if (dto.getIsPublished() != null) {
            news.setIsPublished(dto.getIsPublished());
        }
        news.setCreatedBy(createdBy);
    }
}
