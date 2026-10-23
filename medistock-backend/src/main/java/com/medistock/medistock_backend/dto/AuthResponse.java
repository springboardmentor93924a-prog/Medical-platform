package com.medistock.medistock_backend.dto;

import com.medistock.medistock_backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;
import java.util.stream.Collectors;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserDto user;

    @Data
    @AllArgsConstructor
    public static class UserDto {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private List<String> roles;
        private boolean enabled;

        public static UserDto fromEntity(User user) {
            return new UserDto(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toList()),
                    user.isEnabled()
            );
        }
    }
}