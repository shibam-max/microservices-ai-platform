package com.xyzdevfoundation.data.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataResponse {

    private UUID id;
    private String dataType;
    private Map<String, Object> data;
    private String source;
    private String status;
    private Map<String, Object> processedData;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}