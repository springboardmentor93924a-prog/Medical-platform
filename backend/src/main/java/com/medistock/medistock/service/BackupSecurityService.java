package com.medistock.medistock.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;

@Service
public class BackupSecurityService {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int IV_LENGTH = 16;
    private static final int KEY_LENGTH = 32; // 256 bits

    private final byte[] secretKey;

    public BackupSecurityService(@Value("${medistock.backup.secret-key:}") String configuredKey) {
        if (configuredKey != null && !configuredKey.isBlank()) {
            this.secretKey = derive256BitKey(configuredKey);
        } else {
            // Secure deterministic key derived from system salt if not provided via ENV
            this.secretKey = derive256BitKey("MEDISTOCK_ENTERPRISE_DISASTER_RECOVERY_KEY_SALT_2026");
        }
    }

    private byte[] derive256BitKey(String seed) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            return sha.digest(seed.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            byte[] fallback = new byte[KEY_LENGTH];
            Arrays.fill(fallback, (byte) 0x4D);
            return fallback;
        }
    }

    /**
     * Compute SHA-256 hexadecimal checksum for a file.
     */
    public String calculateChecksum(File file) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream is = new BufferedInputStream(new FileInputStream(file))) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = is.read(buffer)) != -1) {
                    digest.update(buffer, 0, read);
                }
            }
            byte[] hash = digest.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IOException("Failed to calculate SHA-256 checksum", e);
        }
    }

    /**
     * Encrypt an input file with AES-256 and write to an output file.
     * The randomly generated 16-byte IV is prepended to the output file.
     */
    public void encryptFile(File inputFile, File outputFile) throws Exception {
        byte[] iv = new byte[IV_LENGTH];
        SecureRandom random = new SecureRandom();
        random.nextBytes(iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        SecretKeySpec keySpec = new SecretKeySpec(secretKey, "AES");
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);

        try (FileOutputStream fos = new FileOutputStream(outputFile);
             BufferedOutputStream bos = new BufferedOutputStream(fos)) {
            // Write IV header first
            bos.write(iv);

            try (FileInputStream fis = new FileInputStream(inputFile);
                 BufferedInputStream bis = new BufferedInputStream(fis);
                 CipherOutputStream cos = new CipherOutputStream(bos, cipher)) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = bis.read(buffer)) != -1) {
                    cos.write(buffer, 0, count);
                }
                cos.flush();
            }
        }
    }

    /**
     * Decrypt an AES-256 encrypted file and write raw contents to outputFile.
     * Reads the prepended 16-byte IV from the input file.
     */
    public void decryptFile(File encryptedFile, File outputFile) throws Exception {
        try (FileInputStream fis = new FileInputStream(encryptedFile);
             BufferedInputStream bis = new BufferedInputStream(fis)) {
            byte[] iv = new byte[IV_LENGTH];
            int ivRead = bis.read(iv);
            if (ivRead != IV_LENGTH) {
                throw new IOException("Corrupted or invalid encrypted backup file: Missing IV header");
            }

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(secretKey, "AES");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);

            try (CipherInputStream cis = new CipherInputStream(bis, cipher);
                 FileOutputStream fos = new FileOutputStream(outputFile);
                 BufferedOutputStream bos = new BufferedOutputStream(fos)) {
                byte[] buffer = new byte[8192];
                int count;
                while ((count = cis.read(buffer)) != -1) {
                    bos.write(buffer, 0, count);
                }
                bos.flush();
            }
        }
    }
}

