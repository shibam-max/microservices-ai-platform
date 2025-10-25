package com.xyzdevfoundation.data.controller;

import com.xyzdevfoundation.data.dto.DataProcessingRequest;
import com.xyzdevfoundation.data.dto.DataResponse;
import com.xyzdevfoundation.data.service.DataProcessingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Data Processing REST Controller
 * 
 * Demonstrates XYZ Dev Foundation requirements:
 * - Multi-database integration (PostgreSQL, MongoDB, Elasticsearch)
 * - Real-time data processing with Kafka
 * - RESTful API design
 * - Performance optimization
 */
@RestController
@RequestMapping("/api/v1/data")
@Tag(name = "Data Processing", description = "Data ingestion, processing, and analytics")
@RequiredArgsConstructor
@Slf4j
public class DataController {

    private final DataProcessingService dataProcessingService;

    @PostMapping("/ingest")
    @Operation(summary = "Ingest data", description = "Ingest raw data for processing")
    public ResponseEntity<DataResponse> ingestData(@Valid @RequestBody DataProcessingRequest request) {
        log.info("Ingesting data of type: {}", request.getDataType());
        DataResponse response = dataProcessingService.ingestData(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get data by ID", description = "Retrieve processed data by ID")
    public ResponseEntity<DataResponse> getDataById(@PathVariable UUID id) {
        log.info("Fetching data with ID: {}", id);
        DataResponse data = dataProcessingService.getDataById(id);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/search")
    @Operation(summary = "Search data", description = "Search data using Elasticsearch")
    public ResponseEntity<Page<DataResponse>> searchData(
            @RequestParam String query,
            @RequestParam(required = false) String dataType,
            Pageable pageable) {
        log.info("Searching data with query: {}", query);
        Page<DataResponse> results = dataProcessingService.searchData(query, dataType, pageable);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/process")
    @Operation(summary = "Process data", description = "Process data using ML algorithms")
    public ResponseEntity<Map<String, Object>> processData(@Valid @RequestBody DataProcessingRequest request) {
        log.info("Processing data of type: {}", request.getDataType());
        Map<String, Object> result = dataProcessingService.processData(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get data analytics", description = "Get analytics and insights from processed data")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestParam(required = false) String dataType,
            @RequestParam(required = false) String timeRange) {
        log.info("Getting analytics for dataType: {}, timeRange: {}", dataType, timeRange);
        Map<String, Object> analytics = dataProcessingService.getAnalytics(dataType, timeRange);
        return ResponseEntity.ok(analytics);
    }

    @PostMapping("/stream")
    @Operation(summary = "Stream data", description = "Stream data to Kafka for real-time processing")
    public ResponseEntity<String> streamData(@Valid @RequestBody List<DataProcessingRequest> requests) {
        log.info("Streaming {} data records", requests.size());
        String streamId = dataProcessingService.streamData(requests);
        return ResponseEntity.ok(streamId);
    }
}