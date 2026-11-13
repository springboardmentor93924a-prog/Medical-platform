package com.medistock.backend.service;

import com.medistock.backend.dto.StockCountDtos.*;
import com.medistock.backend.entity.MedicineBatch;
import com.medistock.backend.entity.StockCount;
import com.medistock.backend.entity.User;
import com.medistock.backend.exception.ApiException;
import com.medistock.backend.repository.MedicineBatchRepository;
import com.medistock.backend.repository.StockCountRepository;
import com.medistock.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.List;

@Service
public class StockCountService {
    private final StockCountRepository counts;
    private final MedicineBatchRepository batches;
    private final UserRepository users;

    public StockCountService(StockCountRepository counts, MedicineBatchRepository batches, UserRepository users) {
        this.counts = counts; this.batches = batches; this.users = users;
    }

    /** Saves a count and compares it with the system quantity. The stock itself is never changed here. */
    @Transactional
    public CountResponse record(CountRequest r, String username) {
        MedicineBatch b = batches.findById(r.batchId()).filter(x -> x.getMedicine().isActive())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Batch not found", "batchId"));
        String note = r.note() == null || r.note().isBlank() ? null : r.note().trim();
        int difference = r.countedQuantity() - b.getQuantity();
        if (difference != 0 && note == null)
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please give a reason for the difference", "note");

        StockCount c = new StockCount();
        c.setBatch(b);
        c.setSystemQuantity(b.getQuantity());
        c.setCountedQuantity(r.countedQuantity());
        c.setNote(note);
        c.setCountedBy(user(username));
        return toDto(counts.save(c));
    }

    /** Admin and Pharmacist see every count. Staff see only their own. */
    @Transactional(readOnly = true)
    public List<CountResponse> list(String username, boolean all) {
        List<StockCount> list = all
            ? counts.findAllByOrderByCountedAtDescIdDesc(PageRequest.of(0, 200))
            : counts.findByCountedByIdOrderByCountedAtDescIdDesc(user(username).getId(), PageRequest.of(0, 50));
        return list.stream().map(StockCountService::toDto).toList();
    }

    /** Marks a difference as looked at. This does not change the stock. */
    @Transactional
    public CountResponse review(Long id, String username) {
        StockCount c = counts.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Count not found"));
        if (c.getCountedQuantity() == c.getSystemQuantity())
            throw new ApiException(HttpStatus.CONFLICT, "This count matched the system, so there is nothing to review");
        if (c.isReviewed()) throw new ApiException(HttpStatus.CONFLICT, "This difference has already been reviewed");
        c.setReviewed(true);
        c.setReviewedBy(user(username));
        c.setReviewedAt(Instant.now());
        return toDto(c);
    }

    private User user(String username) {
        return users.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required"));
    }

    private static CountResponse toDto(StockCount c) {
        int diff = c.getCountedQuantity() - c.getSystemQuantity();
        String status = diff == 0 ? "Matched" : c.isReviewed() ? "Reviewed" : "Discrepancy";
        return new CountResponse(c.getId(), c.getBatch().getId(), c.getBatch().getMedicine().getName(), c.getBatch().getBatchNumber(),
            c.getSystemQuantity(), c.getCountedQuantity(), diff, status, c.getNote(), c.getCountedBy().getUsername(), c.getCountedAt(),
            c.getReviewedBy() == null ? null : c.getReviewedBy().getUsername(), c.getReviewedAt());
    }
}
