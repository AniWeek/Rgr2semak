package com.testingsystem.controller;

import com.testingsystem.model.*;
import com.testingsystem.service.TestService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/tests")
@CrossOrigin(origins = "http://localhost:5173")
public class TestController {

    private final TestService testService;

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    public TestController(TestService testService) {
        this.testService = testService;
    }

    @GetMapping
    public ResponseEntity<List<Test>> getAllTests(
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {

        LocalDateTime fromDate = null;
        LocalDateTime toDate = null;
        if (dateFrom != null && !dateFrom.isEmpty()) fromDate = LocalDate.parse(dateFrom).atStartOfDay();
        if (dateTo != null && !dateTo.isEmpty()) toDate = LocalDate.parse(dateTo).atTime(23, 59, 59);

        List<Test> tests = testService.getAllTestsWithFilters(userEmail, category, fromDate, toDate);
        return ResponseEntity.ok(tests);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Test> getTest(@PathVariable UUID id) {
        return ResponseEntity.ok(testService.getTestById(id));
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<List<Question>> getQuestions(@PathVariable UUID id) {
        return ResponseEntity.ok(testService.getQuestionsWithAnswers(id));
    }

    @GetMapping("/{id}/questions-taking")
    public ResponseEntity<List<Question>> getQuestionsForTaking(@PathVariable UUID id) {
        return ResponseEntity.ok(testService.getQuestionsForTaking(id));
    }

    @GetMapping("/{id}/results/users")
    public ResponseEntity<List<Map<String, Object>>> getTestResultsWithUsers(@PathVariable UUID id) {
        return ResponseEntity.ok(testService.getTestResultsWithUsers(id));
    }

    @PostMapping("/create")
    public ResponseEntity<Test> createTest(@RequestBody Map<String, Object> request) {
        String title = (String) request.get("title");
        String description = request.get("description") != null ? (String) request.get("description") : "";
        Integer duration = ((Number) request.get("duration")).intValue();
        UUID createdBy = UUID.fromString((String) request.get("createdBy"));
        Integer maxAttempts = request.get("maxAttempts") != null ? ((Number) request.get("maxAttempts")).intValue() : null;
        Boolean isPrivate = request.get("isPrivate") != null ? (Boolean) request.get("isPrivate") : false;
        Boolean commentsEnabled = request.get("commentsEnabled") != null ? (Boolean) request.get("commentsEnabled") : false;
        Boolean randomizeQuestions = request.get("randomizeQuestions") != null ? (Boolean) request.get("randomizeQuestions") : false;
        Boolean allowNavigationBack = request.get("allowNavigationBack") != null ? (Boolean) request.get("allowNavigationBack") : true;
        Boolean allowSkipQuestions = request.get("allowSkipQuestions") != null ? (Boolean) request.get("allowSkipQuestions") : true;
        LocalDate deadline = request.get("deadline") != null ? LocalDate.parse((String) request.get("deadline")) : null;
        String category = request.get("category") != null ? (String) request.get("category") : "GENERAL";

        Test test = testService.createTest(title, description, duration, deadline, createdBy, maxAttempts,
                isPrivate, commentsEnabled, randomizeQuestions, allowNavigationBack, allowSkipQuestions, category);
        return ResponseEntity.ok(test);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Test> updateTest(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        String title = (String) request.get("title");
        String description = request.get("description") != null ? (String) request.get("description") : "";
        Integer duration = ((Number) request.get("duration")).intValue();
        Integer maxAttempts = request.get("maxAttempts") != null ? ((Number) request.get("maxAttempts")).intValue() : null;
        Boolean commentsEnabled = request.get("commentsEnabled") != null ? (Boolean) request.get("commentsEnabled") : null;
        Boolean randomizeQuestions = request.get("randomizeQuestions") != null ? (Boolean) request.get("randomizeQuestions") : null;
        Boolean allowNavigationBack = request.get("allowNavigationBack") != null ? (Boolean) request.get("allowNavigationBack") : null;
        Boolean allowSkipQuestions = request.get("allowSkipQuestions") != null ? (Boolean) request.get("allowSkipQuestions") : null;
        LocalDate deadline = request.get("deadline") != null ? LocalDate.parse((String) request.get("deadline")) : null;
        String category = request.get("category") != null ? (String) request.get("category") : null;

        Test test = testService.updateTest(id, title, description, duration, deadline, maxAttempts,
                commentsEnabled, randomizeQuestions, allowNavigationBack, allowSkipQuestions, category);
        return ResponseEntity.ok(test);
    }

    @PutMapping("/{id}/questions")
    public ResponseEntity<Map<String, String>> updateTestQuestions(@PathVariable UUID id,
                                                                   @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> questions = (List<Map<String, Object>>) request.get("questions");
        testService.updateTestQuestions(id, questions);
        return ResponseEntity.ok(Map.of("message", "Вопросы теста обновлены"));
    }

    @PostMapping("/{testId}/invite")
    public ResponseEntity<?> inviteUsers(@PathVariable UUID testId, @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<String> emails = (List<String>) request.get("emails");
        UUID invitedBy = UUID.fromString((String) request.get("invitedBy"));
        testService.inviteUsersToTest(testId, emails, invitedBy);
        return ResponseEntity.ok(Map.of("message", "Приглашения отправлены"));
    }

    @GetMapping("/{testId}/invited-users")
    public ResponseEntity<List<String>> getInvitedUsers(@PathVariable UUID testId) {
        return ResponseEntity.ok(testService.getInvitedEmails(testId));
    }

    @PostMapping("/{testId}/questions")
    public ResponseEntity<Question> addQuestion(@PathVariable UUID testId,
                                                @RequestBody Map<String, Object> request) {
        String text = (String) request.get("text");
        Integer sortOrder = request.get("sortOrder") != null ? ((Number) request.get("sortOrder")).intValue() : 0;
        String questionType = (String) request.getOrDefault("questionType", "SINGLE_CHOICE");
        String correctTextAnswer = (String) request.get("correctTextAnswer");
        Double correctNumberAnswer = request.get("correctNumberAnswer") != null ? ((Number) request.get("correctNumberAnswer")).doubleValue() : null;
        Integer points = request.get("points") != null ? ((Number) request.get("points")).intValue() : 1;

        Question question = testService.addQuestion(testId, text, sortOrder, questionType, correctTextAnswer, correctNumberAnswer, points);
        return ResponseEntity.ok(question);
    }

    @PostMapping("/questions/{questionId}/answers")
    public ResponseEntity<Answer> addAnswer(@PathVariable UUID questionId,
                                            @RequestBody Map<String, Object> request) {
        String text = (String) request.get("text");
        boolean isCorrect = request.get("isCorrect") != null && (Boolean) request.get("isCorrect");
        Integer sortOrder = request.get("sortOrder") != null ? ((Number) request.get("sortOrder")).intValue() : 0;

        Answer answer = testService.addAnswer(questionId, text, isCorrect, sortOrder);
        return ResponseEntity.ok(answer);
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Result> submitTest(@PathVariable UUID id, @RequestBody Map<String, Object> submission) {
        UUID userId = UUID.fromString((String) submission.get("userId"));
        Integer timeSpent = submission.get("timeSpent") != null ? ((Number) submission.get("timeSpent")).intValue() : 0;

        @SuppressWarnings("unchecked")
        Map<String, Object> answersMap = (Map<String, Object>) submission.get("answers");

        Result result = testService.submitTestWithDetails(id, userId, answersMap, timeSpent);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/check-attempts")
    public ResponseEntity<Map<String, Object>> checkAttempts(@PathVariable UUID id, @RequestParam UUID userId) {
        int attemptsLeft = testService.getRemainingAttempts(id, userId);
        boolean canTake = (attemptsLeft == Integer.MAX_VALUE) || (attemptsLeft > 0);

        Map<String, Object> response = new HashMap<>();
        response.put("canTake", canTake);

        if (attemptsLeft == Integer.MAX_VALUE) {
            response.put("attemptsLeft", -1);
            response.put("message", "Безлимитное количество попыток");
        } else {
            response.put("attemptsLeft", attemptsLeft);
            response.put("message", attemptsLeft <= 0 ? "Вы исчерпали лимит попыток для этого теста" : "У вас осталось " + attemptsLeft + " попыток");
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<List<Result>> getTestResults(@PathVariable UUID id) {
        return ResponseEntity.ok(testService.getTestResults(id));
    }

    @GetMapping("/user/{userId}/results")
    public ResponseEntity<List<Result>> getUserResults(@PathVariable UUID userId) {
        return ResponseEntity.ok(testService.getUserResults(userId));
    }

    @GetMapping("/results/{resultId}/answers")
    public ResponseEntity<List<UserAnswerDetail>> getResultAnswers(@PathVariable UUID resultId) {
        return ResponseEntity.ok(testService.getResultAnswerDetails(resultId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTest(@PathVariable UUID id) {
        testService.deleteTest(id);
        return ResponseEntity.ok(Map.of("message", "Тест удален"));
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Map<String, String>> deleteQuestion(@PathVariable UUID questionId) {
        testService.deleteQuestion(questionId);
        return ResponseEntity.ok(Map.of("message", "Вопрос удален"));
    }

    @DeleteMapping("/answers/{answerId}")
    public ResponseEntity<Map<String, String>> deleteAnswer(@PathVariable UUID answerId) {
        testService.deleteAnswer(answerId);
        return ResponseEntity.ok(Map.of("message", "Ответ удален"));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TestComment>> getComments(@PathVariable UUID id) {
        return ResponseEntity.ok(testService.getTestComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TestComment> addComment(@PathVariable UUID id,
                                                  @RequestBody Map<String, Object> request) {
        UUID userId = UUID.fromString((String) request.get("userId"));
        String content = (String) request.get("content");
        Integer rating = request.get("rating") != null ? ((Number) request.get("rating")).intValue() : null;

        TestComment comment = testService.addComment(id, userId, content, rating);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Map<String, String>> deleteComment(@PathVariable UUID commentId,
                                                             @RequestBody Map<String, Object> request) {
        UUID userId = (request != null && request.containsKey("userId")) ? UUID.fromString((String) request.get("userId")) : UUID.fromString("00000000-0000-0000-0000-000000000000");
        boolean isAdmin = request != null && request.containsKey("isAdmin") && (Boolean) request.get("isAdmin");

        testService.deleteComment(commentId, userId, isAdmin);
        return ResponseEntity.ok(Map.of("message", "Комментарий удален"));
    }

    @PutMapping("/{id}/comments-enabled")
    public ResponseEntity<Test> toggleCommentsEnabled(@PathVariable UUID id,
                                                      @RequestBody Map<String, Boolean> request) {
        Test test = testService.updateTestCommentsEnabled(id, request.getOrDefault("enabled", false));
        return ResponseEntity.ok(test);
    }

    @PostMapping("/results/{resultId}/send-email")
    public ResponseEntity<Map<String, String>> sendResultToEmail(@PathVariable UUID resultId,
                                                                 @RequestBody Map<String, String> request) {
        testService.sendResultToEmail(resultId, request.get("email"));
        return ResponseEntity.ok(Map.of("message", "Результаты отправлены на почту"));
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.write(filePath, file.getBytes());

            return ResponseEntity.ok(Map.of("url", "/uploads/" + fileName));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Не удалось загрузить файл: " + e.getMessage()));
        }
    }

    @PostMapping("/{testId}/upload-image")
    public ResponseEntity<Test> uploadTestImage(@PathVariable UUID testId, @RequestParam("file") MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String fileName = "test_" + testId + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.write(filePath, file.getBytes());

            Test updatedTest = testService.updateTestImage(testId, "/uploads/" + fileName);
            return ResponseEntity.ok(updatedTest);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping("/questions/{questionId}/upload-image")
    public ResponseEntity<Question> uploadQuestionImage(@PathVariable UUID questionId, @RequestParam("file") MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String fileName = "question_" + questionId + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.write(filePath, file.getBytes());

            Question updatedQuestion = testService.updateQuestionImage(questionId, "/uploads/" + fileName);
            return ResponseEntity.ok(updatedQuestion);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(null);
        }
    }
}