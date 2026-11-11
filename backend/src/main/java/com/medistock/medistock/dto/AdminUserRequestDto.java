package com.medistock.medistock.dto;

public record AdminUserRequestDto(
        String username,
        String name,
        String email,
        String phone,
        String password,
        Integer roleId,
        Boolean active) {
}
