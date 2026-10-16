
package com.medistock.security;

import com.medistock.entity.User;
import com.medistock.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() ->
                        new UsernameNotFoundException("Invalid email or password"));

        String passwordHash = user.getPasswordHash() == null
                ? ""
                : user.getPasswordHash();

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(passwordHash)
                .authorities("ROLE_" + user.getRole().getName())
                .disabled(!user.isActive())
                .build();
    }
}
