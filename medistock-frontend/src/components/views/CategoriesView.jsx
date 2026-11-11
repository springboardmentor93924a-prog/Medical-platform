import React, { useState } from 'react';
import { Tags, Search } from 'lucide-react';

export const CategoriesView = ({ medicines = [] }) => {
    const [search, setSearch] = useState('');

    // Group medicines by category
    const categories = medicines.reduce((acc, med) => {
        const cat = med.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(med);
        return acc;
    }, {});

    const filteredCategories = Object.keys(categories).filter(cat => 
        cat.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Tags className="text-blue-600" /> Medicine Categories
                </h1>
                <p className="text-sm text-slate-500">Browse medicines grouped by their category.</p>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                    type="text" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.map(catName => (
                    <div key={catName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">{catName}</h3>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">
                                {categories[catName].length} items
                            </span>
                        </div>
                        <div className="p-4 max-h-48 overflow-y-auto space-y-2">
                            {categories[catName].map(med => (
                                <div key={med.id} className="text-sm flex justify-between items-center">
                                    <span className="text-slate-700 truncate">{med.name}</span>
                                    <span className="text-xs font-mono text-slate-400">{med.quantity} left</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};