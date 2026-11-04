package com.medistock;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;


@SpringBootApplication
@ComponentScan(basePackages = "com.medistock")
public class MediStockApplication {

    public static void main(String[] args) {
        SpringApplication.run(MediStockApplication.class, args);
    }

    @Bean
public ApplicationRunner checkSupplierController(
        ApplicationContext context) {

    return args -> {
        System.out.println(
            "SupplierProfileController registered: "
            + context.containsBean("supplierProfileController")
        );
    };
}
}