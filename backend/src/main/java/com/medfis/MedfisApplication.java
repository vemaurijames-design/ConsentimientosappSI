package com.medfis;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MedfisApplication {
    public static void main(String[] args) {
        SpringApplication.run(MedfisApplication.class, args);
    }
}
