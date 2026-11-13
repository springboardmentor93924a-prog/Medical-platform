package com.medistock.backend.service;

import com.medistock.backend.dto.ReturnDtos.*;
import com.medistock.backend.entity.*;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.MedicineBatchRepository;
import com.medistock.backend.repository.MedicineReturnRepository;
import com.medistock.backend.repository.StockLogRepository;
import com.medistock.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class ReturnService {
    private static final Map<String, String> REASONS = Map.of("DAMAGED", "Damaged", "EXPIRED", "Expired",
        "WRONG_ITEM", "Wrong item", "QUALITY_ISSUE", "Quality issue", "OVERSTOCK", "Overstock");

    private final MedicineReturnRepository returns;
    private final MedicineBatchRepository batches;
    private final StockLogRepository logs;
    private final UserRepository users;

    public ReturnService(MedicineReturnRepository returns, MedicineBatchRepository batches, StockLogRepository logs, UserRepository users) {
        this.returns = returns; this.batches = batches; this.logs = logs; this.users = users;
    }

    @Transactional(readOnly = true)
    public List<ReturnResponse> list() { return returns.findAllByOrderByCreatedAtDescIdDesc().stream().map(ReturnService::toDto).toList(); }

    @Transactional
    public ReturnResponse create(ReturnRequest r, String username) {
        MedicineBatch b = batches.findById(r.batchId()).filter(x -> x.getMedicine().isActive())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Batch not found", "batchId"));
        if (r.quantity() > b.getQuantity())
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only " + b.getQuantity() + " units are in stock for this batch", "quantity");
        MedicineReturn m = new MedicineReturn();
        m.setBatch(b);
        m.setQuantity(r.quantity());
        m.setReason(r.reason());
        m.setNote(r.note() == null || r.note().isBlank() ? null : r.note().trim());
        m.setCreatedBy(users.findByUsernameIgnoreCase(username).orElse(null));
        return toDto(returns.save(m));
    }

    /** The goods leave the shelf: stock goes down and the change is recorded. */
    @Transactional
    public ReturnResponse send(Long id, String username) {
        MedicineReturn m = find(id);
        require(m, ReturnStatus.REQUESTED, "sent");
        MedicineBatch b = m.getBatch();
        if (m.getQuantity() > b.getQuantity())
            throw new ApiException(HttpStatus.CONFLICT, "Only " + b.getQuantity() + " units are in stock now, so this return cannot be sent");
        b.setQuantity(b.getQuantity() - m.getQuantity());

        StockLog log = new StockLog();
        log.setBatch(b);
        log.setChangeQuantity(-m.getQuantity());
        log.setQuantityAfter(b.getQuantity());
        log.setType(StockChangeType.RETURNED);
        log.setNote("Returned to " + b.getSupplier().getName() + " (" + REASONS.get(m.getReason()) + ")");
        log.setPerformedBy(users.findByUsernameIgnoreCase(username).orElse(null));
        logs.save(log);

        m.setStatus(ReturnStatus.SENT);
        m.setSentAt(Instant.now());
        return toDto(m);
    }

    /** The supplier has paid or issued a credit note. */
    @Transactional
    public ReturnResponse credit(Long id, CreditRequest r) {
        MedicineReturn m = find(id);
        require(m, ReturnStatus.SENT, "credited");
        m.setCreditAmount(r.amount());
        m.setStatus(ReturnStatus.CREDITED);
        m.setCreditedAt(Instant.now());
        return toDto(m);
    }

    @Transactional
    public ReturnResponse cancel(Long id) {
        MedicineReturn m = find(id);
        require(m, ReturnStatus.REQUESTED, "cancelled");
        m.setStatus(ReturnStatus.CANCELLED);
        return toDto(m);
    }

    private MedicineReturn find(Long id) {
        return returns.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Return not found"));
    }

    private static void require(MedicineReturn m, ReturnStatus needed, String action) {
        if (m.getStatus() != needed)
            throw new ApiException(HttpStatus.CONFLICT, "This return is " + label(m.getStatus()).toLowerCase() + " and cannot be " + action);
    }

    private static String label(ReturnStatus s) {
        return switch (s) {
            case REQUESTED -> "Requested";
            case SENT -> "Sent to supplier";
            case CREDITED -> "Credited";
            case CANCELLED -> "Cancelled";
        };
    }

    private static ReturnResponse toDto(MedicineReturn m) {
        MedicineBatch b = m.getBatch();
        return new ReturnResponse(m.getId(), b.getId(), b.getMedicine().getName(), b.getBatchNumber(), b.getSupplier().getName(),
            m.getQuantity(), REASONS.get(m.getReason()), label(m.getStatus()), b.getPrice().multiply(BigDecimal.valueOf(m.getQuantity())),
            m.getCreditAmount(), m.getNote(), m.getCreatedBy() == null ? null : m.getCreatedBy().getUsername(),
            m.getCreatedAt(), m.getSentAt(), m.getCreditedAt());
    }
}
