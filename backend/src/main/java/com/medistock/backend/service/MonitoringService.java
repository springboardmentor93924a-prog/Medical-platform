package com.medistock.backend.service;

import com.medistock.backend.dto.MonitoringDtos.*;
import com.medistock.backend.entity.Medicine;
import com.medistock.backend.entity.OrderStatus;
import com.medistock.backend.entity.StockLog;
import com.medistock.backend.entity.User;
import com.medistock.backend.repository.*;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class MonitoringService {
    private final UserRepository users;
    private final MedicineRepository medicines;
    private final MedicineBatchRepository batches;
    private final PurchaseOrderRepository orders;
    private final StockLogRepository logs;
    private final ErrorLogService errors;
    private final JdbcTemplate jdbc;
    private final ObjectProvider<JavaMailSender> mail;
    private final boolean mailEnabled;
    private final String mailHost;
    private final SettingsService settings;

    public MonitoringService(UserRepository users, MedicineRepository medicines, MedicineBatchRepository batches,
                             PurchaseOrderRepository orders, StockLogRepository logs, ErrorLogService errors,
                             JdbcTemplate jdbc, ObjectProvider<JavaMailSender> mail,
                             @Value("${app.mail.enabled:false}") boolean mailEnabled,
                             @Value("${spring.mail.host:}") String mailHost,
                             SettingsService settings) {
        this.users = users; this.medicines = medicines; this.batches = batches; this.orders = orders;
        this.logs = logs; this.errors = errors; this.jdbc = jdbc; this.mail = mail;
        this.mailEnabled = mailEnabled; this.mailHost = mailHost; this.settings = settings;
    }

    @Transactional(readOnly = true)
    public MonitoringResponse build() {
        List<Check> checks = new ArrayList<>();
        checks.add(new Check("API server", "UP", "Responding to requests"));
        checks.add(databaseCheck());
        boolean mailReady = mailEnabled && mail.getIfAvailable() != null;
        checks.add(mailReady
            ? new Check("Email service", "UP", "Sending through " + mailHost)
            : new Check("Email service", "OFF", "Not switched on. Password reset links are printed in the server log."));
        checks.add(settings.dailyAlertEmail()
            ? new Check("Daily alert email", "UP", "Sent every day at 08:00")
            : new Check("Daily alert email", "OFF", "Switched off in Settings"));

        RuntimeMXBean rt = ManagementFactory.getRuntimeMXBean();
        Runtime runtime = Runtime.getRuntime();
        ServerInfo server = new ServerInfo(Instant.ofEpochMilli(rt.getStartTime()), rt.getUptime() / 1000,
            System.getProperty("java.version"), (runtime.totalMemory() - runtime.freeMemory()) / 1_048_576,
            runtime.maxMemory() / 1_048_576, runtime.availableProcessors());

        List<User> allUsers = users.findAll();
        Instant now = Instant.now();
        long locked = allUsers.stream().filter(u -> u.getLockedUntil() != null && u.getLockedUntil().isAfter(now)).count();
        long active = allUsers.stream().filter(User::isEnabled).count();
        var allOrders = orders.findAll();
        long open = allOrders.stream().filter(o -> o.getStatus() != OrderStatus.RECEIVED
            && o.getStatus() != OrderStatus.CANCELLED && o.getStatus() != OrderStatus.REJECTED).count();
        long awaiting = allOrders.stream().filter(o -> o.getStatus() == OrderStatus.AWAITING_APPROVAL).count();
        Counts counts = new Counts(allUsers.size(), active, allUsers.size() - active, locked,
            medicines.findAll().stream().filter(Medicine::isActive).count(),
            batches.findAll().stream().filter(b -> b.getMedicine().isActive()).count(), open, awaiting);

        List<Activity> activity = logs.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, 10)).stream()
            .map(MonitoringService::activityOf).toList();
        List<Signup> signups = allUsers.stream().sorted(Comparator.comparing(User::getCreatedAt).reversed()).limit(5)
            .map(u -> new Signup(u.getUsername(), u.getRole().name().charAt(0) + u.getRole().name().substring(1).toLowerCase(), u.getCreatedAt()))
            .toList();

        return new MonitoringResponse(now, checks, server, counts, activity, signups, errors.recent());
    }

    private Check databaseCheck() {
        try {
            long start = System.nanoTime();
            String version = jdbc.queryForObject("SELECT VERSION()", String.class);
            return new Check("Database", "UP", "Version " + version + ", answered in " + (System.nanoTime() - start) / 1_000_000 + " ms");
        } catch (Exception e) {
            return new Check("Database", "DOWN", "A test query failed (" + e.getClass().getSimpleName() + ")");
        }
    }

    private static Activity activityOf(StockLog l) {
        var b = l.getBatch();
        String change = (l.getChangeQuantity() > 0 ? "+" : "") + l.getChangeQuantity();
        return new Activity(b.getMedicine().getName() + " (batch " + b.getBatchNumber() + "): " + change + " units, "
            + l.getType().name().toLowerCase().replace('_', ' '),
            l.getPerformedBy() == null ? "System" : l.getPerformedBy().getUsername(), l.getCreatedAt());
    }
}
