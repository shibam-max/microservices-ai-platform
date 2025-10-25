package com.xyzdevfoundation.data.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataProcessingRequest {

    @NotBlank(message = "Data type is required")
    private String dataType;

    @NotNull(message = "Data content is required")
    private Map<String, Object> data;

    private String source;
    private String processingType;
    private Map<String, Object> metadata;
}