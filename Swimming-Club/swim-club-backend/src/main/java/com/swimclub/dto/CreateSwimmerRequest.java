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
public class CreateSwimmerRequest {

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

    // Swimmer fields
    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotBlank(message = "Level is required")
    private String level;

    @NotBlank(message = "Category is required")
    private String category;

    private String dateOfBirth;

    private Boolean isActive = true;
}
