package com.testingsystem.service;

import com.testingsystem.model.*;
import com.testingsystem.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TestService {

    private final TestRepository testRepository;
    private final CustomTestRepository customTestRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final ResultRepository resultRepository;
    private final UserAnswerDetailRepository userAnswerDetailRepository;
    private final TestInvitationRepository testInvitationRepository;
    private final TestCommentRepository testCommentRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final EmailService emailService;

    public TestService(TestRepository testRepository,
                       CustomTestRepository customTestRepository,
                       QuestionRepository questionRepository,
                       AnswerRepository answerRepository,
                       ResultRepository resultRepository,
                       UserAnswerDetailRepository userAnswerDetailRepository,
                       TestInvitationRepository testInvitationRepository,
                       TestCommentRepository testCommentRepository,
                       UserRepository userRepository,
                       UserService userService,
                       EmailService emailService) {
        this.testRepository = testRepository;
        this.customTestRepository = customTestRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.resultRepository = resultRepository;
        this.userAnswerDetailRepository = userAnswerDetailRepository;
        this.testInvitationRepository = testInvitationRepository;
        this.testCommentRepository = testCommentRepository;
        this.userRepository = userRepository;
        this.userService = userService;
        this.emailService = emailService;
    }

    // ========== Базовые методы получения тестов ==========

    public List<Test> getAllTests(String userEmail) {
        List<Test> allTests = testRepository.findAll();

        if (userEmail == null || userEmail.trim().isEmpty()) {
            return allTests.stream()
                    .filter(test -> test.getIsPrivate() == null || !test.getIsPrivate())
                    .peek(test -> {
                        long count = questionRepository.countByTestId(test.getId());
                        test.setQuestionsCount((int) count);
                    })
                    .collect(Collectors.toList());
        }

        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return allTests.stream()
                    .filter(test -> test.getIsPrivate() == null || !test.getIsPrivate())
                    .peek(test -> {
                        long count = questionRepository.countByTestId(test.getId());
                        test.setQuestionsCount((int) count);
                    })
                    .collect(Collectors.toList());
        }

        User user = userOpt.get();
        boolean isAdmin = "ADMIN".equals(user.getRole());
        String userId = user.getId().toString();

        List<String> invitedTestIds = testInvitationRepository.findByUserEmail(userEmail)
                .stream()
                .map(inv -> inv.getTestId().toString())
                .collect(Collectors.toList());

        return allTests.stream()
                .filter(test -> {
                    if (isAdmin) {
                        return true;
                    }
                    boolean isPublic = test.getIsPrivate() == null || !test.getIsPrivate();
                    boolean isInvited = invitedTestIds.contains(test.getId().toString());
                    boolean isOwn = test.getCreatedBy() != null && test.getCreatedBy().toString().equals(userId);
                    return isPublic || isInvited || isOwn;
                })
                .peek(test -> {
                    long count = questionRepository.countByTestId(test.getId());
                    test.setQuestionsCount((int) count);
                })
                .collect(Collectors.toList());
    }

    public List<Test> getAllTestsWithFilters(String userEmail, String category, LocalDateTime dateFrom, LocalDateTime dateTo) {
        List<Test> allTests = customTestRepository.findTestsWithFilters(category, dateFrom, dateTo);

        if (userEmail == null || userEmail.trim().isEmpty()) {
            return allTests.stream()
                    .filter(test -> test.getIsPrivate() == null || !test.getIsPrivate())
                    .peek(test -> {
                        long count = questionRepository.countByTestId(test.getId());
                        test.setQuestionsCount((int) count);
                    })
                    .collect(Collectors.toList());
        }

        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return allTests.stream()
                    .filter(test -> test.getIsPrivate() == null || !test.getIsPrivate())
                    .peek(test -> {
                        long count = questionRepository.countByTestId(test.getId());
                        test.setQuestionsCount((int) count);
                    })
                    .collect(Collectors.toList());
        }

        User user = userOpt.get();
        boolean isAdmin = "ADMIN".equals(user.getRole());
        String userId = user.getId().toString();

        List<String> invitedTestIds = testInvitationRepository.findByUserEmail(userEmail)
                .stream()
                .map(inv -> inv.getTestId().toString())
                .collect(Collectors.toList());

        return allTests.stream()
                .filter(test -> {
                    if (isAdmin) {
                        return true;
                    }
                    boolean isPublic = test.getIsPrivate() == null || !test.getIsPrivate();
                    boolean isInvited = invitedTestIds.contains(test.getId().toString());
                    boolean isOwn = test.getCreatedBy() != null && test.getCreatedBy().toString().equals(userId);
                    return isPublic || isInvited || isOwn;
                })
                .peek(test -> {
                    long count = questionRepository.countByTestId(test.getId());
                    test.setQuestionsCount((int) count);
                })
                .collect(Collectors.toList());
    }

    public Test getTestById(UUID id) {
        Test test = testRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Тест не найден"));
        long count = questionRepository.countByTestId(test.getId());
        test.setQuestionsCount((int) count);
        return test;
    }

    // ========== Создание и обновление тестов ==========

    public Test createTest(String title, String description, Integer duration,
                           LocalDate deadline, UUID createdBy, Integer maxAttempts,
                           Boolean isPrivate, Boolean commentsEnabled,
                           Boolean randomizeQuestions, Boolean allowNavigationBack,
                           Boolean allowSkipQuestions, String category) {
        Test test = new Test();
        test.setTitle(title);
        test.setDescription(description);
        test.setDuration(duration);
        test.setDeadline(deadline);
        test.setCreatedBy(createdBy);
        test.setStatus("AVAILABLE");
        test.setMaxAttempts(maxAttempts);
        test.setIsPrivate(isPrivate != null && isPrivate);
        test.setCommentsEnabled(commentsEnabled != null && commentsEnabled);
        test.setRandomizeQuestions(randomizeQuestions != null && randomizeQuestions);
        test.setAllowNavigationBack(allowNavigationBack == null || allowNavigationBack);
        test.setAllowSkipQuestions(allowSkipQuestions == null || allowSkipQuestions);
        test.setCategory(category != null ? category : "GENERAL");

        Test savedTest = testRepository.save(test);
        System.out.println("Создан тест: " + savedTest.getTitle() + " (ID: " + savedTest.getId() + ", категория: " + savedTest.getCategory() + ")");
        return savedTest;
    }

    public Test updateTest(UUID id, String title, String description, Integer duration,
                           LocalDate deadline, Integer maxAttempts, Boolean commentsEnabled,
                           Boolean randomizeQuestions, Boolean allowNavigationBack,
                           Boolean allowSkipQuestions, String category) {
        Test test = getTestById(id);
        test.setTitle(title);
        test.setDescription(description);
        test.setDuration(duration);
        test.setDeadline(deadline);
        test.setMaxAttempts(maxAttempts);
        if (commentsEnabled != null) {
            test.setCommentsEnabled(commentsEnabled);
        }
        if (randomizeQuestions != null) {
            test.setRandomizeQuestions(randomizeQuestions);
        }
        if (allowNavigationBack != null) {
            test.setAllowNavigationBack(allowNavigationBack);
        }
        if (allowSkipQuestions != null) {
            test.setAllowSkipQuestions(allowSkipQuestions);
        }
        if (category != null) {
            test.setCategory(category);
        }
        return testRepository.save(test);
    }

    public Test updateTestImage(UUID testId, String imageUrl) {
        Test test = getTestById(testId);
        test.setImageUrl(imageUrl);
        return testRepository.save(test);
    }

    public Test updateTestCommentsEnabled(UUID testId, boolean enabled) {
        Test test = getTestById(testId);
        test.setCommentsEnabled(enabled);
        return testRepository.save(test);
    }

    // ========== Комментарии ==========

    public List<TestComment> getTestComments(UUID testId) {
        return testCommentRepository.findByTestIdOrderByCreatedAtDesc(testId);
    }

    public TestComment addComment(UUID testId, UUID userId, String content, Integer rating) {
        Test test = getTestById(testId);

        if (!test.getCommentsEnabled()) {
            throw new RuntimeException("Комментарии к этому тесту отключены");
        }

        User user = userService.getUserById(userId);

        TestComment comment = new TestComment(test, userId, user.getName(), content, rating);
        return testCommentRepository.save(comment);
    }

    public void deleteComment(UUID commentId, UUID userId, boolean isAdmin) {
        TestComment comment = testCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Комментарий не найден"));

        if (!isAdmin && !comment.getUserId().equals(userId)) {
            throw new RuntimeException("Вы можете удалить только свои комментарии");
        }

        testCommentRepository.delete(comment);
    }

    // ========== Приглашения ==========

    public void inviteUsersToTest(UUID testId, List<String> emails, UUID invitedBy) {
        for (String email : emails) {
            String normalizedEmail = email.trim().toLowerCase();
            if (!testInvitationRepository.existsByTestIdAndUserEmail(testId, normalizedEmail)) {
                TestInvitation invitation = new TestInvitation(testId, normalizedEmail, invitedBy);
                testInvitationRepository.save(invitation);
                System.out.println("Приглашение отправлено: " + normalizedEmail + " для теста " + testId);
            }
        }
    }

    public List<String> getInvitedEmails(UUID testId) {
        return testInvitationRepository.findByTestId(testId)
                .stream()
                .map(TestInvitation::getUserEmail)
                .map(String::toLowerCase)
                .collect(Collectors.toList());
    }

    // ========== Вопросы и ответы ==========

    public Question addQuestion(UUID testId, String text, Integer sortOrder,
                                String questionType, String correctTextAnswer,
                                Double correctNumberAnswer, Integer points) {
        Test test = getTestById(testId);

        Question question = new Question();
        question.setTest(test);
        question.setText(text);
        question.setSortOrder(sortOrder != null ? sortOrder : 0);
        question.setQuestionType(questionType != null ? questionType : "SINGLE_CHOICE");
        question.setCorrectTextAnswer(correctTextAnswer);
        question.setCorrectNumberAnswer(correctNumberAnswer);
        question.setPoints(points != null && points > 0 ? points : 1);

        Question savedQuestion = questionRepository.save(question);
        System.out.println("Добавлен вопрос к тесту " + testId + ": " + text + " (баллов: " + savedQuestion.getPoints() + ")");
        return savedQuestion;
    }

    public Answer addAnswer(UUID questionId, String text, boolean isCorrect, Integer sortOrder) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Вопрос не найден"));

        Answer answer = new Answer();
        answer.setQuestion(question);
        answer.setText(text);
        answer.setIsCorrect(isCorrect);
        answer.setSortOrder(sortOrder != null ? sortOrder : 0);

        Answer savedAnswer = answerRepository.save(answer);
        System.out.println("Добавлен ответ к вопросу " + questionId + ": " + text);
        return savedAnswer;
    }

    public List<Question> getQuestionsWithAnswers(UUID testId) {
        List<Question> questions = questionRepository.findByTestIdOrderBySortOrder(testId);
        System.out.println("Загружено вопросов для теста " + testId + ": " + questions.size());

        for (Question question : questions) {
            if ("SINGLE_CHOICE".equals(question.getQuestionType()) || "MULTIPLE_CHOICE".equals(question.getQuestionType())) {
                List<Answer> answers = answerRepository.findByQuestionIdOrderBySortOrder(question.getId());
                question.setAnswers(answers);
                System.out.println("  Вопрос " + question.getId() + " имеет " + answers.size() + " ответов");
            }
        }

        return questions;
    }

    public List<Question> getQuestionsForTaking(UUID testId) {
        Test test = getTestById(testId);
        List<Question> questions = getQuestionsWithAnswers(testId);

        if (test.getRandomizeQuestions() != null && test.getRandomizeQuestions()) {
            List<Question> shuffledQuestions = new ArrayList<>(questions);
            Collections.shuffle(shuffledQuestions);
            System.out.println("Вопросы перемешаны для теста " + testId);
            return shuffledQuestions;
        }

        return questions;
    }

    public Question getQuestionById(UUID questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Вопрос не найден"));
    }

    public Question updateQuestionImage(UUID questionId, String imageUrl) {
        Question question = getQuestionById(questionId);
        question.setImageUrl(imageUrl);
        return questionRepository.save(question);
    }

    // ========== Попытки прохождения ==========

    public int getRemainingAttempts(UUID testId, UUID userId) {
        Test test = getTestById(testId);
        User user = userService.getUserById(userId);

        if ("ADMIN".equals(user.getRole())) {
            System.out.println("ADMIN - безлимитные попытки");
            return Integer.MAX_VALUE;
        }

        if (test.getCreatedBy() != null && test.getCreatedBy().equals(userId)) {
            System.out.println("Создатель теста - безлимитные попытки");
            return Integer.MAX_VALUE;
        }

        if (test.getMaxAttempts() == null || test.getMaxAttempts() == 0) {
            return Integer.MAX_VALUE;
        }

        long attemptsCount = resultRepository.countByUserIdAndTestId(userId, testId);
        int remaining = test.getMaxAttempts() - (int) attemptsCount;

        System.out.println("getRemainingAttempts: max=" + test.getMaxAttempts() +
                ", used=" + attemptsCount + ", remaining=" + remaining);

        return Math.max(remaining, 0);
    }

    @Transactional
    public Result submitTestWithDetails(UUID testId, UUID userId, Map<String, Object> userAnswers, Integer timeSpent) {
        Test test = getTestById(testId);
        User user = userService.getUserById(userId);

        boolean isAdmin = "ADMIN".equals(user.getRole());
        boolean isCreator = test.getCreatedBy() != null && test.getCreatedBy().equals(userId);

        if (!isAdmin && !isCreator) {
            int remaining = getRemainingAttempts(testId, userId);
            if (remaining <= 0) {
                throw new RuntimeException("Вы исчерпали лимит попыток для этого теста");
            }
        } else {
            System.out.println("Администратор или создатель теста - результат не будет учитываться в статистике");
        }

        List<Question> questions = getQuestionsWithAnswers(testId);

        if (questions.isEmpty()) {
            throw new RuntimeException("В тесте нет вопросов");
        }

        int totalPoints = 0;
        int earnedPoints = 0;
        int earnedScoreCount = 0;

        Result result = new Result();
        result.setUserId(userId);
        result.setTestId(testId);
        result.setTimeSpent(timeSpent != null ? timeSpent : 0);
        result.setCompletedAt(LocalDateTime.now());

        Result savedResult = resultRepository.save(result);

        List<UserAnswerDetail> userAnswerDetails = new ArrayList<>();

        for (Question question : questions) {
            Object answerData = userAnswers.get(question.getId().toString());
            UserAnswerDetail detail = new UserAnswerDetail();
            detail.setResultId(savedResult.getId());
            detail.setQuestionId(question.getId());
            detail.setPointsMax(question.getPoints());

            boolean isCorrect = false;
            totalPoints += question.getPoints();

            if (answerData == null) {
                detail.setIsCorrect(false);
                detail.setPointsEarned(0);
                userAnswerDetails.add(detail);
                continue;
            }

            switch (question.getQuestionType()) {
                case "SINGLE_CHOICE":
                    try {
                        UUID answerId = UUID.fromString((String) answerData);
                        detail.setAnswerId(answerId);
                        Optional<Answer> answerOpt = answerRepository.findById(answerId);
                        if (answerOpt.isPresent()) {
                            isCorrect = answerOpt.get().getIsCorrect();
                        }
                    } catch (Exception e) {
                        System.err.println("Ошибка обработки SINGLE_CHOICE: " + e.getMessage());
                    }
                    break;

                case "MULTIPLE_CHOICE":
                    try {
                        @SuppressWarnings("unchecked")
                        List<String> selectedIds = (List<String>) answerData;
                        detail.setSelectedAnswerIds(String.join(",", selectedIds));

                        List<Answer> correctAnswers = answerRepository.findByQuestionIdAndIsCorrectTrue(question.getId());
                        Set<String> correctIds = correctAnswers.stream()
                                .map(a -> a.getId().toString())
                                .collect(Collectors.toSet());
                        Set<String> selectedSet = new HashSet<>(selectedIds);

                        isCorrect = selectedSet.equals(correctIds) && !selectedSet.isEmpty();
                    } catch (Exception e) {
                        System.err.println("Ошибка обработки MULTIPLE_CHOICE: " + e.getMessage());
                    }
                    break;

                case "TEXT_INPUT":
                    String userText = (String) answerData;
                    detail.setTextAnswer(userText);
                    isCorrect = question.getCorrectTextAnswer() != null &&
                            userText.trim().equalsIgnoreCase(question.getCorrectTextAnswer().trim());
                    break;

                case "NUMBER_INPUT":
                    try {
                        Double userNumber = ((Number) answerData).doubleValue();
                        detail.setNumberAnswer(userNumber);
                        isCorrect = question.getCorrectNumberAnswer() != null &&
                                Math.abs(userNumber - question.getCorrectNumberAnswer()) < 0.0001;
                    } catch (Exception e) {
                        System.err.println("Ошибка обработки NUMBER_INPUT: " + e.getMessage());
                    }
                    break;

                default:
                    try {
                        UUID answerId = UUID.fromString((String) answerData);
                        detail.setAnswerId(answerId);
                        Optional<Answer> answerOpt = answerRepository.findById(answerId);
                        if (answerOpt.isPresent()) {
                            isCorrect = answerOpt.get().getIsCorrect();
                        }
                    } catch (Exception e) {
                        System.err.println("Ошибка обработки DEFAULT: " + e.getMessage());
                    }
                    break;
            }

            detail.setIsCorrect(isCorrect);
            if (isCorrect) {
                earnedPoints += question.getPoints();
                earnedScoreCount++;
                detail.setPointsEarned(question.getPoints());
            } else {
                detail.setPointsEarned(0);
            }
            userAnswerDetails.add(detail);
        }

        userAnswerDetailRepository.saveAll(userAnswerDetails);

        double percentage = totalPoints > 0 ? ((double) earnedPoints / totalPoints) * 100 : 0;
        boolean passed = percentage >= 70;

        savedResult.setScore(earnedScoreCount);
        savedResult.setPointsEarned(earnedPoints);
        savedResult.setPointsTotal(totalPoints);
        savedResult.setPercentage(percentage);
        savedResult.setPassed(passed);

        Result finalResult = resultRepository.save(savedResult);

        if (!isAdmin && !isCreator) {
            updateUserStats(userId);
            System.out.println("Статистика пользователя обновлена (добавлено баллов: " + earnedPoints + ")");
        } else {
            System.out.println("Результат не добавлен в статистику (админ/создатель)");
        }

        return finalResult;
    }

    public List<UserAnswerDetail> getResultAnswerDetails(UUID resultId) {
        return userAnswerDetailRepository.findByResultId(resultId);
    }

    private void updateUserStats(UUID userId) {
        User user = userService.getUserById(userId);

        List<Result> userResults = resultRepository.findByUserId(userId);

        List<Result> validResults = userResults.stream()
                .filter(result -> {
                    Test test = getTestById(result.getTestId());
                    boolean isCreator = test.getCreatedBy() != null && test.getCreatedBy().equals(userId);
                    boolean isAdmin = "ADMIN".equals(user.getRole());
                    return !isCreator && !isAdmin;
                })
                .collect(Collectors.toList());

        int totalTests = validResults.size();
        double avgScore = validResults.stream()
                .mapToDouble(Result::getPercentage)
                .average()
                .orElse(0.0);

        int totalPoints = validResults.stream()
                .mapToInt(Result::getPointsEarned)
                .sum();

        user.setTestsCompleted(totalTests);
        user.setAvgScore(avgScore);
        user.setTotalPoints(totalPoints);
        userService.updateUserStats(user);

        System.out.println("Статистика пользователя обновлена: тестов=" + totalTests +
                ", средний балл=" + avgScore + ", всего баллов=" + totalPoints);
    }

    // ========== Результаты ==========

    public List<Result> getUserResults(UUID userId) {
        return resultRepository.findByUserIdOrderByCompletedAtDesc(userId);
    }

    public List<Result> getTestResults(UUID testId) {
        return resultRepository.findByTestIdOrderByCompletedAtDesc(testId);
    }

    public List<Map<String, Object>> getTestResultsWithUsers(UUID testId) {
        List<Result> results = resultRepository.findByTestIdOrderByCompletedAtDesc(testId);
        List<Map<String, Object>> resultWithUsers = new ArrayList<>();

        for (Result result : results) {
            Optional<User> userOpt = userRepository.findById(result.getUserId());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Map<String, Object> item = new HashMap<>();
                item.put("result", result);

                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("name", user.getName());
                userInfo.put("email", user.getEmail());
                item.put("user", userInfo);

                resultWithUsers.add(item);
            }
        }

        return resultWithUsers;
    }

    // ========== Удаление ==========

    @Transactional
    public void deleteTest(UUID testId) {
        List<Result> results = resultRepository.findByTestId(testId);
        for (Result result : results) {
            userAnswerDetailRepository.deleteByResultId(result.getId());
        }
        resultRepository.deleteAll(results);
        testInvitationRepository.deleteByTestId(testId);
        testCommentRepository.deleteByTestId(testId);

        List<Question> questions = questionRepository.findByTestId(testId);
        for (Question question : questions) {
            answerRepository.deleteByQuestionId(question.getId());
        }
        questionRepository.deleteByTestId(testId);

        testRepository.deleteById(testId);
    }

    public void deleteQuestion(UUID questionId) {
        userAnswerDetailRepository.deleteByQuestionId(questionId);
        answerRepository.deleteByQuestionId(questionId);
        questionRepository.deleteById(questionId);
    }

    public void deleteAnswer(UUID answerId) {
        answerRepository.deleteById(answerId);
    }

    @Transactional
    public void deleteAllQuestionsAndAnswers(UUID testId) {
        List<Question> questions = questionRepository.findByTestId(testId);
        for (Question question : questions) {
            answerRepository.deleteByQuestionId(question.getId());
        }
        questionRepository.deleteByTestId(testId);
    }

    @Transactional
    public void updateTestQuestions(UUID testId, List<Map<String, Object>> questionsData) {
        deleteAllQuestionsAndAnswers(testId);

        for (int i = 0; i < questionsData.size(); i++) {
            Map<String, Object> qData = questionsData.get(i);

            String text = (String) qData.get("text");
            String questionType = (String) qData.getOrDefault("questionType", "SINGLE_CHOICE");
            String correctTextAnswer = (String) qData.get("correctTextAnswer");
            Double correctNumberAnswer = qData.get("correctNumberAnswer") != null ? ((Number) qData.get("correctNumberAnswer")).doubleValue() : null;
            Integer points = qData.get("points") != null ? ((Number) qData.get("points")).intValue() : 1;

            Question question = addQuestion(testId, text, i, questionType, correctTextAnswer, correctNumberAnswer, points);

            if ("SINGLE_CHOICE".equals(questionType) || "MULTIPLE_CHOICE".equals(questionType)) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> answers = (List<Map<String, Object>>) qData.get("answers");
                if (answers != null) {
                    for (int j = 0; j < answers.size(); j++) {
                        Map<String, Object> aData = answers.get(j);
                        String answerText = (String) aData.get("text");
                        boolean isCorrect = (Boolean) aData.getOrDefault("isCorrect", false);
                        addAnswer(question.getId(), answerText, isCorrect, j);
                    }
                }
            }
        }
    }

    // ========== Статистика ==========

    public long getTotalTestsCount() {
        return testRepository.count();
    }

    public long getCompletedTestsCount() {
        return resultRepository.countDistinctTestIdsWithResultsExcludingAdminsAndCreators();
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void updateExpiredTests() {
        List<Test> expiredTests = testRepository.findExpiredTests();
        for (Test test : expiredTests) {
            test.setStatus("EXPIRED");
            testRepository.save(test);
        }
    }

    // ========== Отправка результатов на email ==========

    @Transactional
    public void sendResultToEmail(UUID resultId, String email) {
        Result result = resultRepository.findById(resultId)
                .orElseThrow(() -> new RuntimeException("Результат не найден"));

        Test test = getTestById(result.getTestId());
        User user = userService.getUserById(result.getUserId());
        List<UserAnswerDetail> answerDetails = userAnswerDetailRepository.findByResultId(resultId);
        List<Question> questions = getQuestionsWithAnswers(test.getId());

        String htmlContent = buildResultEmailHtml(test, user, result, questions, answerDetails);
        emailService.sendTestResultEmail(email, user.getName(), test.getTitle(), htmlContent);
    }

    private String buildResultEmailHtml(Test test, User user, Result result, List<Question> questions, List<UserAnswerDetail> answerDetails) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");
        StringBuilder sb = new StringBuilder();

        sb.append("<!DOCTYPE html>");
        sb.append("<html>");
        sb.append("<head><meta charset='UTF-8'><title>Результаты теста</title>");
        sb.append("<style>");
        sb.append("body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        sb.append(".container { max-width: 800px; margin: 0 auto; padding: 20px; }");
        sb.append(".header { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }");
        sb.append(".content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }");
        sb.append(".score-card { background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }");
        sb.append(".score { font-size: 36px; font-weight: bold; color: #6366F1; }");
        sb.append(".passed { color: #10b981; }");
        sb.append(".failed { color: #ef4444; }");
        sb.append(".question-item { background: white; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #6366F1; }");
        sb.append(".correct { border-left-color: #10b981; background: #f0fdf4; }");
        sb.append(".incorrect { border-left-color: #ef4444; background: #fef2f2; }");
        sb.append(".points { font-size: 12px; color: #f59e0b; }");
        sb.append("</style>");
        sb.append("</head>");
        sb.append("<body>");
        sb.append("<div class='container'>");
        sb.append("<div class='header'>");
        sb.append("<h1>Результаты теста</h1>");
        sb.append("<h2>").append(escapeHtml(test.getTitle())).append("</h2>");
        sb.append("</div>");
        sb.append("<div class='content'>");

        sb.append("<div class='score-card'>");
        sb.append("<p><strong>Пользователь:</strong> ").append(escapeHtml(user.getName())).append(" (").append(escapeHtml(user.getEmail())).append(")</p>");
        sb.append("<p><strong>Дата прохождения:</strong> ").append(result.getCompletedAt().format(formatter)).append("</p>");
        sb.append("<p><strong>Затрачено времени:</strong> ").append(formatTime(result.getTimeSpent())).append("</p>");
        sb.append("</div>");

        sb.append("<div class='score-card'>");
        sb.append("<p><strong>Результат:</strong> <span class='score'>").append(Math.round(result.getPercentage())).append("%</span></p>");
        sb.append("<p><strong>Набрано баллов:</strong> ").append(result.getPointsEarned()).append(" из ").append(result.getPointsTotal()).append("</p>");
        sb.append("<p><strong>Статус:</strong> <span class='").append(result.getPassed() ? "passed" : "failed").append("'>").append(result.getPassed() ? "✅ ПРОЙДЕН" : "❌ НЕ ПРОЙДЕН").append("</span></p>");
        sb.append("</div>");

        sb.append("<h3>Детальные результаты</h3>");

        Map<UUID, UserAnswerDetail> answerMap = new HashMap<>();
        for (UserAnswerDetail ad : answerDetails) {
            answerMap.put(ad.getQuestionId(), ad);
        }

        for (int i = 0; i < questions.size(); i++) {
            Question q = questions.get(i);
            UserAnswerDetail ua = answerMap.get(q.getId());
            boolean isCorrect = ua != null && ua.getIsCorrect();

            sb.append("<div class='question-item ").append(isCorrect ? "correct" : "incorrect").append("'>");
            sb.append("<p><strong>Вопрос ").append(i + 1).append(":</strong> ").append(escapeHtml(q.getText())).append("</p>");
            sb.append("<p class='points'>🎯 Баллы: ").append(ua != null ? ua.getPointsEarned() : 0).append(" / ").append(q.getPoints()).append("</p>");

            sb.append("<p><strong>Ваш ответ:</strong> ");
            if (ua != null) {
                switch (q.getQuestionType()) {
                    case "SINGLE_CHOICE":
                        if (ua.getAnswerId() != null) {
                            Answer selected = q.getAnswers().stream().filter(a -> a.getId().equals(ua.getAnswerId())).findFirst().orElse(null);
                            sb.append(escapeHtml(selected != null ? selected.getText() : "Не выбран"));
                        } else {
                            sb.append("Не выбран");
                        }
                        break;
                    case "MULTIPLE_CHOICE":
                        if (ua.getSelectedAnswerIds() != null && !ua.getSelectedAnswerIds().isEmpty()) {
                            List<String> selectedIds = Arrays.asList(ua.getSelectedAnswerIds().split(","));
                            List<String> selectedTexts = q.getAnswers().stream()
                                    .filter(a -> selectedIds.contains(a.getId().toString()))
                                    .map(Answer::getText)
                                    .collect(Collectors.toList());
                            sb.append(escapeHtml(String.join(", ", selectedTexts)));
                        } else {
                            sb.append("Не выбраны");
                        }
                        break;
                    case "TEXT_INPUT":
                        sb.append(escapeHtml(ua.getTextAnswer() != null ? ua.getTextAnswer() : "Не введен"));
                        break;
                    case "NUMBER_INPUT":
                        sb.append(ua.getNumberAnswer() != null ? String.valueOf(ua.getNumberAnswer()) : "Не введен");
                        break;
                }
            } else {
                sb.append("Не отвечен");
            }
            sb.append("</p>");

            if (!isCorrect) {
                sb.append("<p><strong>Правильный ответ:</strong> ");
                switch (q.getQuestionType()) {
                    case "SINGLE_CHOICE":
                        Answer correct = q.getAnswers().stream().filter(Answer::getIsCorrect).findFirst().orElse(null);
                        sb.append(escapeHtml(correct != null ? correct.getText() : "Не указан"));
                        break;
                    case "MULTIPLE_CHOICE":
                        List<String> correctTexts = q.getAnswers().stream()
                                .filter(Answer::getIsCorrect)
                                .map(Answer::getText)
                                .collect(Collectors.toList());
                        sb.append(escapeHtml(String.join(", ", correctTexts)));
                        break;
                    case "TEXT_INPUT":
                        sb.append(escapeHtml(q.getCorrectTextAnswer() != null ? q.getCorrectTextAnswer() : "Не указан"));
                        break;
                    case "NUMBER_INPUT":
                        sb.append(q.getCorrectNumberAnswer() != null ? String.valueOf(q.getCorrectNumberAnswer()) : "Не указан");
                        break;
                }
                sb.append("</p>");
            }

            sb.append("</div>");
        }

        sb.append("</div>");
        sb.append("</div>");
        sb.append("</body>");
        sb.append("</html>");

        return sb.toString();
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String formatTime(int seconds) {
        int minutes = seconds / 60;
        int secs = seconds % 60;
        return String.format("%02d:%02d", minutes, secs);
    }
}