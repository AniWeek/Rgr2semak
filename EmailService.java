package com.testingsystem.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.base-url}")
    private String baseUrl;

    public EmailService(JavaMailSender mailSender, TemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    public void sendVerificationEmail(String to, String name, String verificationCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Подтверждение регистрации - Система тестирования");

            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("verificationCode", verificationCode);
            context.setVariable("verificationUrl", baseUrl + "/api/auth/verify?code=" + verificationCode);

            String htmlContent = templateEngine.process("verification-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("Письмо отправлено на: " + to);

        } catch (MessagingException e) {
            System.err.println("Ошибка при отправке письма: " + e.getMessage());
            throw new RuntimeException("Не удалось отправить письмо подтверждения");
        }
    }

    public void sendPasswordResetEmail(String to, String name, String resetCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Восстановление пароля - Система тестирования");

            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("resetCode", resetCode);
            context.setVariable("resetUrl", baseUrl + "/api/auth/reset-password?code=" + resetCode);

            String htmlContent = templateEngine.process("reset-password-email", context);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("Письмо для сброса пароля отправлено на: " + to);

        } catch (MessagingException e) {
            System.err.println("Ошибка при отправке письма: " + e.getMessage());
            throw new RuntimeException("Не удалось отправить письмо для сброса пароля");
        }
    }

    public void sendTestResultEmail(String to, String userName, String testTitle, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Результаты теста \"" + testTitle + "\" - Система тестирования");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("Результаты теста отправлены на: " + to);

        } catch (MessagingException e) {
            System.err.println("Ошибка при отправке результатов теста: " + e.getMessage());
            throw new RuntimeException("Не удалось отправить результаты теста на почту");
        }
    }
}