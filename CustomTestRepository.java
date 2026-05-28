package com.testingsystem.repository;

import com.testingsystem.model.Test;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class CustomTestRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public List<Test> findTestsWithFilters(String category, LocalDateTime dateFrom, LocalDateTime dateTo) {
        StringBuilder sql = new StringBuilder("SELECT * FROM tests t WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (category != null && !category.isEmpty()) {
            sql.append(" AND t.category = ?");
            params.add(category);
        }

        if (dateFrom != null) {
            sql.append(" AND t.created_at >= ?");
            params.add(dateFrom);
        }

        if (dateTo != null) {
            sql.append(" AND t.created_at <= ?");
            params.add(dateTo);
        }

        sql.append(" ORDER BY t.created_at DESC");

        Query query = entityManager.createNativeQuery(sql.toString(), Test.class);
        for (int i = 0; i < params.size(); i++) {
            query.setParameter(i + 1, params.get(i));
        }

        return query.getResultList();
    }
}