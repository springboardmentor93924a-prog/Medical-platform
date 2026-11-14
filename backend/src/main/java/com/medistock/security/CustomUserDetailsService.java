package com.medistock.security;

import com.medistock.repository.UserRepository;
import org.springframework.stereotype.Service;

// Deprecated compatibility wrapper; UserDetailsServiceImpl is the canonical UserDetailsService bean
public class CustomUserDetailsService extends UserDetailsServiceImpl {

    public CustomUserDetailsService(UserRepository userRepository) {
        super(userRepository);
    }
}
