package com.swimclub;

import com.swimclub.entity.Coach;
import com.swimclub.entity.Role;
import com.swimclub.entity.User;
import com.swimclub.repository.CoachRepository;
import com.swimclub.repository.RoleRepository;
import com.swimclub.repository.SwimmerRepository;
import com.swimclub.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CoachRepository coachRepository;

    @Autowired
    private SwimmerRepository swimmerRepository;

    @Override
    public void run(String... args) throws Exception {
        // Create roles if they don't exist
        if (roleRepository.findByName("ADMIN").isEmpty()) {
            Role adminRole = new Role();
            adminRole.setName("ADMIN");
            adminRole.setDescription("Administrator role");
            roleRepository.save(adminRole);
        }

        if (roleRepository.findByName("COACH").isEmpty()) {
            Role coachRole = new Role();
            coachRole.setName("COACH");
            coachRole.setDescription("Coach role");
            roleRepository.save(coachRole);
        }

        if (roleRepository.findByName("SWIMMER").isEmpty()) {
            Role swimmerRole = new Role();
            swimmerRole.setName("SWIMMER");
            swimmerRole.setDescription("Swimmer role");
            roleRepository.save(swimmerRole);
        }

        // Create demo users if they don't exist
        if (userRepository.findByEmail("admin@example.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@example.com");
            admin.setFirstName("Sami");
            admin.setLastName("Boukadida");
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setPhoneNumber("+21612345678");
            admin.setAddress("12 Avenue Habib Bourguiba, Tunis");
            admin.setIsActive(true);

            Set<Role> adminRoles = new HashSet<>();
            adminRoles.add(roleRepository.findByName("ADMIN").get());
            admin.setRoles(adminRoles);

            userRepository.save(admin);
        } else {
            userRepository.findByEmail("admin@example.com").ifPresent(u -> {
                u.setFirstName("Sami"); u.setLastName("Boukadida"); userRepository.save(u);
            });
        }

        if (userRepository.findByEmail("coach@example.com").isEmpty()) {
            User coach = new User();
            coach.setEmail("coach@example.com");
            coach.setFirstName("Nabil");
            coach.setLastName("Maaloul");
            coach.setPassword(passwordEncoder.encode("password123"));
            coach.setPhoneNumber("+21698765432");
            coach.setAddress("34 Rue de Carthage, Sfax");
            coach.setIsActive(true);

            Set<Role> coachRoles = new HashSet<>();
            coachRoles.add(roleRepository.findByName("COACH").get());
            coach.setRoles(coachRoles);

            userRepository.save(coach);
        } else {
            userRepository.findByEmail("coach@example.com").ifPresent(u -> {
                u.setFirstName("Nabil"); u.setLastName("Maaloul"); userRepository.save(u);
            });
        }

        if (userRepository.findByEmail("swimmer@example.com").isEmpty()) {
            User swimmer = new User();
            swimmer.setEmail("swimmer@example.com");
            swimmer.setFirstName("Ines");
            swimmer.setLastName("Jendoubi");
            swimmer.setPassword(passwordEncoder.encode("password123"));
            swimmer.setPhoneNumber("+21671234567");
            swimmer.setAddress("89 Boulevard du 7 Novembre, Sousse");
            swimmer.setIsActive(true);

            Set<Role> swimmerRoles = new HashSet<>();
            swimmerRoles.add(roleRepository.findByName("SWIMMER").get());
            swimmer.setRoles(swimmerRoles);

            userRepository.save(swimmer);
        } else {
            userRepository.findByEmail("swimmer@example.com").ifPresent(u -> {
                u.setFirstName("Ines"); u.setLastName("Jendoubi"); userRepository.save(u);
            });
        }
        // Ensure swimmer record for swimmer@example.com has correct name
        userRepository.findByEmail("swimmer@example.com").ifPresent(u -> {
            List<com.swimclub.entity.Swimmer> swimmers = swimmerRepository.findByUserId(u.getId());
            if (swimmers.isEmpty()) {
                com.swimclub.entity.Swimmer s = new com.swimclub.entity.Swimmer();
                s.setFirstName("Ines");
                s.setLastName("Jendoubi");
                s.setEmail("swimmer@example.com");
                s.setRegistrationNumber("SWIM-002");
                s.setLevel("INTERMEDIATE");
                s.setCategory("ADULT");
                s.setDateOfBirth(LocalDate.of(2000, 5, 15));
                s.setIsActive(true);
                s.setUser(u);
                swimmerRepository.save(s);
            } else {
                com.swimclub.entity.Swimmer s = swimmers.get(0);
                s.setFirstName("Ines");
                s.setLastName("Jendoubi");
                s.setEmail("swimmer@example.com");
                swimmerRepository.save(s);
            }
        });

        // Test accounts
        if (userRepository.findByEmail("admin@test.com").isEmpty()) {
            User adminTest = new User();
            adminTest.setEmail("admin@test.com");
            adminTest.setFirstName("Admin");
            adminTest.setLastName("Test");
            adminTest.setPassword(passwordEncoder.encode("admin123"));
            adminTest.setIsActive(true);
            Set<Role> r1 = new HashSet<>();
            r1.add(roleRepository.findByName("ADMIN").get());
            adminTest.setRoles(r1);
            userRepository.save(adminTest);
        }
        if (userRepository.findByEmail("coach@test.com").isEmpty()) {
            User coachTest = new User();
            coachTest.setEmail("coach@test.com");
            coachTest.setFirstName("Coach");
            coachTest.setLastName("Test");
            coachTest.setPassword(passwordEncoder.encode("coach123"));
            coachTest.setIsActive(true);
            Set<Role> r2 = new HashSet<>();
            r2.add(roleRepository.findByName("COACH").get());
            coachTest.setRoles(r2);
            userRepository.save(coachTest);
        }
        if (userRepository.findByEmail("swimmer@test.com").isEmpty()) {
            User swimmerTest = new User();
            swimmerTest.setEmail("swimmer@test.com");
            swimmerTest.setFirstName("Rania");
            swimmerTest.setLastName("Ben Youssef");
            swimmerTest.setPassword(passwordEncoder.encode("swimmer123"));
            swimmerTest.setIsActive(true);
            Set<Role> r3 = new HashSet<>();
            r3.add(roleRepository.findByName("SWIMMER").get());
            swimmerTest.setRoles(r3);
            userRepository.save(swimmerTest);
        } else {
            userRepository.findByEmail("swimmer@test.com").ifPresent(u -> {
                u.setFirstName("Rania"); u.setLastName("Ben Youssef"); userRepository.save(u);
            });
        }

        // Add Tunisian demo coaches
        createTunisianCoach("mohamed.trabelsi@swimclub.tn", "Mohamed", "Trabelsi",
                "+21655123456", "Natation libre", "CERT-TN-001", 8.0,
                "Specialiste en nage libre et techniques de sprint", true);
        createTunisianCoach("amira.benali@swimclub.tn", "Amira", "Ben Ali",
                "+21622987654", "Papillon", "CERT-TN-002", 5.0,
                "Coach certifiee en nage papillon et 4 nages", true);
        createTunisianCoach("karim.gharbi@swimclub.tn", "Karim", "Gharbi",
                "+21699345678", "Dos crawle", "CERT-TN-003", 10.0,
                "Expert en nage sur le dos et endurance", true);

        // Link demo coach@example.com user to coach profile if not already done
        userRepository.findByEmail("coach@example.com").ifPresent(u -> {
            if (coachRepository.findByUserId(u.getId()).isEmpty()) {
                Coach c = new Coach();
                c.setSpecialization("4 Nages");
                c.setCertificationNumber("CERT-TN-000");
                c.setExperience(6.0);
                c.setBio("Coach principal du club");
                c.setIsActive(true);
                c.setUser(u);
                coachRepository.save(c);
            }
        });

        System.out.println("Demo users and Tunisian coaches created successfully!");
    }

    private void createTunisianCoach(String email, String firstName, String lastName,
            String phone, String specialization, String certNumber, Double experience,
            String bio, boolean active) {
        if (userRepository.findByEmail(email).isPresent()) return;

        Role coachRole = roleRepository.findByName("COACH")
                .orElseThrow(() -> new RuntimeException("Role COACH not found"));

        User user = new User();
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPassword(passwordEncoder.encode("coach123"));
        user.setPhoneNumber(phone);
        user.setIsActive(true);
        Set<Role> roles = new HashSet<>();
        roles.add(coachRole);
        user.setRoles(roles);
        User savedUser = userRepository.save(user);

        Coach coach = new Coach();
        coach.setSpecialization(specialization);
        coach.setCertificationNumber(certNumber);
        coach.setExperience(experience);
        coach.setBio(bio);
        coach.setIsActive(active);
        coach.setUser(savedUser);
        coachRepository.save(coach);
    }
}
