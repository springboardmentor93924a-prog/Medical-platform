
package com.medistock.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public String health() {
        return "MediStock backend is running!";
    }

    @GetMapping("/test-protected")
    public String protectedTest() {
        return "JWT protected API accessed successfully!";
    }
}
