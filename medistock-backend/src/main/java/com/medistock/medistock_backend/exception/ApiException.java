package com.medistock.medistock_backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Application-level exception carrying an HTTP status.
 * Thrown by services when a business rule is violated.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}