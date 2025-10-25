package com.xyzdevfoundation.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

/**
 * API Gateway Application for Microservices AI Platform
 * 
 * Demonstrates XYZ Dev Foundation requirements:
 * - Java Spring Boot microservices
 * - REST API routing and load balancing
 * - Cross-service communication
 * - Performance optimization and monitoring
 */
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("user-service", r -> r.path("/api/v1/users/**")
                        .uri("http://user-service:8081"))
                .route("data-service", r -> r.path("/api/v1/data/**")
                        .uri("http://data-service:8082"))
                .route("ai-ml-service", r -> r.path("/api/v1/ml/**")
                        .uri("http://ai-ml-service:8083"))
                .route("notification-service", r -> r.path("/api/v1/notifications/**")
                        .uri("http://notification-service:8084"))
                .build();
    }

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowCredentials(true);
        corsConfig.addAllowedOriginPattern("*");
        corsConfig.addAllowedHeader("*");
        corsConfig.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}