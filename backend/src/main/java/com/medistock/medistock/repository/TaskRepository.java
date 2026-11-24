package com.medistock.medistock.repository;

import com.medistock.medistock.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Integer> {

    List<Task> findAllByOrderByCreatedAtDesc();

    List<Task> findByAssignedToOrderByDueDateAsc(Integer assignedTo);

    List<Task> findByAssignedToAndStatusOrderByDueDateAsc(Integer assignedTo, String status);

    List<Task> findByStatusOrderByDueDateAsc(String status);
}
