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
public class CoachDTO {
    private Long id;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    @NotBlank(message = "Certification number is required")
    private String certificationNumber;

    private String bio;

    @NotNull(message = "Experience is required")
    private Double experience;

    private Boolean isActive;

    @NotNull(message = "User ID is required")
    private Long userId;

    private String userFirstName;
    private String userLastName;
    private String userEmail;
}
