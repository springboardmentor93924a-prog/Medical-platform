package com.medistock.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Switches on @Scheduled jobs, such as the daily alert email. */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
