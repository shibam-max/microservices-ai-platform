package com.xyzdevfoundation.user.controller;

import com.xyzdevfoundation.user.dto.UserCreateRequest;
import com.xyzdevfoundation.user.dto.UserResponse;
import com.xyzdevfoundation.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

/**
 * User Management REST Controller
 * 
 * Demonstrates XYZ Dev Foundation requirements:
 * - Java Spring Boot REST APIs
 * - Object-oriented design and clean architecture
 * - Database integration with JPA
 * - Performance optimization with caching
 */
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Management", description = "User CRUD operations and management")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create new user", description = "Creates a new user in the system")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        log.info("Creating new user with username: {}", request.getUsername());
        UserResponse user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieves user information by ID")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        log.info("Fetching user with ID: {}", id);
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping
    @Operation(summary = "Get all users", description = "Retrieves paginated list of users")
    public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
        log.info("Fetching users with pagination: {}", pageable);
        Page<UserResponse> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user", description = "Updates existing user information")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID id, 
                                                  @Valid @RequestBody UserCreateRequest request) {
        log.info("Updating user with ID: {}", id);
        UserResponse user = userService.updateUser(id, request);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user", description = "Soft deletes user from the system")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        log.info("Deleting user with ID: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    @Operation(summary = "Search users", description = "Search users by username or email")
    public ResponseEntity<Page<UserResponse>> searchUsers(@RequestParam String query, Pageable pageable) {
        log.info("Searching users with query: {}", query);
        Page<UserResponse> users = userService.searchUsers(query, pageable);
        return ResponseEntity.ok(users);
    }
}