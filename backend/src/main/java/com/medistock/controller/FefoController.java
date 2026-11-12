
package com.medistock.controller;

import com.medistock.dto.DispenseRequest;
import com.medistock.entity.User;
import com.medistock.repository.UserRepository;
import com.medistock.service.FefoService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/fefo")
@CrossOrigin(origins = "http://localhost:5173")
public class FefoController {

    private final FefoService fefoService;
    private final UserRepository userRepository;

    public FefoController(
            FefoService fefoService,
            UserRepository userRepository) {

        this.fefoService = fefoService;
        this.userRepository = userRepository;
    }

    @PostMapping("/dispense")
    public ResponseEntity<Map<String, Object>> dispense(
            @RequestBody DispenseRequest request,
            Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in first"
            );
        }

        User user = userRepository.findByEmail(
                authentication.getName()
        ).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authenticated user not found"
        ));

        return ResponseEntity.ok(
                fefoService.dispense(
                        request,
                        user.getUserId()
                )
        );
    }
}
