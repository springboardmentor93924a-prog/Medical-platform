package com.medistock.medistock.dto.email;

public class SmtpConnectionStatusDto {
    private boolean connected;
    private String host;
    private int port;
    private String protocol;
    private long latencyMs;
    private String statusMessage;
    private boolean authConfigured;
    private boolean startTlsEnabled;

    public SmtpConnectionStatusDto() {}

    public boolean isConnected() {
        return connected;
    }

    public void setConnected(boolean connected) {
        this.connected = connected;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public String getProtocol() {
        return protocol;
    }

    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public long getLatencyMs() {
        return latencyMs;
    }

    public void setLatencyMs(long latencyMs) {
        this.latencyMs = latencyMs;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }

    public boolean isAuthConfigured() {
        return authConfigured;
    }

    public void setAuthConfigured(boolean authConfigured) {
        this.authConfigured = authConfigured;
    }

    public boolean isStartTlsEnabled() {
        return startTlsEnabled;
    }

    public void setStartTlsEnabled(boolean startTlsEnabled) {
        this.startTlsEnabled = startTlsEnabled;
    }
}

