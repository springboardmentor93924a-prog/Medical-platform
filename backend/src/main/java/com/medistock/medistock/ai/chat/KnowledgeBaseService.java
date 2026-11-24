package com.medistock.medistock.ai.chat;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class KnowledgeBaseService {

    public record KnowledgeSnippet(
            String topic,
            String title,
            String content,
            Set<String> keywords
    ) {}

    private final List<KnowledgeSnippet> snippets = new ArrayList<>();

    public KnowledgeBaseService() {
        initKnowledgeBase();
    }

    private void initKnowledgeBase() {
        snippets.add(new KnowledgeSnippet(
                "FEFO_POLICY",
                "First Expired, First Out (FEFO) Clinical Protocol",
                "First Expired, First Out (FEFO): In MediStock, medications with the earliest eligible non-expired expiry dates must always be picked and dispensed first. " +
                "Only batches with status 'ACTIVE' and expiry_date >= current_date are eligible for dispensing. Batches marked 'EXPIRED', 'QUARANTINED', " +
                "or 'RECALLED' are automatically blocked from dispensing. Near-expiry batches are monitored in 7-day (Critical), 30-day (Near), " +
                "60-day (Moderate), and 90-day (Warning) tiers. Skipping an earlier-expiring batch requires an explicit clinical override reason.",
                Set.of("fefo", "expire", "expiry", "expired", "first out", "batch", "shelf life", "shelf", "lot", "override", "dispense", "rotation")
        ));

        snippets.add(new KnowledgeSnippet(
                "PURCHASE_WORKFLOW",
                "Purchase Order Lifecycle & Approval Governance",
                "Purchase order state transitions follow: PENDING_APPROVAL -> APPROVED -> ORDERED -> SHIPPED -> IN_TRANSIT -> RECEIVED / DELIVERED. " +
                "Every purchase order created by staff or pharmacists defaults to 'PENDING_APPROVAL' status. Only system Administrators have authority " +
                "to approve purchase orders. Self-approval is strictly forbidden: an Administrator cannot approve a purchase order that they created personally. " +
                "Received shipments must be verified and logged with Goods Receipt Notes (GRN) before updating available batch inventory.",
                Set.of("purchase", "purchase order", "order approval", "po", "approve", "approval", "pending", "sign off", "requisition", "grn", "receiving", "delivery", "supplier")
        ));

        snippets.add(new KnowledgeSnippet(
                "INVENTORY_TERMINOLOGY",
                "Inventory Lot Statuses & Transaction Types",
                "Inventory batches have distinct statuses: ACTIVE (usable, dispensable stock), EXPIRED (past shelf life, quarantined for disposal), " +
                "QUARANTINED (withheld pending inspection), RECALLED (withheld due to manufacturer quality notice), and DEPLETED (zero stock). " +
                "Stock logs record all movements using transaction types: 'DISPENSED' (issued to patient/ward), 'RECEIVED' (incoming supplier goods), " +
                "'ADJUSTED' (physical audit reconciliation), and 'DISCARDED' (expired/damaged lot disposal).",
                Set.of("status", "batch status", "active", "quarantine", "quarantined", "recalled", "depleted", "transaction", "stock log", "dispensed", "adjusted")
        ));

        snippets.add(new KnowledgeSnippet(
                "DEMAND_FORECASTING",
                "Demand Velocity & Dynamic Reorder Governance",
                "Demand forecasting calculates Average Daily Usage (ADU) strictly from historical 'DISPENSED' transactions over 7, 30, or 90 days. " +
                "The system never uses static arbitrary reorder limits. Reorder Point is calculated dynamically as ROP = ADU * LeadTime + SafetyStock, " +
                "where SafetyStock = z * sigma_d * sqrt(LeadTime). When net available stock is at or below ROP, replenishment is triggered with urgency " +
                "levels: STOCKOUT_IMMINENT (0 usable units), CRITICAL_SHORTAGE (stock < lead time demand), or REORDER_RECOMMENDED.",
                Set.of("forecast", "forecasting", "demand", "adu", "velocity", "reorder", "reorder point", "rop", "safety stock", "lead time", "replenishment", "shortage", "stockout", "average daily usage", "daily usage", "usage", "consumption")
        ));

        snippets.add(new KnowledgeSnippet(
                "ROLE_SECURITY",
                "Role Authorization & Multi-Tenant Data Protection",
                "MediStock enforces role boundaries: Admin has full authority including PO approvals, financial loss, and user audit logs. " +
                "Pharmacist manages clinical inventory, demand forecasts, and supplier directory, with read-only visibility into pending PO approvals. " +
                "Staff is restricted to checking medication availability, assigned tasks, and receiving deliveries (blocked from financials, forecasts, and PO approvals). " +
                "Supplier is strictly isolated to viewing their own registered profile and active purchase orders (blocked from hospital stock, clinical records, and other suppliers).",
                Set.of("role", "permission", "security", "admin", "pharmacist", "staff", "supplier", "tenant", "access", "boundary", "isolation")
        ));
    }

    /**
     * Retrieves the most relevant SOP snippets based on query intent.
     */
    public List<KnowledgeSnippet> findRelevantKnowledge(String query) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        String lowerQuery = query.toLowerCase();
        List<ScoredSnippet> scored = new ArrayList<>();

        for (KnowledgeSnippet s : snippets) {
            int score = 0;
            for (String kw : s.keywords()) {
                if (lowerQuery.contains(kw)) {
                    score += 2;
                }
            }
            if (lowerQuery.contains(s.title().toLowerCase())) {
                score += 3;
            }
            if (score > 0) {
                scored.add(new ScoredSnippet(s, score));
            }
        }

        scored.sort((a, b) -> Integer.compare(b.score(), a.score()));

        List<KnowledgeSnippet> result = new ArrayList<>();
        for (int i = 0; i < Math.min(2, scored.size()); i++) {
            result.add(scored.get(i).snippet());
        }
        return result;
    }

    public List<KnowledgeSnippet> getAllSnippets() {
        return Collections.unmodifiableList(snippets);
    }

    private record ScoredSnippet(KnowledgeSnippet snippet, int score) {}
}
