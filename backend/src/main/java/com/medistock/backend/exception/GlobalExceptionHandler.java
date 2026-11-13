package com.medistock.backend.exception;

import com.medistock.backend.service.ErrorLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    public record ErrorBody(int status, String message, Map<String, String> errors) {}

    private final ErrorLogService errorLog;

    public GlobalExceptionHandler(ErrorLogService errorLog) { this.errorLog = errorLog; }

    private ResponseEntity<ErrorBody> body(HttpStatus s, String msg, Map<String, String> errors) {
        return ResponseEntity.status(s).body(new ErrorBody(s.value(), msg, errors));
    }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorBody> api(ApiException e) {
        Map<String, String> errs = e.getField() == null ? null : Map.of(e.getField(), e.getMessage());
        return body(e.getStatus(), e.getMessage(), errs);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorBody> invalid(MethodArgumentNotValidException e) {
        Map<String, String> errs = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> errs.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return body(HttpStatus.BAD_REQUEST, "Please fix the highlighted fields", errs);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorBody> unreadable(HttpMessageNotReadableException e) {
        return body(HttpStatus.BAD_REQUEST, "Malformed request body", null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ErrorBody> denied(AccessDeniedException e) {
        return body(HttpStatus.FORBIDDEN, "You do not have permission to do this", null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ErrorBody> badParam(MethodArgumentTypeMismatchException e) {
        return body(HttpStatus.BAD_REQUEST, "Invalid value for '" + e.getName() + "'", null);
    }

    // Safety net for the rare race where two signups with the same email/username arrive together
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorBody> duplicate(DataIntegrityViolationException e) {
        return body(HttpStatus.CONFLICT, "Username or email already exists", null);
    }

    // Anything unexpected: the Admin can see it under System Monitoring, and the user gets a plain message
    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorBody> unexpected(Exception e, HttpServletRequest request) {
        if (e instanceof ErrorResponse spring) {   // Spring's own answers such as 404 or 405 are not server errors
            HttpStatus status = HttpStatus.valueOf(spring.getStatusCode().value());
            return body(status, status.getReasonPhrase(), null);
        }
        errorLog.record(request.getMethod(), request.getRequestURI(), e);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong on the server. It has been recorded.", null);
    }
}
