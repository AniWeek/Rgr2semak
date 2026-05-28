package com.testingsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TestingSystemApplication extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(TestingSystemApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(TestingSystemApplication.class, args);
        System.out.println("========================================");
        System.out.println("Система тестирования запущена!");
        System.out.println("http://localhost:8080/testing-system");
        System.out.println("========================================");
    }
}