package com.medistock.medistock.dto;

public class ContactDto {

    private Integer userId;
    private String name;
    private String email;
    private String phone;
    private String roleName;
    private String initials;
    private String lastMessage;
    private String lastMessageTime;
    private boolean isOnline = true;

    public ContactDto() {
    }

    public ContactDto(Integer userId, String name, String email, String phone, String roleName) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.roleName = roleName != null ? roleName.toUpperCase() : "STAFF";
        this.initials = computeInitials(name);
        this.isOnline = true;
    }

    private String computeInitials(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) return "US";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length >= 2) {
            return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return fullName.substring(0, Math.min(2, fullName.length())).toUpperCase();
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getInitials() {
        return initials;
    }

    public void setInitials(String initials) {
        this.initials = initials;
    }

    public String getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(String lastMessage) {
        this.lastMessage = lastMessage;
    }

    public String getLastMessageTime() {
        return lastMessageTime;
    }

    public void setLastMessageTime(String lastMessageTime) {
        this.lastMessageTime = lastMessageTime;
    }

    public boolean isOnline() {
        return isOnline;
    }

    public void setOnline(boolean online) {
        isOnline = online;
    }
}
