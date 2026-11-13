package com.medistock.backend.service;

import com.medistock.backend.dto.MonitoringDtos.ErrorItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;

/** Remembers the last 50 unexpected server errors so the Admin can see them. They are cleared when the server restarts. */
@Service
public class ErrorLogService {
    private static final Logger log = LoggerFactory.getLogger(ErrorLogService.class);
    private static final int MAX = 50;
    private final Deque<ErrorItem> items = new ConcurrentLinkedDeque<>();

    public void record(String method, String path, Exception e) {
        log.error("Unexpected error on {} {}", method, path, e);   // the full detail goes to the server log
        String message = e.getMessage() == null ? "" : e.getMessage();
        items.addFirst(new ErrorItem(Instant.now(), method, path, e.getClass().getSimpleName(),
            message.length() > 300 ? message.substring(0, 300) + "..." : message));
        while (items.size() > MAX) items.pollLast();
    }

    public List<ErrorItem> recent() { return List.copyOf(items); }
}
