package com.swimclub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PoolDto {
    private String id;
    private String name;
    private String location;
    private String dimensions;
    private Integer lanes;
    private String status;
    private String iconColor;
    private List<String> tags;
}
