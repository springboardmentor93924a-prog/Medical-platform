package com.medistock.backend.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String field;   // optional: lets the UI show the error under one input

    public ApiException(HttpStatus status, String message) { this(status, message, null); }
    public ApiException(HttpStatus status, String message, String field) {
        super(message); this.status = status; this.field = field;
    }
    public HttpStatus getStatus() { return status; }
    public String getField() { return field; }
}
