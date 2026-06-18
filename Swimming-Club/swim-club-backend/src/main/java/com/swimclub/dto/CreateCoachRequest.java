package com.swimclub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCoachRequest {

    // User fields
    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    private String phoneNumber;

    // Coach fields
    @NotBlank(message = "Specialization is required")
    private String specialization;

    @NotBlank(message = "Certification number is required")
    private String certificationNumber;

    private String bio;

    @NotNull(message = "Experience is required")
    private Double experience;

    private Boolean isActive = true;
}
