package com.medistock.medistock.dto;

public record AdminUserDto(
        Integer userId,
        String username,
        String name,
        String email,
        String phone,
        boolean active,
        Integer roleId,
        String roleName) {
}
