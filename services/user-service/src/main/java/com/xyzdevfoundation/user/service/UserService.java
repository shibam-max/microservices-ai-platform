package com.xyzdevfoundation.user.service;

import com.xyzdevfoundation.user.dto.UserCreateRequest;
import com.xyzdevfoundation.user.dto.UserResponse;
import com.xyzdevfoundation.user.model.User;
import com.xyzdevfoundation.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * User Service with Redis caching and Kafka messaging
 * 
 * Demonstrates XYZ Dev Foundation requirements:
 * - Object-oriented design and service layer architecture
 * - Database operations with JPA
 * - Redis caching for performance optimization
 * - Kafka messaging for event-driven architecture
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Cacheable(value = "users", key = "#id")
    public UserResponse getUserById(UUID id) {
        log.info("Fetching user from database with ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
        return UserResponse.fromUser(user);
    }

    public UserResponse createUser(UserCreateRequest request) {
        log.info("Creating new user with username: {}", request.getUsername());
        
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists: " + request.getUsername());
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists: " + request.getEmail());
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .status(User.UserStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);
        
        // Publish user created event to Kafka
        publishUserEvent("USER_CREATED", savedUser);
        
        log.info("User created successfully with ID: {}", savedUser.getId());
        return UserResponse.fromUser(savedUser);
    }

    @CacheEvict(value = "users", key = "#id")
    public UserResponse updateUser(UUID id, UserCreateRequest request) {
        log.info("Updating user with ID: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());

        User updatedUser = userRepository.save(user);
        
        // Publish user updated event to Kafka
        publishUserEvent("USER_UPDATED", updatedUser);
        
        log.info("User updated successfully with ID: {}", updatedUser.getId());
        return UserResponse.fromUser(updatedUser);
    }

    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(UUID id) {
        log.info("Deleting user with ID: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));

        user.setStatus(User.UserStatus.INACTIVE);
        userRepository.save(user);
        
        // Publish user deleted event to Kafka
        publishUserEvent("USER_DELETED", user);
        
        log.info("User deleted successfully with ID: {}", id);
    }

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        log.info("Fetching all users with pagination: {}", pageable);
        return userRepository.findAll(pageable)
                .map(UserResponse::fromUser);
    }

    public Page<UserResponse> searchUsers(String query, Pageable pageable) {
        log.info("Searching users with query: {}", query);
        return userRepository.searchUsers(query, pageable)
                .map(UserResponse::fromUser);
    }

    private void publishUserEvent(String eventType, User user) {
        try {
            UserEvent event = UserEvent.builder()
                    .eventType(eventType)
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .timestamp(System.currentTimeMillis())
                    .build();
            
            kafkaTemplate.send("user-events", event);
            log.info("Published {} event for user: {}", eventType, user.getId());
        } catch (Exception e) {
            log.error("Failed to publish user event: {}", eventType, e);
        }
    }

    // Inner class for Kafka events
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UserEvent {
        private String eventType;
        private UUID userId;
        private String username;
        private String email;
        private long timestamp;
    }
}