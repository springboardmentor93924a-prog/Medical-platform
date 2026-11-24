package com.medistock.medistock.repository;

import com.medistock.medistock.entity.RestoreHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestoreHistoryRepository extends JpaRepository<RestoreHistory, Integer> {

    Optional<RestoreHistory> findByRestoreReference(String restoreReference);

    List<RestoreHistory> findAllByOrderByStartedAtDesc();

    Page<RestoreHistory> findAllByOrderByStartedAtDesc(Pageable pageable);

    Optional<RestoreHistory> findTopByOrderByStartedAtDesc();
}

