package com.medistock.medistock.repository;

import com.medistock.medistock.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Integer> {

    @Query("""
            SELECT DISTINCT sale FROM Sale sale
            LEFT JOIN FETCH sale.user
            LEFT JOIN FETCH sale.items item
            LEFT JOIN FETCH item.batch batch
            LEFT JOIN FETCH batch.medicine
            ORDER BY sale.saleDate DESC, sale.saleId DESC
            """)
    List<Sale> findAllWithItems();

    @Query("""
            SELECT DISTINCT sale FROM Sale sale
            LEFT JOIN FETCH sale.user
            LEFT JOIN FETCH sale.items item
            LEFT JOIN FETCH item.batch batch
            LEFT JOIN FETCH batch.medicine
            WHERE sale.saleId = :id
            """)
    Optional<Sale> findWithItemsById(@Param("id") Integer id);
}
