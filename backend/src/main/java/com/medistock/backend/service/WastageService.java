package com.medistock.backend.service;

import com.medistock.backend.dto.WastageDtos.*;
import com.medistock.backend.entity.MedicineBatch;
import com.medistock.backend.entity.StockChangeType;
import com.medistock.backend.entity.StockLog;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.MedicineBatchRepository;
import com.medistock.backend.repository.StockLogRepository;
import com.medistock.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/** Stock written off as a loss: expired, damaged, lost or other. The loss is worked out at the batch price. */
@Service
public class WastageService {
    private static final Set<StockChangeType> TYPES = EnumSet.of(StockChangeType.EXPIRED_REMOVED,
        StockChangeType.WASTAGE_DAMAGED, StockChangeType.WASTAGE_LOST, StockChangeType.WASTAGE_OTHER);

    private final MedicineBatchRepository batches;
    private final StockLogRepository logs;
    private final UserRepository users;

    public WastageService(MedicineBatchRepository batches, StockLogRepository logs, UserRepository users) {
        this.batches = batches; this.logs = logs; this.users = users;
    }

    /** Takes the lost units out of stock and records them in the history. */
    @Transactional
    public void record(WastageRequest r, String username) {
        MedicineBatch b = batches.findById(r.batchId()).filter(x -> x.getMedicine().isActive())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Batch not found", "batchId"));
        if (r.quantity() > b.getQuantity())
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only " + b.getQuantity() + " units are in stock for this batch", "quantity");
        String note = r.note() == null || r.note().isBlank() ? null : r.note().trim();
        if (r.reason().equals("OTHER") && note == null)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please describe the reason", "note");

        b.setQuantity(b.getQuantity() - r.quantity());
        StockLog log = new StockLog();
        log.setBatch(b);
        log.setChangeQuantity(-r.quantity());
        log.setQuantityAfter(b.getQuantity());
        log.setType(StockChangeType.valueOf("WASTAGE_" + r.reason()));
        log.setNote(note);
        log.setPerformedBy(users.findByUsernameIgnoreCase(username).orElse(null));
        logs.save(log);
    }

    @Transactional(readOnly = true)
    public List<WastageRow> rows() {
        return logs.findAllByOrderByCreatedAtDescIdDesc(PageRequest.of(0, 3000)).stream()
            .filter(l -> TYPES.contains(l.getType()))
            .map(l -> {
                int units = -l.getChangeQuantity();
                return new WastageRow(l.getCreatedAt(), l.getBatch().getMedicine().getName(), l.getBatch().getBatchNumber(),
                    reason(l.getType()), units, l.getBatch().getPrice().multiply(BigDecimal.valueOf(units)), l.getNote(),
                    l.getPerformedBy() == null ? "System" : l.getPerformedBy().getUsername());
            }).toList();
    }

    @Transactional(readOnly = true)
    public WastageResponse build() {
        List<WastageRow> rows = rows();
        long units = rows.stream().mapToLong(WastageRow::quantity).sum();
        BigDecimal total = rows.stream().map(WastageRow::value).reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Slice> byReason = rows.stream().collect(Collectors.groupingBy(WastageRow::reason, TreeMap::new, Collectors.toList()))
            .entrySet().stream().map(e -> new Slice(e.getKey(), e.getValue().stream().mapToLong(WastageRow::quantity).sum(),
                e.getValue().stream().map(WastageRow::value).reduce(BigDecimal.ZERO, BigDecimal::add).longValue())).toList();

        YearMonth now = YearMonth.now();
        List<MonthValue> byMonth = new ArrayList<>();
        for (int back = 5; back >= 0; back--) {
            YearMonth m = now.minusMonths(back);
            long value = rows.stream().filter(w -> YearMonth.from(w.time().atZone(ZoneId.systemDefault())).equals(m))
                .map(WastageRow::value).reduce(BigDecimal.ZERO, BigDecimal::add).longValue();
            byMonth.add(new MonthValue(m.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + String.format("%02d", m.getYear() % 100), value));
        }

        List<TopLoss> top = rows.stream().collect(Collectors.groupingBy(WastageRow::medicine)).entrySet().stream()
            .map(e -> new TopLoss(e.getKey(), e.getValue().stream().mapToLong(WastageRow::quantity).sum(),
                e.getValue().stream().map(WastageRow::value).reduce(BigDecimal.ZERO, BigDecimal::add).longValue()))
            .sorted(Comparator.comparingLong(TopLoss::value).reversed()).limit(5).toList();

        return new WastageResponse(units, total.longValue(), byReason, byMonth, top, rows.stream().limit(200).toList());
    }

    private static String reason(StockChangeType t) {
        return switch (t) {
            case EXPIRED_REMOVED -> "Expired";
            case WASTAGE_DAMAGED -> "Damaged";
            case WASTAGE_LOST -> "Lost or stolen";
            default -> "Other";
        };
    }
}
