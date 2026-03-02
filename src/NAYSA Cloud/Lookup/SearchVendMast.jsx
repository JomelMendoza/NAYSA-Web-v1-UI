
import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, faSort, faSortUp, faSortDown, 
    faSpinner, faSearch, faFilter, faUser,
} from '@fortawesome/free-solid-svg-icons';
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";

const PayeeMastLookupModal = ({ isOpen, onClose, customParam }) => {
    const columnConfig = [
        { key: 'vendCode', label: 'Payee Code', width: '120px' },
        { key: 'vendName', label: 'Payee Name', width: '350px' },
        { key: 'source',   label: 'Source',     width: '80px'  },
        { key: 'vendTin',  label: 'TIN',        width: '200px' },
        { key: 'atcCode',  label: 'ATC',        width: '60px'  },
        { key: 'vatCode',  label: 'VAT',        width: '60px'  },
        { key: 'addr',     label: 'Address',    width: 'auto'  }
    ];

    const [payees, setPayees] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMode, setSearchMode] = useState('part'); 
    const [filters, setFilters] = useState(
        columnConfig.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {})
    );
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const json_values = {
                search: searchTerm.trim() || null,
                filter: customParam || "ActiveAll",
                searchMode: searchMode 
            };
            const payload = { json_data: json_values };
            const { data: result } = await apiClient.get("/lookupVendMast", {
                params: { json_data: JSON.stringify(payload) }
            });

            const payeeData = Array.isArray(result?.data) && result.data[0]?.result
                ? JSON.parse(result.data[0].result)
                : [];

            setPayees(payeeData);
            setFiltered(payeeData);
            setCurrentPage(1); 
        } catch (err) {
            console.error("Failed to fetch payees:", err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, customParam, searchMode]);

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen]);

    useEffect(() => {
        let currentFiltered = [...payees];
        currentFiltered = currentFiltered.filter(item =>
            columnConfig.every(col => 
                (item[col.key] || '').toLowerCase().includes((filters[col.key] || '').toLowerCase())
            )
        );

        if (sortConfig.key) {
            currentFiltered.sort((a, b) => {
                const aValue = a[sortConfig.key] || '';
                const bValue = b[sortConfig.key] || '';
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        setFiltered(currentFiltered);
    }, [filters, payees, sortConfig]);

    if (!isOpen) return null;

    const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalItems = filtered.length;
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col relative overflow-hidden">
                
                <button onClick={() => onClose(null)} className="absolute top-3 right-3 text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100 z-20">
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>

                <h2 className="text-sm font-semibold text-blue-800 p-3 border-b border-gray-100">Select Payee</h2>

                <div className="p-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-center">
                    {/* Search Input with Clear Button */}
                    <div className="relative flex-grow max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <FontAwesomeIcon icon={faUser} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search Payee Name..."
                            className="block w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} size="sm" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 px-3 border-l border-gray-300">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name="sm" value="start" checked={searchMode === 'start'} onChange={(e) => setSearchMode(e.target.value)} className="accent-blue-600" />
                            <span className="text-xs text-gray-700">Starts with</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name="sm" value="part" checked={searchMode === 'part'} onChange={(e) => setSearchMode(e.target.value)} className="accent-blue-600" />
                            <span className="text-xs text-gray-700">Contains</span>
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => fetchData()} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors">
                            <FontAwesomeIcon icon={faFilter} size="sm" /> Load Records
                        </button>
                        
                        
                    </div>
                </div>

                {/* Table and Pagination logic remains the same... */}
                <div className="flex-grow overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-blue-500">
                            <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mr-3" />
                            <span>Fetching data...</span>
                        </div>
                    ) : (
                        <div className="overflow-y-auto custom-scrollbar flex-grow">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm text-[11px] font-bold text-blue-900">
                                    <tr>
                                        {columnConfig.map(col => (
                                            <th key={col.key} style={{ width: col.width, minWidth: col.width }} className="px-4 py-2 text-left cursor-pointer hover:bg-blue-100 border-b border-gray-200" onClick={() => handleSort(col.key)}>
                                                <div className="flex items-center justify-between">
                                                    {col.label} {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="text-blue-500"/> : <FontAwesomeIcon icon={faSortDown} className="text-blue-500"/>) : <FontAwesomeIcon icon={faSort} className="text-gray-400" />}
                                                </div>
                                            </th>
                                        ))}
                                        <th className="px-4 py-2 text-left w-[80px] border-b border-gray-200">Action</th>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        {columnConfig.map(col => (
                                            <th key={col.key} className="px-3 py-1 border-b border-gray-200">
                                                <input 
                                                    type="text" 
                                                    value={filters[col.key]} 
                                                    onChange={(e) => setFilters({ ...filters, [col.key]: e.target.value })} 
                                                    placeholder={`Filter...`} 
                                                    className="block w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:border-blue-400 outline-none" 
                                                />
                                            </th>
                                        ))}
                                        <th className="px-3 py-1 border-b border-gray-200"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100 text-[11px]">
                                    {paginatedData.map((payee, index) => (
                                        <tr key={index} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => onClose(payee)}>
                                            {columnConfig.map(col => (
                                                <td key={col.key} className="px-4 py-2 break-words whitespace-normal align-top" style={{ width: col.width }}>
                                                    {payee[col.key]}
                                                </td>
                                            ))}
                                            <td className="px-4 py-2 align-top">
                                                <button className="px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-700 text-[10px]">Apply</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="p-3 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-600">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-blue-100 rounded disabled:opacity-50 hover:bg-blue-200 transition-colors">Previous</button>
                    <div>Showing {startItem}-{endItem} of {totalItems}</div>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={filtered.length <= currentPage * itemsPerPage} className="px-3 py-1 bg-blue-100 rounded disabled:opacity-50 hover:bg-blue-200 transition-colors">Next</button>
                </div>
            </div>
            {/* Styles remain same as your original */}
        </div>
    );
};

export default PayeeMastLookupModal;