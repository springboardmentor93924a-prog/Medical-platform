package com.medistock.medistock;

import org.springframework.security.crypto.bcrypt.BCrypt;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        String p1 = "password123";
        String p2 = "ChangeMe_123!";

        String h1 = BCrypt.hashpw(p1, BCrypt.gensalt(10));
        String h2 = BCrypt.hashpw(p2, BCrypt.gensalt(10));

        System.out.println("password123=" + h1);
        System.out.println("ChangeMe_123!=" + h2);
    }
}
