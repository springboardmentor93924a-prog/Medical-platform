package com.medistock.repository;

import com.medistock.entity.PurchaseOrder;
import com.medistock.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByPoNumber(String poNumber);
    boolean existsByPoNumber(String poNumber);

    long countByOrderStatus(OrderStatus orderStatus);

    @Query("SELECT COUNT(po) FROM PurchaseOrder po WHERE po.supplier.id = :supplierId")
    long countBySupplierId(@Param("supplierId") Long supplierId);

    @Query("SELECT COUNT(po) FROM PurchaseOrder po WHERE po.supplier.id = :supplierId AND po.orderStatus = :orderStatus")
    long countBySupplierIdAndOrderStatus(@Param("supplierId") Long supplierId, @Param("orderStatus") OrderStatus orderStatus);

    @Query("SELECT COALESCE(SUM(po.totalAmount), 0) FROM PurchaseOrder po WHERE po.orderStatus != 'CANCELLED'")
    BigDecimal sumTotalAmount();

    @Query("SELECT COALESCE(SUM(po.totalAmount), 0) FROM PurchaseOrder po WHERE po.supplier.id = :supplierId AND po.orderStatus != 'CANCELLED'")
    BigDecimal sumTotalAmountBySupplier(@Param("supplierId") Long supplierId);

    Page<PurchaseOrder> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po WHERE po.supplier.id = :supplierId ORDER BY po.createdAt DESC")
    Page<PurchaseOrder> findBySupplierIdOrderByCreatedAtDesc(@Param("supplierId") Long supplierId, Pageable pageable);

    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "(:supplierId IS NULL OR po.supplier.id = :supplierId) AND " +
           "(:status IS NULL OR po.orderStatus = :status) " +
           "ORDER BY po.createdAt DESC")
    Page<PurchaseOrder> filterOrders(
            @Param("supplierId") Long supplierId,
            @Param("status") OrderStatus status,
            Pageable pageable
    );

    List<PurchaseOrder> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT po FROM PurchaseOrder po WHERE po.supplier.id = :supplierId ORDER BY po.createdAt DESC")
    List<PurchaseOrder> findTop5BySupplierIdOrderByCreatedAtDesc(@Param("supplierId") Long supplierId);
}
