package com.medistock.backend.entity;

public enum StockChangeType {
    INITIAL, ADJUSTMENT, PURCHASE_RECEIVED, EXPIRED_REMOVED,
    WASTAGE_DAMAGED, WASTAGE_LOST, WASTAGE_OTHER,   // stock written off as a loss
    RETURNED                                          // stock sent back to the supplier
}
