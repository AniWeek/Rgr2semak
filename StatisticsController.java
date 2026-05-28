package com.testingsystem.controller;

import com.testingsystem.model.Result;
import com.testingsystem.model.Test;
import com.testingsystem.repository.ResultRepository;
import com.testingsystem.repository.TestRepository;
import com.testingsystem.repository.UserRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/statistics")
@CrossOrigin(origins = "http://localhost:5173")
public class StatisticsController {

    private final TestRepository testRepository;
    private final UserRepository userRepository;
    private final ResultRepository resultRepository;

    public StatisticsController(TestRepository testRepository,
                                UserRepository userRepository,
                                ResultRepository resultRepository) {
        this.testRepository = testRepository;
        this.userRepository = userRepository;
        this.resultRepository = resultRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTests", testRepository.count());
        stats.put("totalUsers", userRepository.count());

        Double averageScore = resultRepository.getAverageScoreForAllTests();
        stats.put("averageScore", averageScore != null ? Math.round(averageScore) : 0);
        stats.put("topTests", getTopTests());

        return ResponseEntity.ok(stats);
    }

    private List<Map<String, Object>> getTopTests() {
        List<Test> allTests = testRepository.findAll();
        List<Map<String, Object>> topTests = new ArrayList<>();

        for (Test test : allTests) {
            List<Result> results = resultRepository.findByTestId(test.getId());
            if (results.isEmpty()) continue;

            long attemptsCount = results.size();
            double avgScore = results.stream().mapToDouble(Result::getPercentage).average().orElse(0.0);
            long passedCount = results.stream().filter(Result::getPassed).count();
            double passRate = (passedCount * 100.0) / attemptsCount;

            Map<String, Object> testStats = new HashMap<>();
            testStats.put("id", test.getId());
            testStats.put("title", test.getTitle());
            testStats.put("attempts", attemptsCount);
            testStats.put("avgScore", Math.round(avgScore));
            testStats.put("passRate", Math.round(passRate));
            topTests.add(testStats);
        }

        topTests.sort((a, b) -> Integer.compare((int) b.get("attempts"), (int) a.get("attempts")));
        return topTests.stream().limit(10).collect(Collectors.toList());
    }
}