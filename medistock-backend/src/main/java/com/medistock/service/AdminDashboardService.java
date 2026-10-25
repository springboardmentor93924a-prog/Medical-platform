package com.medistock.service;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.medistock.dto.dashboard.AdminDashboardResponse;
import com.medistock.dto.dashboard.AdminDashboardResponse.ActivityItem;
import com.medistock.dto.dashboard.AdminDashboardResponse.CategoryStock;
import com.medistock.dto.dashboard.AdminDashboardResponse.ExpiringBatch;
import com.medistock.dto.dashboard.AdminDashboardResponse.LowStockItem;
import com.medistock.dto.dashboard.AdminDashboardResponse.Summary;
import com.medistock.dto.dashboard.AdminDashboardResponse.SupplierOnTime;
import com.medistock.repository.CategoryRepository;
import com.medistock.repository.UserRepository;

@Service
public class AdminDashboardService {

    private static final int EXPIRY_WINDOW_DAYS = 90;
    private static final int LIST_LIMIT = 8;

    // Sellable stock = ACTIVE batches that have not expired (same rule as v_medicine_stock)
    private static final String ACTIVE_MEDICINE_COUNT_SQL =
            "SELECT COUNT(*) FROM medicines WHERE is_active = TRUE";

    private static final String TOTALS_SQL = """
            SELECT COALESCE(SUM(b.quantity_available), 0) AS total_units,
                   COALESCE(SUM(b.quantity_available * b.purchase_price), 0) AS total_value
            FROM inventory_batches b
            JOIN medicines m ON m.id = b.medicine_id
            WHERE m.is_active = TRUE
              AND b.status = 'ACTIVE'
              AND b.expiry_date >= CURRENT_DATE
            """;

    private static final String LOW_STOCK_SQL = """
            SELECT medicine_id, name, reorder_level, total_quantity
            FROM v_medicine_stock
            WHERE stock_status <> 'IN_STOCK'
            ORDER BY total_quantity ASC, name ASC
            """;

    private static final String EXPIRING_SQL = """
            SELECT b.id, m.name, b.batch_number, b.expiry_date, b.quantity_available,
                   (b.expiry_date - CURRENT_DATE) AS days_left
            FROM inventory_batches b
            JOIN medicines m ON m.id = b.medicine_id
            WHERE m.is_active = TRUE
              AND b.status IN ('ACTIVE', 'EXPIRED')
              AND b.quantity_available > 0
              AND b.expiry_date <= CURRENT_DATE + CAST(? AS INTEGER)
            ORDER BY b.expiry_date ASC
            """;

    private static final String CATEGORY_STOCK_SQL = """
            SELECT c.name, COALESCE(SUM(b.quantity_available), 0) AS quantity
            FROM categories c
            LEFT JOIN medicines m
                   ON m.category_id = c.id AND m.is_active = TRUE
            LEFT JOIN inventory_batches b
                   ON b.medicine_id = m.id
                  AND b.status = 'ACTIVE'
                  AND b.expiry_date >= CURRENT_DATE
            GROUP BY c.id, c.name
            ORDER BY c.name ASC
            """;

    private static final String SUPPLIER_SQL = """
            SELECT name, total_orders, on_time_percent
            FROM v_supplier_performance
            ORDER BY name ASC
            """;

    private static final String ACTIVITY_SQL = """
            SELECT s.id, s.movement_type, s.quantity_change, m.name AS medicine_name,
                   u.full_name, s.reason, s.created_at
            FROM stock_logs s
            JOIN medicines m ON m.id = s.medicine_id
            JOIN users u ON u.id = s.performed_by
            ORDER BY s.created_at DESC
            LIMIT 5
            """;

    private final JdbcTemplate jdbc;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public AdminDashboardService(
            JdbcTemplate jdbc,
            UserRepository userRepository,
            CategoryRepository categoryRepository) {
        this.jdbc = jdbc;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        Long medicineCount = jdbc.queryForObject(ACTIVE_MEDICINE_COUNT_SQL, Long.class);

        Map<String, Object> totals = jdbc.queryForMap(TOTALS_SQL);
        long totalUnits = ((Number) totals.get("total_units")).longValue();
        BigDecimal totalValue = new BigDecimal(totals.get("total_value").toString());

        List<LowStockItem> lowAll = jdbc.query(LOW_STOCK_SQL, (rs, i) -> new LowStockItem(
                rs.getLong("medicine_id"),
                rs.getString("name"),
                rs.getLong("total_quantity"),
                rs.getInt("reorder_level")));

        List<ExpiringBatch> expiringAll = jdbc.query(EXPIRING_SQL, (rs, i) -> new ExpiringBatch(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("batch_number"),
                rs.getDate("expiry_date").toLocalDate(),
                rs.getInt("quantity_available"),
                rs.getInt("days_left")), EXPIRY_WINDOW_DAYS);

        List<CategoryStock> categories = jdbc.query(CATEGORY_STOCK_SQL, (rs, i) -> new CategoryStock(
                rs.getString("name"),
                rs.getLong("quantity")));

        List<SupplierOnTime> suppliers = jdbc.query(SUPPLIER_SQL, (rs, i) -> {
            BigDecimal percent = rs.getBigDecimal("on_time_percent");
            return new SupplierOnTime(
                    rs.getString("name"),
                    rs.getLong("total_orders"),
                    percent == null ? BigDecimal.ZERO : percent);
        });

        List<ActivityItem> activity = jdbc.query(ACTIVITY_SQL, (rs, i) -> {
            Timestamp createdAt = rs.getTimestamp("created_at");
            return new ActivityItem(
                    rs.getLong("id"),
                    rs.getString("movement_type"),
                    rs.getInt("quantity_change"),
                    rs.getString("medicine_name"),
                    rs.getString("full_name"),
                    rs.getString("reason"),
                    createdAt == null ? null : createdAt.toInstant());
        });

        Summary summary = new Summary(
                userRepository.count(),
                medicineCount == null ? 0 : medicineCount,
                categoryRepository.count(),
                lowAll.size(),
                expiringAll.size(),
                totalUnits,
                totalValue);

        return new AdminDashboardResponse(
                summary,
                lowAll.stream().limit(LIST_LIMIT).toList(),
                expiringAll.stream().limit(LIST_LIMIT).toList(),
                categories,
                suppliers,
                activity);
    }
}