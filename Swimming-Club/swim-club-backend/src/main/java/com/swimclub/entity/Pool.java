package com.swimclub.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "pools")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pool {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String location;
    private String dimensions;
    private Integer lanes;
    private String status;
    private String iconColor;

    @ElementCollection
    @CollectionTable(name = "pool_tags", joinColumns = @JoinColumn(name = "pool_id"))
    @Column(name = "tag")
    private List<String> tags;
}
