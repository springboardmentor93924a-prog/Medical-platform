
package com.medistock.backup;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Service
public class DatabaseBackupService {

    private static final int FORMAT_VERSION = 1;
    private static final long MAX_BACKUP_SIZE = 100L * 1024 * 1024;
    private static final int MAX_ENTRIES = 500;

    private final DataSource dataSource;
    private final ObjectMapper mapper;
    private final Path backupDirectory;

    public DatabaseBackupService(
            DataSource dataSource,
            ObjectMapper mapper
    ) {
        this.dataSource = dataSource;
        this.mapper = mapper;

        this.backupDirectory = Path.of(
                System.getProperty("user.dir"),
                "backups"
        ).toAbsolutePath().normalize();

        System.out.println(
                "BACKUP DIRECTORY: " + backupDirectory
        );
    }

    // --------------------------------------------------
    // CREATE ZIP BACKUP
    // --------------------------------------------------

    public Path createBackup() throws Exception {

        Files.createDirectories(backupDirectory);

        String timestamp = LocalDateTime.now().format(
                DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")
        );

        Path backupFile = backupDirectory.resolve(
                "medistock_backup_" + timestamp + ".zip"
        );

        try (Connection connection = dataSource.getConnection();
             ZipOutputStream zip = new ZipOutputStream(
                     Files.newOutputStream(backupFile),
                     StandardCharsets.UTF_8
             )) {

            DatabaseMetaData metadata = connection.getMetaData();

            String catalog = connection.getCatalog();

            ArrayNode tablesNode = mapper.createArrayNode();

            List<TableInfo> tables = new ArrayList<>();

            try (ResultSet result = metadata.getTables(
                    catalog,
                    null,
                    "%",
                    new String[]{"TABLE"}
            )) {

                while (result.next()) {

                    String tableName = result.getString("TABLE_NAME");

                    List<ColumnInfo> columns = getColumns(
                            metadata,
                            catalog,
                            tableName
                    );

                    if (columns.isEmpty()) {
                        continue;
                    }

                    tables.add(new TableInfo(tableName, columns));
                }
            }

            for (TableInfo table : tables) {

                ObjectNode tableNode = mapper.createObjectNode();

                tableNode.put("name", table.name());

                ArrayNode columnsNode = mapper.createArrayNode();

                for (ColumnInfo column : table.columns()) {

                    ObjectNode columnNode = mapper.createObjectNode();

                    columnNode.put("name", column.name());
                    columnNode.put("jdbcType", column.jdbcType());
                    columnNode.put("typeName", column.typeName());

                    columnsNode.add(columnNode);
                }

                tableNode.set("columns", columnsNode);

                tablesNode.add(tableNode);
            }

            ObjectNode manifest = mapper.createObjectNode();

            manifest.put("format", "MEDISTOCK_BACKUP");
            manifest.put("version", FORMAT_VERSION);
            manifest.put("database", catalog);
            manifest.put("createdAt", LocalDateTime.now().toString());

            manifest.set("tables", tablesNode);

            zip.putNextEntry(new ZipEntry("manifest.json"));

            zip.write(
                    mapper.writeValueAsBytes(manifest)
            );

            zip.closeEntry();

            int tableIndex = 0;

            for (TableInfo table : tables) {

                String entryName = "tables/table_" + tableIndex + ".jsonl";

                zip.putNextEntry(new ZipEntry(entryName));

                String columnList = table.columns().stream()
                        .map(column -> quoteIdentifier(column.name()))
                        .reduce((a, b) -> a + ", " + b)
                        .orElseThrow();

                String sql = "SELECT " + columnList
                        + " FROM " + quoteIdentifier(table.name());

                try (Statement statement = connection.createStatement();
                     ResultSet rows = statement.executeQuery(sql)) {

                    while (rows.next()) {

                        ArrayNode row = mapper.createArrayNode();

                        for (int i = 0; i < table.columns().size(); i++) {

                            ColumnInfo column = table.columns().get(i);

                            Object value = rows.getObject(i + 1);

                            if (value == null) {
                                row.addNull();
                            } else if (isBinaryType(column.jdbcType())) {

                                ObjectNode binary = mapper.createObjectNode();

                                binary.put(
                                        "$binary",
                                        Base64.getEncoder().encodeToString(
                                                rows.getBytes(i + 1)
                                        )
                                );

                                row.add(binary);

                            } else {
                                row.add(rows.getString(i + 1));
                            }
                        }

                        zip.write(
                                mapper.writeValueAsBytes(row)
                        );

                        zip.write('\n');
                    }
                }

                zip.closeEntry();

                tableIndex++;
            }
        } catch (Exception exception) {

            Files.deleteIfExists(backupFile);

            throw exception;
        }

        return backupFile;
    }

    // --------------------------------------------------
    // RESTORE ZIP BACKUP
    // --------------------------------------------------

    public void restoreBackup(InputStream inputStream) throws Exception {

        Map<String, byte[]> entries = readArchive(inputStream);

        byte[] manifestBytes = entries.get("manifest.json");

        if (manifestBytes == null) {
            throw new IllegalArgumentException(
                    "Invalid backup: manifest is missing."
            );
        }

        JsonNode manifest = mapper.readTree(manifestBytes);

        if (!"MEDISTOCK_BACKUP".equals(
                manifest.path("format").asText()
        )) {
            throw new IllegalArgumentException(
                    "Unsupported MediStock backup format."
            );
        }

        if (manifest.path("version").asInt(-1) != FORMAT_VERSION) {
            throw new IllegalArgumentException(
                    "Unsupported backup version."
            );
        }

        JsonNode tablesNode = manifest.path("tables");

        if (!tablesNode.isArray() || tablesNode.isEmpty()) {
            throw new IllegalArgumentException(
                    "Backup does not contain valid table information."
            );
        }

        try (Connection connection = dataSource.getConnection()) {

            String currentDatabase = connection.getCatalog();

            String backupDatabase = manifest.path("database").asText();

            if (!Objects.equals(currentDatabase, backupDatabase)) {
                throw new IllegalArgumentException(
                        "Backup belongs to a different database."
                );
            }

            List<RestoreTable> restoreTables = validateTables(
                    connection,
                    tablesNode,
                    entries
            );

            // Create an automatic safety backup before changing data.
            createBackup();

            boolean originalAutoCommit = connection.getAutoCommit();

            try {

                // MySQL foreign-key checks are session-specific.
                try (Statement statement = connection.createStatement()) {
                    statement.execute("SET FOREIGN_KEY_CHECKS = 0");
                }

                connection.setAutoCommit(false);

                try {

                    // Delete existing records.
                    try (Statement statement = connection.createStatement()) {

                        for (RestoreTable table : restoreTables) {

                            statement.executeUpdate(
                                    "DELETE FROM "
                                    + quoteIdentifier(table.name())
                            );
                        }
                    }

                    // Insert validated backup records.
                    for (RestoreTable table : restoreTables) {

                        restoreTable(connection, table);
                    }

                    connection.commit();

                } catch (Exception exception) {

                    connection.rollback();

                    throw exception;
                }

            } finally {

                try (Statement statement = connection.createStatement()) {
                    statement.execute("SET FOREIGN_KEY_CHECKS = 1");
                }

                connection.setAutoCommit(originalAutoCommit);
            }
        }
    }

    // --------------------------------------------------
    // VALIDATE ARCHIVE
    // --------------------------------------------------

    private Map<String, byte[]> readArchive(
            InputStream inputStream
    ) throws IOException {

        Map<String, byte[]> entries = new HashMap<>();

        long totalSize = 0;
        int count = 0;

        try (ZipInputStream zip = new ZipInputStream(inputStream)) {

            ZipEntry entry;

            while ((entry = zip.getNextEntry()) != null) {

                if (entry.isDirectory()) {
                    continue;
                }

                count++;

                if (count > MAX_ENTRIES) {
                    throw new IllegalArgumentException(
                            "Backup contains too many files."
                    );
                }

                String name = entry.getName();

                if (name.startsWith("/")
                        || name.contains("..")
                        || name.contains("\\")) {

                    throw new IllegalArgumentException(
                            "Invalid backup archive path."
                    );
                }

                if (entries.containsKey(name)) {
                    throw new IllegalArgumentException(
                            "Duplicate archive entry."
                    );
                }

                ByteArrayOutputStream output = new ByteArrayOutputStream();

                byte[] buffer = new byte[8192];

                int read;

                while ((read = zip.read(buffer)) != -1) {

                    totalSize += read;

                    if (totalSize > MAX_BACKUP_SIZE) {
                        throw new IllegalArgumentException(
                                "Backup exceeds the maximum allowed size."
                        );
                    }

                    output.write(buffer, 0, read);
                }

                entries.put(name, output.toByteArray());

                zip.closeEntry();
            }
        }

        return entries;
    }

    // --------------------------------------------------
    // VALIDATE TABLES AND COLUMNS
    // --------------------------------------------------

    private List<RestoreTable> validateTables(
            Connection connection,
            JsonNode tablesNode,
            Map<String, byte[]> entries
    ) throws Exception {

        List<RestoreTable> tables = new ArrayList<>();

        Set<String> tableNames = new HashSet<>();

        DatabaseMetaData metadata = connection.getMetaData();

        String catalog = connection.getCatalog();

        for (int index = 0; index < tablesNode.size(); index++) {

            JsonNode tableNode = tablesNode.get(index);

            String tableName = tableNode.path("name").asText();

            if (tableName.isBlank() || !tableNames.add(tableName)) {
                throw new IllegalArgumentException(
                        "Invalid or duplicate table name."
                );
            }

            String entryName = "tables/table_" + index + ".jsonl";

            byte[] tableData = entries.get(entryName);

            if (tableData == null) {
                throw new IllegalArgumentException(
                        "Missing table backup: " + tableName
                );
            }

            JsonNode columnsNode = tableNode.path("columns");

            if (!columnsNode.isArray() || columnsNode.isEmpty()) {
                throw new IllegalArgumentException(
                        "Invalid columns for table: " + tableName
                );
            }

            List<ColumnInfo> columns = new ArrayList<>();

            for (JsonNode columnNode : columnsNode) {

                String columnName = columnNode.path("name").asText();

                int jdbcType = columnNode.path("jdbcType").asInt();

                String typeName = columnNode.path("typeName").asText();

                if (columnName.isBlank() || typeName.isBlank()) {
                    throw new IllegalArgumentException(
                            "Invalid column metadata."
                    );
                }

                columns.add(
                        new ColumnInfo(columnName, jdbcType, typeName)
                );
            }

            List<ColumnInfo> currentColumns = getColumns(
                    metadata,
                    catalog,
                    tableName
            );

            if (currentColumns.size() != columns.size()) {
                throw new IllegalArgumentException(
                        "Database schema differs for table: " + tableName
                );
            }

            for (int i = 0; i < columns.size(); i++) {

                ColumnInfo backupColumn = columns.get(i);
                ColumnInfo currentColumn = currentColumns.get(i);

                if (!backupColumn.name().equals(currentColumn.name())
                        || backupColumn.jdbcType() != currentColumn.jdbcType()) {

                    throw new IllegalArgumentException(
                            "Database schema mismatch in table: " + tableName
                    );
                }
            }

            tables.add(
                    new RestoreTable(tableName, columns, tableData)
            );
        }

        // Reject unexpected files.
        if (entries.size() != tables.size() + 1) {
            throw new IllegalArgumentException(
                    "Backup contains unexpected archive files."
            );
        }

        return tables;
    }

    // --------------------------------------------------
    // RESTORE ONE TABLE
    // --------------------------------------------------

    private void restoreTable(
            Connection connection,
            RestoreTable table
    ) throws Exception {

        String columns = table.columns().stream()
                .map(column -> quoteIdentifier(column.name()))
                .reduce((a, b) -> a + ", " + b)
                .orElseThrow();

        String placeholders = String.join(
                ", ",
                Collections.nCopies(table.columns().size(), "?")
        );

        String sql = "INSERT INTO "
                + quoteIdentifier(table.name())
                + " (" + columns + ") VALUES (" + placeholders + ")";

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(
                        new ByteArrayInputStream(table.data()),
                        StandardCharsets.UTF_8
                )
        );
             PreparedStatement statement = connection.prepareStatement(sql)) {

            String line;

            while ((line = reader.readLine()) != null) {

                if (line.isBlank()) {
                    continue;
                }

                JsonNode row = mapper.readTree(line);

                if (!row.isArray()
                        || row.size() != table.columns().size()) {

                    throw new IllegalArgumentException(
                            "Invalid row data in table: " + table.name()
                    );
                }

                for (int i = 0; i < table.columns().size(); i++) {

                    JsonNode value = row.get(i);

                    ColumnInfo column = table.columns().get(i);

                    if (value == null || value.isNull()) {

                        statement.setNull(i + 1, column.jdbcType());

                    } else if (isBinaryType(column.jdbcType())) {

                        String encoded = value.path("$binary").asText();

                        statement.setBytes(
                                i + 1,
                                Base64.getDecoder().decode(encoded)
                        );

                    } else {

                        if (!value.isTextual()) {
                            throw new IllegalArgumentException(
                                    "Invalid value in table: " + table.name()
                            );
                        }

                        statement.setString(i + 1, value.asText());
                    }
                }

                statement.executeUpdate();
            }
        }
    }

    // --------------------------------------------------
    // DATABASE METADATA
    // --------------------------------------------------

    private List<ColumnInfo> getColumns(
            DatabaseMetaData metadata,
            String catalog,
            String tableName
    ) throws SQLException {

        List<ColumnInfo> columns = new ArrayList<>();

        try (ResultSet result = metadata.getColumns(
                catalog,
                null,
                tableName,
                "%"
        )) {

            while (result.next()) {

                String generated = result.getString("IS_GENERATEDCOLUMN");

                if ("YES".equalsIgnoreCase(generated)) {
                    continue;
                }

                columns.add(
                        new ColumnInfo(
                                result.getString("COLUMN_NAME"),
                                result.getInt("DATA_TYPE"),
                                result.getString("TYPE_NAME")
                        )
                );
            }
        }

        return columns;
    }

    private boolean isBinaryType(int type) {

        return type == Types.BINARY
                || type == Types.VARBINARY
                || type == Types.LONGVARBINARY
                || type == Types.BLOB;
    }

    private String quoteIdentifier(String identifier) {

        return "`" + identifier.replace("`", "``") + "`";
    }

    private record ColumnInfo(
            String name,
            int jdbcType,
            String typeName
    ) {}

    private record TableInfo(
            String name,
            List<ColumnInfo> columns
    ) {}

    private record RestoreTable(
            String name,
            List<ColumnInfo> columns,
            byte[] data
    ) {}
}
