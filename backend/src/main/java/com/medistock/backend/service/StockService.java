package com.medistock.backend.service;

import com.medistock.backend.dto.InventoryDtos.InventoryRow;
import com.medistock.backend.dto.StockDtos.*;
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
import java.util.List;

@Service
public class StockService {
    private final MedicineBatchRepository batches;
    private final StockLogRepository logs;
    private final UserRepository users;

    public StockService(MedicineBatchRepository batches, StockLogRepository logs, UserRepository users) {
        this.batches = batches; this.logs = logs; this.users = users;
    }

    /** Sets a batch to a new quantity and records the change in the history. */
    @Transactional
    public InventoryRow updateQuantity(Long batchId, StockUpdateRequest r, String username) {
        MedicineBatch b = batches.findById(batchId)
            .filter(x -> x.getMedicine().isActive())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Batch not found"));
        int change = r.quantity() - b.getQuantity();
        if (change == 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Quantity is unchanged", "quantity");

        b.setQuantity(r.quantity());
        StockLog log = new StockLog();
        log.setBatch(b);
        log.setChangeQuantity(change);
        log.setQuantityAfter(r.quantity());
        log.setType(StockChangeType.ADJUSTMENT);
        log.setNote(r.note() == null || r.note().isBlank() ? "Manual stock update" : r.note().trim());
        log.setPerformedBy(users.findByUsernameIgnoreCase(username).orElse(null));
        logs.save(log);
        return InventoryService.toRow(b);
    }

    /** Newest first. batchId is optional; limit is capped at 200. */
    @Transactional(readOnly = true)
    public List<StockLogResponse> history(Long batchId, int limit) {
        PageRequest page = PageRequest.of(0, Math.max(1, Math.min(limit, 200)));
        List<StockLog> list = batchId == null
            ? logs.findAllByOrderByCreatedAtDescIdDesc(page)
            : logs.findByBatchIdOrderByCreatedAtDescIdDesc(batchId, page);
        return list.stream().map(StockService::toDto).toList();
    }

    private static StockLogResponse toDto(StockLog l) {
        MedicineBatch b = l.getBatch();
        return new StockLogResponse(l.getId(), b.getId(), b.getMedicine().getName(), b.getBatchNumber(),
            l.getChangeQuantity(), l.getQuantityAfter(), l.getType().name(), l.getNote(),
            l.getPerformedBy() == null ? "System" : l.getPerformedBy().getUsername(), l.getCreatedAt());
    }
}
