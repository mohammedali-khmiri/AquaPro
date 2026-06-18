package com.swimclub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDTO {
    private Long id;

    @NotBlank(message = "Comment text is required")
    private String text;

    @NotNull(message = "News ID is required")
    private Long newsId;

    @NotNull(message = "User ID is required")
    private Long userId;

    private String userName;
}
