package com.swimclub.service;

import com.swimclub.dto.PoolDto;
import com.swimclub.entity.Pool;
import com.swimclub.repository.PoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PoolService {

    private final PoolRepository poolRepository;

    public List<PoolDto> getAllPools() {
        return poolRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public PoolDto createPool(PoolDto poolDto) {
        Pool pool = mapToEntity(poolDto);
        return mapToDto(poolRepository.save(pool));
    }

    public PoolDto updatePool(String id, PoolDto poolDto) {
        return poolRepository.findById(id).map(existing -> {
            existing.setName(poolDto.getName());
            existing.setLocation(poolDto.getLocation());
            existing.setDimensions(poolDto.getDimensions());
            existing.setLanes(poolDto.getLanes());
            existing.setStatus(poolDto.getStatus());
            existing.setIconColor(poolDto.getIconColor());
            existing.setTags(poolDto.getTags());
            return mapToDto(poolRepository.save(existing));
        }).orElseThrow(() -> new RuntimeException("Pool not found with id: " + id));
    }

    public void deletePool(String id) {
        poolRepository.deleteById(id);
    }

    private PoolDto mapToDto(Pool pool) {
        return PoolDto.builder()
                .id(pool.getId())
                .name(pool.getName())
                .location(pool.getLocation())
                .dimensions(pool.getDimensions())
                .lanes(pool.getLanes())
                .status(pool.getStatus())
                .iconColor(pool.getIconColor())
                .tags(pool.getTags())
                .build();
    }

    private Pool mapToEntity(PoolDto dto) {
        return Pool.builder()
                .name(dto.getName())
                .location(dto.getLocation())
                .dimensions(dto.getDimensions())
                .lanes(dto.getLanes())
                .status(dto.getStatus())
                .iconColor(dto.getIconColor())
                .tags(dto.getTags())
                .build();
    }
}
