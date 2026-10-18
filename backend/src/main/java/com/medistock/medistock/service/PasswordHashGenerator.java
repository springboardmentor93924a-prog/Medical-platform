
package com.medistock.medistock.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String password = "MediStock@123";

        System.out.println("Password hash:");
        System.out.println(encoder.encode(password));
    }
}
