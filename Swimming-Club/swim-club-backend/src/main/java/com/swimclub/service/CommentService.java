package com.swimclub.service;

import com.swimclub.dto.CommentDTO;
import com.swimclub.entity.Comment;
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
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private NewsRepository newsRepository;

    @Autowired
    private UserRepository userRepository;

    // CREATE
    public CommentDTO createComment(CommentDTO dto) {
        News news = newsRepository.findById(dto.getNewsId())
                .orElseThrow(() -> new RuntimeException("News not found"));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = new Comment();
        mapDTOToEntity(dto, comment, news, user);

        Comment savedComment = commentRepository.save(comment);
        return mapEntityToDTO(savedComment);
    }

    // READ
    public CommentDTO getCommentById(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));
        return mapEntityToDTO(comment);
    }

    public List<CommentDTO> getAllComments() {
        return commentRepository.findAll()
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<CommentDTO> getCommentsByNews(Long newsId) {
        return commentRepository.findByNewsId(newsId)
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    public List<CommentDTO> getCommentsByUser(Long userId) {
        return commentRepository.findByUserId(userId)
                .stream()
                .map(this::mapEntityToDTO)
                .collect(Collectors.toList());
    }

    // UPDATE
    public CommentDTO updateComment(Long id, CommentDTO dto) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        News news = newsRepository.findById(dto.getNewsId())
                .orElseThrow(() -> new RuntimeException("News not found"));

        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        mapDTOToEntity(dto, comment, news, user);
        Comment updatedComment = commentRepository.save(comment);

        return mapEntityToDTO(updatedComment);
    }

    // DELETE
    public void deleteComment(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        commentRepository.delete(comment);
    }

    // Helper methods
    private CommentDTO mapEntityToDTO(Comment comment) {
        return CommentDTO.builder()
                .id(comment.getId())
                .text(comment.getText())
                .newsId(comment.getNews().getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getFirstName() + " " + comment.getUser().getLastName())
                .build();
    }

    private void mapDTOToEntity(CommentDTO dto, Comment comment, News news, User user) {
        comment.setText(dto.getText());
        comment.setNews(news);
        comment.setUser(user);
    }
}
