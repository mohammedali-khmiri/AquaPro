package com.swimclub.service;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiContextService {

    private final MongoTemplate mongoTemplate;

    private final List<String> STOP_WORDS = Arrays.asList(
            "donner", "moi", "des", "infor", "infos", "information", "informations",
            "concernant", "concerant", "le", "la", "les", "club", "clubs", "natation", "tunisie"
    );

    public String searchFederationContext(String userQuery) {
        String cleanRegex = Arrays.stream(userQuery.split("\\s+"))
                .map(word -> word.replaceAll("[^a-zA-Z0-9]", ""))
                .filter(word -> word.length() > 2)
                .filter(word -> !STOP_WORDS.contains(word.toLowerCase()))
                .collect(Collectors.joining("|"));

        if (cleanRegex.isEmpty()) {
            cleanRegex = userQuery;
        }

        StringBuilder contextBuilder = new StringBuilder();

        // 1. Recherche dans les Clubs (Texte court -> Pas besoin de couper)
        Query clubQuery = new Query();
        clubQuery.addCriteria(Criteria.where("name").regex(cleanRegex, "i"));
        clubQuery.limit(3);
        List<Document> clubs = mongoTemplate.find(clubQuery, Document.class, "clubs");

        for (Document club : clubs) {
            contextBuilder.append("👉 Club enregistré : ").append(club.getString("name")).append("\n");
        }

        // 2. Recherche dans les Articles (posts) -> On limite le texte à 1000 caractères max
        Query postQuery = new Query();
        postQuery.addCriteria(Criteria.where("content").regex(cleanRegex, "i"));
        postQuery.limit(2);
        List<Document> posts = mongoTemplate.find(postQuery, Document.class, "posts");

        for (Document post : posts) {
            String content = post.getString("content");
            String snippet = extractSmartSnippet(content, cleanRegex);
            contextBuilder.append("\n--- ARTICLE : ").append(post.getString("title")).append(" ---\n")
                    .append("Extrait : ").append(snippet).append("\n");
        }

        // 3. Recherche dans les PDFs -> Crucial : On extrait juste la zone autour du mot-clé !
        Query pdfQuery = new Query();
        pdfQuery.addCriteria(Criteria.where("full_text").regex(cleanRegex, "i"));
        pdfQuery.limit(2);
        List<Document> pdfs = mongoTemplate.find(pdfQuery, Document.class, "pdf_documents");

        for (Document pdf : pdfs) {
            String fullText = pdf.getString("full_text");
            String snippet = extractSmartSnippet(fullText, cleanRegex);
            contextBuilder.append("\n--- DOC OFFICIEL : ").append(pdf.getString("filename")).append(" ---\n")
                    .append("Extrait pertinent du PDF : ").append(snippet).append("\n");
        }

        return contextBuilder.toString();
    }

    /**
     * 🧠 Extrait uniquement les lignes entourant le mot-clé pour éviter d'exploser la mémoire d'Ollama
     */
    private String extractSmartSnippet(String text, String regex) {
        if (text == null || text.isEmpty()) return "Aucun contenu lisible.";
        if (text.length() <= 1200) return text;

        try {
            Pattern pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(text);

            if (matcher.find()) {
                // On prend 200 caractères avant le mot trouvé, et 1000 caractères après
                int start = Math.max(0, matcher.start() - 200);
                int end = Math.min(text.length(), matcher.end() + 1000);
                return "... " + text.substring(start, end).trim() + " ... [Contenu ciblé mis en sécurité]";
            }
        } catch (Exception e) {
            // En cas de souci avec le pattern, sécurité anti-crash
        }

        // Si rien n'est trouvé par sécurité, on renvoie juste le début abrégé
        return text.substring(0, 1000) + " ... [Tronqué]";
    }
}