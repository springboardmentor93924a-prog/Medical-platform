package com.medistock.repository;

import com.medistock.entity.FefoOverride;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FefoOverrideRepository extends JpaRepository<FefoOverride, Long> {
    @Query("SELECT fo FROM FefoOverride fo WHERE fo.user.id = :userId ORDER BY fo.createdAt DESC")
    Page<FefoOverride> findByUserId(@Param("userId") Long userId, Pageable pageable);
}
