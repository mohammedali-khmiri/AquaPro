package com.swimclub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwimmerDTO {
    private Long id;

    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotBlank(message = "Level is required")
    private String level; // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

    @NotBlank(message = "Category is required")
    private String category; // CHILD, TEENAGER, ADULT

    private LocalDate dateOfBirth;

    private String medicalRecordPath;

    private Boolean isActive;

    @NotNull(message = "User ID is required")
    private Long userId;

    private String userFirstName;
    private String userLastName;
    private String email;
}
