package com.medistock.security;

import com.medistock.entity.User;

public class CustomUserDetails extends UserPrincipal {

    public CustomUserDetails(User user) {
        super(user);
    }
}
