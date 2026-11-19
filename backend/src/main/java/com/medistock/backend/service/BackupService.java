package com.medistock.backend.service;

import com.medistock.backend.dto.BackupDtos.*;
import com.medistock.backend.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.rowset.SqlRowSet;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Backup and restore of all application data as one JSON file.
 * A restore replaces everything, in one transaction, so a failed restore changes nothing.
 * Backup files contain password hashes, so they must be kept private.
 */
@Service
public class BackupService {
    private static final Logger log = LoggerFactory.getLogger(BackupService.class);
    // Parents come before the tables that point to them. Deleting goes in the opposite order.
    private static final List<String> ORDER = List.of("suppliers", "users", "categories", "medicines", "medicine_batches",
        "purchase_orders", "purchase_order_items", "stock_logs", "stock_counts", "medicine_returns", "app_settings");
    private static final Pattern SAFE_NAME = Pattern.compile("^[A-Za-z0-9._-]+\\.json$");
    private static final Pattern SAFE_COLUMN = Pattern.compile("^[A-Za-z0-9_]+$");
    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final JdbcTemplate jdbc;
    private final Path dir;
    private final boolean dailyOn;

    public BackupService(JdbcTemplate jdbc, @Value("${app.backup.dir:backups}") String dir,
                         @Value("${app.backup.daily:true}") boolean dailyOn) {
        this.jdbc = jdbc; this.dir = Path.of(dir).toAbsolutePath().normalize(); this.dailyOn = dailyOn;
    }

    // ---------- backup ----------

    public String exportJson(String by) {
        StringBuilder sb = new StringBuilder("{\"version\":1,\"createdAt\":\"").append(Instant.now())
            .append("\",\"createdBy\":\"").append(escape(by)).append("\",\"tables\":{");
        boolean firstTable = true;
        for (String t : ORDER) {
            List<Map<String, Object>> rows;
            try { rows = jdbc.queryForList("SELECT * FROM " + t); } catch (DataAccessException e) { continue; }   // table not created yet
            if (!firstTable) sb.append(',');
            firstTable = false;
            sb.append('"').append(t).append("\":[");
            boolean firstRow = true;
            for (Map<String, Object> row : rows) {
                if (!firstRow) sb.append(',');
                firstRow = false;
                sb.append('{');
                boolean firstCol = true;
                for (var e : row.entrySet()) {
                    if (!firstCol) sb.append(',');
                    firstCol = false;
                    sb.append('"').append(escape(e.getKey())).append("\":");
                    writeValue(sb, e.getValue());
                }
                sb.append('}');
            }
            sb.append(']');
        }
        return sb.append("}}").toString();
    }

    public String saveToDisk(String prefix, String by) {
        try {
            Files.createDirectories(dir);
            String name = prefix + "-" + LocalDateTime.now().format(STAMP) + ".json";
            Files.writeString(dir.resolve(name), exportJson(by), StandardCharsets.UTF_8);
            return name;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not write the backup file on the server");
        }
    }

    // Every night at 02:00 India time. The newest 14 automatic backups are kept.
    @Scheduled(cron = "${app.backup.cron:0 0 2 * * *}", zone = "${app.alerts.email.zone:Asia/Kolkata}")
    public void daily() {
        if (!dailyOn) return;
        try {
            log.info("Daily backup saved as {}", saveToDisk("auto", "system"));
            List<Path> autos = files().filter(p -> p.getFileName().toString().startsWith("auto-")).sorted(Comparator.reverseOrder()).toList();
            for (Path old : autos.stream().skip(14).toList()) Files.deleteIfExists(old);
        } catch (Exception e) {
            log.error("Daily backup failed", e);
        }
    }

    public BackupList list() {
        try (Stream<Path> s = files()) {
            List<BackupFile> list = s.sorted(Comparator.reverseOrder()).map(p -> {
                try { return new BackupFile(p.getFileName().toString(), Files.size(p) / 1024, Files.getLastModifiedTime(p).toInstant()); }
                catch (IOException e) { return new BackupFile(p.getFileName().toString(), 0, Instant.EPOCH); }
            }).toList();
            return new BackupList(dir.toString(), dailyOn, list);
        }
    }

    public byte[] read(String name) {
        if (!SAFE_NAME.matcher(name).matches()) throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid file name");
        Path p = dir.resolve(name).normalize();
        try {
            if (!p.startsWith(dir) || !Files.isRegularFile(p)) throw new ApiException(HttpStatus.NOT_FOUND, "Backup not found");
            return Files.readAllBytes(p);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read the backup file");
        }
    }

    private Stream<Path> files() {
        try {
            if (!Files.isDirectory(dir)) return Stream.empty();
            return Files.list(dir).filter(p -> p.getFileName().toString().endsWith(".json"));
        } catch (IOException e) {
            return Stream.empty();
        }
    }

    // ---------- restore ----------

    @Transactional
    @SuppressWarnings("unchecked")
    public RestoreResult restore(Map<String, Object> backup, String adminUsername) {
        Object version = backup.get("version");
        if (!(version instanceof Number n && n.intValue() == 1) || !(backup.get("tables") instanceof Map<?, ?> raw))
            throw new ApiException(HttpStatus.BAD_REQUEST, "This is not a MediStock backup file");

        Map<String, List<Map<String, Object>>> tables = new LinkedHashMap<>();
        for (String t : ORDER) if (raw.get(t) instanceof List<?> rows) tables.put(t, (List<Map<String, Object>>) rows);

        // The tables that exist in this database must all be in the file, or something would be lost or break
        Map<String, Set<String>> columns = new LinkedHashMap<>();
        for (String t : ORDER) {
            try {
                SqlRowSet meta = jdbc.queryForRowSet("SELECT * FROM " + t + " WHERE 1=0");
                Set<String> cols = new HashSet<>();
                for (String c : meta.getMetaData().getColumnNames()) cols.add(c.toLowerCase());
                columns.put(t, cols);
            } catch (DataAccessException e) { /* table does not exist here */ }
        }
        for (String t : columns.keySet())
            if (!tables.containsKey(t)) throw new ApiException(HttpStatus.BAD_REQUEST, "The backup file has no data for '" + t + "', so it cannot be restored");

        // Never lock the person out: their own Admin account must be in the backup
        boolean adminKept = tables.get("users").stream().anyMatch(u -> adminUsername.equalsIgnoreCase(String.valueOf(u.get("username")))
            && "ADMIN".equals(String.valueOf(u.get("role"))) && !Boolean.FALSE.equals(u.get("enabled")) && !"0".equals(String.valueOf(u.get("enabled"))));
        if (!adminKept)
            throw new ApiException(HttpStatus.CONFLICT, "Your own Admin account is not active in this backup, so restoring would lock you out");

        for (var entry : tables.entrySet())
            for (Map<String, Object> row : entry.getValue())
                for (String col : row.keySet())
                    if (!SAFE_COLUMN.matcher(col).matches() || !columns.get(entry.getKey()).contains(col.toLowerCase()))
                        throw new ApiException(HttpStatus.BAD_REQUEST, "The backup does not match this database (unknown column '" + col + "' in " + entry.getKey() + ")");

        String safety = saveToDisk("before-restore", adminUsername);   // a copy of the current data, just in case

        try {
            tryDelete("password_reset_tokens");   // temporary reset links are not part of a backup
            List<String> reverse = new ArrayList<>(ORDER);
            Collections.reverse(reverse);
            for (String t : reverse) if (columns.containsKey(t)) jdbc.update("DELETE FROM " + t);

            Map<String, Integer> restored = new LinkedHashMap<>();
            for (String t : ORDER) {
                if (!columns.containsKey(t)) continue;
                for (Map<String, Object> row : tables.get(t)) {
                    if (row.isEmpty()) continue;
                    List<String> cols = new ArrayList<>(row.keySet());
                    String sql = "INSERT INTO " + t + " (" + String.join(", ", cols) + ") VALUES (" + String.join(", ", Collections.nCopies(cols.size(), "?")) + ")";
                    jdbc.update(sql, cols.stream().map(row::get).toArray());
                }
                restored.put(t, tables.get(t).size());
            }
            return new RestoreResult(restored, safety);
        } catch (DataAccessException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The backup could not be restored, so nothing was changed. " + e.getMostSpecificCause().getMessage());
        }
    }

    private void tryDelete(String table) {
        try { jdbc.update("DELETE FROM " + table); } catch (DataAccessException e) { /* table does not exist */ }
    }

    // ---------- small JSON writer, so the file does not depend on a JSON library ----------

    private static void writeValue(StringBuilder sb, Object v) {
        if (v == null) sb.append("null");
        else if (v instanceof Boolean) sb.append(v);
        else if (v instanceof java.math.BigDecimal bd) sb.append(bd.toPlainString());
        else if (v instanceof Number) sb.append(v);
        else sb.append('"').append(escape(text(v))).append('"');
    }

    private static String text(Object v) {
        if (v instanceof java.sql.Timestamp ts) return ts.toLocalDateTime().toString();
        if (v instanceof java.sql.Date d) return d.toLocalDate().toString();
        return String.valueOf(v);   // LocalDateTime, LocalDate, Instant and plain text
    }

    private static String escape(String s) {
        StringBuilder out = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> { if (c < 0x20) out.append(String.format("\\u%04x", (int) c)); else out.append(c); }
            }
        }
        return out.toString();
    }
}
