/**
 * MediStock Facility & Operational Images Registry
 */

export const FACILITY_GALLERY = [
    {
        id: 'img-vault-01',
        title: 'Central Pharmacy Vault',
        subtitle: 'Main Formulary Reserve & High-Density Automated Shelving',
        zone: 'Zone A - Basement B2',
        temperature: '21.4°C Ambient',
        humidity: '42% RH',
        category: 'Vault',
        imageUrl: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1200&q=80',
        badge: 'High Density',
        operationalStatus: 'Nominal'
    },
    {
        id: 'img-coldchain-02',
        title: 'Biologics & Cold-Chain Vault',
        subtitle: 'Sub-Zero & 2°C–8°C Cryo-Monitored Refrigeration Units',
        zone: 'Zone C - Bio-Storage',
        temperature: '3.8°C Regulated',
        humidity: '38% RH',
        category: 'Cold-Chain',
        imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
        badge: 'Critical Tier',
        operationalStatus: 'Monitored (Telemetry Active)'
    },
    {
        id: 'img-pharmacist-03',
        title: 'Lot Verification & Compounding',
        subtitle: 'Pharmacist Double-Check Station & Barcode Serialization',
        zone: 'Dispensing Lab 3',
        temperature: '22.0°C Ambient',
        humidity: '45% RH',
        category: 'Dispensing',
        imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80',
        badge: 'Staffed 24/7',
        operationalStatus: 'Active Verification'
    },
    {
        id: 'img-shelves-04',
        title: 'Emergency Formulary Depot',
        subtitle: 'Rapid-Access ICU, Trauma & Code Blue Tray Staging',
        zone: 'Level 1 Trauma Annex',
        temperature: '20.8°C Ambient',
        humidity: '44% RH',
        category: 'Emergency',
        imageUrl: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=1200&q=80',
        badge: 'Rapid Response',
        operationalStatus: 'Ready'
    },
    {
        id: 'img-logistics-05',
        title: 'Inbound Logistics & Receiving Bay',
        subtitle: 'Certified Distributor Intake, Quarantine & GxP Inbound Inspection',
        zone: 'Dock 4 Logistics',
        temperature: '19.5°C Ambient',
        humidity: '48% RH',
        category: 'Logistics',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
        badge: 'Inbound Dock',
        operationalStatus: 'Active Intake'
    }
];

export const BRAND_ASSETS = {
    logoEmerald: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=400&q=80',
    appTitle: 'MediStock Enterprise',
    motto: 'Smarter Inventory. Safer Healthcare.'
};
