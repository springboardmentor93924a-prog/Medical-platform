import React from 'react';

export const MediStockLogo = ({ size = 'md', className = '' }) => {
    // Generous sizing for clear, crisp visibility of logo, Rx symbol, and clinical text
    const sizeClasses = {
        sm: 'h-10 max-w-[160px]',
        md: 'h-14 max-w-[215px]',
        lg: 'h-20 max-w-[280px]',
        xl: 'h-28 max-w-[360px]'
    };

    return (
        <div className={`flex items-center select-none ${className}`}>
            <img
                src="/images/medistock_logo.png"
                alt="MediStock - Clinical Inventory"
                className={`w-auto object-contain drop-shadow-sm transition-transform hover:scale-[1.02] ${sizeClasses[size] || sizeClasses.md}`}
            />
        </div>
    );
};

export default MediStockLogo;
