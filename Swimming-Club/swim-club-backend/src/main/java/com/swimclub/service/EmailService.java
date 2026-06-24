package com.swimclub.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationEmail(String toEmail, String token) {
        String verificationUrl = "http://localhost:8080/api/auth/verify?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("AquaPro <noreply@aquapro.com>");
        message.setTo(toEmail);
        message.setSubject("🏊 Activation de votre compte AquaPro");
        message.setText("Bienvenue sur la plateforme AquaPro !\n\n" +
                "Veuillez cliquer sur le lien ci-dessous pour valider votre inscription et activer votre compte :\n" +
                verificationUrl + "\n\n" +
                "Ce lien expirera dans 24 heures.\n" +
                "Sportivement,\nL'équipe AquaPro.");

        mailSender.send(message);
    }
}