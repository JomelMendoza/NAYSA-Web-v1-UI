// import React, { useState, useEffect } from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faTimes, faSort, faSortUp, faSortDown, faSpinner } from '@fortawesome/free-solid-svg-icons'; // Added faSpinner
// import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";


// const CustomerMastLookupModal = ({ isOpen, onClose, customParam }) => {
//     const [customers, setCustomers] = useState([]);
//     const [filtered, setFiltered] = useState([]);
//     const [filters, setFilters] = useState({
//         custCode: '',
//         custName: '',
//         source: '',
//         custTin: '',
//         atcCode: '',
//         vatCode: '',
//         addr: ''
//     });
//     const [loading, setLoading] = useState(false);
//     const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
//     const [currentPage, setCurrentPage] = useState(1);
//     const itemsPerPage = 50;


//     useEffect(() => {
//         if (!isOpen) {
//             setCustomers([]);
//             setFiltered([]);
//             setFilters({ custCode: '', custName: '', source: '', custTin: '', atcCode: '', vatCode: '', addr: '' });
//             setSortConfig({ key: '', direction: 'asc' });
//             setCurrentPage(1); 
//             return; 
//         }
//         fetchData(currentPage);
//     }, [isOpen, customParam, currentPage]);





//    const fetchData = async (page = 1) => {
//         setLoading(true);
//         try {
//             const { data: result } = await apiClient.get("/lookupCustomer", {
//             params: {
//                 PARAMS: JSON.stringify({ search: customParam ?? "ActiveAll" }),
//                 page,
//                 itemsPerPage,
//             },
//             });
//             const custData =
//             Array.isArray(result?.data) && result.data[0]?.result
//                 ? JSON.parse(result.data[0].result)
//                 : [];
//             setCustomers(custData);
//             setFiltered(custData);
//         } catch (err) {
//             console.error("Failed to fetch customers:", err);
//             setCustomers([]);
//             setFiltered([]);
//         } finally {
//             setLoading(false);
//         }
//         };
//     const handleApply = (cust) => {
//         onClose(cust); 
//     };




//     useEffect(() => {
//         let currentFiltered = [...customers]; 
//         currentFiltered = currentFiltered.filter(item =>
//             (item.custCode || '').toLowerCase().includes((filters.custCode || '').toLowerCase()) &&
//             (item.custName || '').toLowerCase().includes((filters.custName || '').toLowerCase()) &&
//             (item.source || '').toLowerCase().includes((filters.source || '').toLowerCase()) &&
//             (item.custTin || '').toLowerCase().includes((filters.custTin || '').toLowerCase()) &&
//             (item.atcCode || '').toLowerCase().includes((filters.atcCode || '').toLowerCase()) &&
//             (item.vatCode || '').toLowerCase().includes((filters.vatCode || '').toLowerCase()) &&
//             (item.addr || '').toLowerCase().includes((filters.addr || '').toLowerCase())
//         );


//         if (sortConfig.key) {
//             currentFiltered.sort((a, b) => {
//                 const aValue = a[sortConfig.key];
//                 const bValue = b[sortConfig.key];

//                 if (aValue < bValue) {
//                     return sortConfig.direction === 'asc' ? -1 : 1;
//                 }
//                 if (aValue > bValue) {
//                     return sortConfig.direction === 'asc' ? 1 : -1;
//                 }
//                 return 0;
//             });
//         }
//         setFiltered(currentFiltered);
//         console.log('Filtered Customer Data:', currentFiltered);
//     }, [filters, customers, sortConfig]); 


//     const handleFilterChange = (e, key) => {
//         setFilters({ ...filters, [key]: e.target.value });
//     };



//     const handleSort = (key) => {
//         let direction = 'asc';
//         if (sortConfig.key === key && sortConfig.direction === 'asc') {
//             direction = 'desc';
//         }
//         setSortConfig({ key, direction });
//     };



//     const renderSortIcon = (column) => {
//         if (sortConfig.key === column) {
//             return sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="ml-1 text-blue-500" /> : <FontAwesomeIcon icon={faSortDown} className="ml-1 text-blue-500" />;
//         }
//         return <FontAwesomeIcon icon={faSort} className="ml-1 text-gray-400" />;
//     };

//     const handleNextPage = () => {
//         setCurrentPage(prevPage => prevPage + 1);
//     };

//     const handlePrevPage = () => {
//         setCurrentPage(prevPage => prevPage - 1);
//     };


//     const getPaginatedData = () => {
//         const startIndex = (currentPage - 1) * itemsPerPage;
//         const endIndex = startIndex + itemsPerPage;
//         return filtered.slice(startIndex, endIndex);
//     };



//     if (!isOpen) return null;
//     const paginatedData = getPaginatedData();
//     const totalItems = filtered.length;
//     const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
//     const endItem = Math.min(currentPage * itemsPerPage, totalItems);







//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 sm:p-6 lg:p-8 animate-fade-in">
//             <div className="bg-white rounded-lg shadow-xl w-full max-w-8xl max-h-[90vh] flex flex-col relative overflow-hidden transform scale-95 animate-scale-in">
//                 {/* Close Icon */}
//                 <button
//                     onClick={() => onClose(null)}
//                     className="absolute top-3 right-3 text-blue-500 hover:text-blue-700 transition duration-200 focus:outline-none p-1 rounded-full hover:bg-blue-100"
//                     aria-label="Close modal"
//                 >
//                     <FontAwesomeIcon icon={faTimes} size="lg" />
//                 </button>

//                 <h2 className="text-sm font-semibold text-blue-800 p-3 border-b border-gray-100">Select Customer</h2>

//                 <div className="flex-grow overflow-hidden">
//                     {loading ? (
//                         <div className="flex items-center justify-center h-full min-h-[200px] text-blue-500">
//                             <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mr-3" />
//                             <span>Loading customers...</span>
//                         </div>
//                     ) : (
//                         <div className="overflow-auto max-h-[calc(90vh-160px)] custom-scrollbar">
//                             <table className="min-w-full divide-y divide-gray-100">
//                                 <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
//                                     <tr>
//                                         {/* Headers with Sort */}
//                                         <th className="w-[140px] px-4 py-2 text-left text-xs font-bold text-blue-900 tracking-wider cursor-pointer hover:bg-blue-100 transition-colors duration-200" onClick={() => handleSort('custCode')}>
//                                             Customer Code {renderSortIcon('custCode')}
//                                         </th>
//                                         <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 tracking-wider cursor-pointer hover:bg-blue-100 transition-colors duration-200" onClick={() => handleSort('custName')}>
//                                             Customer Name {renderSortIcon('custName')}
//                                         </th>
//                                         <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 tracking-wider cursor-pointer hover:bg-blue-100 transition-colors duration-200" onClick={() => handleSort('source')}>
//                                             Source {renderSortIcon('source')}
//                                         </th>
//                                         <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 tracking-wider cursor-pointer hover:bg-blue-100 transition-colors duration-200" onClick={() => handleSort('custTin')}>
//                                             TIN {renderSortIcon('custTin')}
//                                         </th>
//                                         <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 tracking-wider cursor-pointer hover:bg-blue-100 transition-colors duration-200" onClick={() => handleSort('atcCode')}>
//                                             ATC {renderSortIcon('atcCode')}
//                                         </th>
//                                         <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 tracking-wider cursor-pointer hover:bg-blue-100 transition-colors duration-200" onClick={() => handleSort('vatCode')}>
//                                             VAT {renderSortIcon('vatCode')}
//                                         </th>
//                                         <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 tracking-wider cursor-pointer hover:bg-blue-100 transition-colors duration-200" onClick={() => handleSort('addr')}>
//                                             Address {renderSortIcon('addr')}
//                                         </th>
//                                         <th className="px-4 py-2 text-left text-xs font-bold text-blue-900 tracking-wider">
//                                             Action
//                                         </th>
//                                     </tr>
//                                     {/* Filter Row */}
//                                     <tr className="bg-gray-100">
//                                         <th className="px-3 py-1">
//                                             <input
//                                                 type="text"
//                                                 value={filters.custCode}
//                                                 onChange={(e) => handleFilterChange(e, 'custCode')}
//                                                 placeholder="Filter..."
//                                                 className="block w-full px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                                             />
//                                         </th>
//                                         <th className="px-3 py-1">
//                                             <input
//                                                 type="text"
//                                                 value={filters.custName}
//                                                 onChange={(e) => handleFilterChange(e, 'custName')}
//                                                 placeholder="Filter..."
//                                                 className="block w-full px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                                             />
//                                         </th>
//                                         <th className="px-3 py-1">
//                                             <input
//                                                 type="text"
//                                                 value={filters.source}
//                                                 onChange={(e) => handleFilterChange(e, 'source')}
//                                                 placeholder="Filter..."
//                                                 className="block w-full px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                                             />
//                                         </th>
//                                         <th className="px-3 py-1">
//                                             <input
//                                                 type="text"
//                                                 value={filters.custTin}
//                                                 onChange={(e) => handleFilterChange(e, 'custTin')}
//                                                 placeholder="Filter..."
//                                                 className="block w-full px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                                             />
//                                         </th>
//                                         <th className="px-3 py-1">
//                                             <input
//                                                 type="text"
//                                                 value={filters.atcCode}
//                                                 onChange={(e) => handleFilterChange(e, 'atcCode')}
//                                                 placeholder="Filter..."
//                                                 className="block w-full px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                                             />
//                                         </th>
//                                         <th className="px-3 py-1">
//                                             <input
//                                                 type="text"
//                                                 value={filters.vatCode}
//                                                 onChange={(e) => handleFilterChange(e, 'vatCode')}
//                                                 placeholder="Filter..."
//                                                 className="block w-full px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                                             />
//                                         </th>
//                                         <th className="px-3 py-1">
//                                             <input
//                                                 type="text"
//                                                 value={filters.addr}
//                                                 onChange={(e) => handleFilterChange(e, 'addr')}
//                                                 placeholder="Filter..."
//                                                 className="block w-full px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                                             />
//                                         </th>
//                                         <th className="px-3 py-1"></th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="bg-white divide-y divide-gray-200">
//                                     {paginatedData.length > 0 ? (
//                                         paginatedData.map((cust, index) => (
//                                             <tr key={index}
//                                                 className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer text-xs"
//                                                 onClick={() => handleApply(cust)} // Allow clicking row to apply
//                                             >
//                                                 <td className="px-4 py-1 whitespace-nowrap">{cust.custCode}</td>
//                                                 <td className="px-4 py-1 whitespace-nowrap">{cust.custName}</td>
//                                                 <td className="px-4 py-1 whitespace-nowrap">{cust.source}</td>
//                                                 <td className="px-4 py-1 whitespace-nowrap">{cust.custTin}</td>
//                                                 <td className="px-4 py-1 whitespace-nowrap">{cust.atcCode}</td>
//                                                 <td className="px-4 py-1 whitespace-nowrap">{cust.vatCode}</td>
//                                                 <td className="px-4 py-1 whitespace-normal">{cust.addr}</td>
//                                                 <td className="px-4 py-1 whitespace-nowrap">
//                                                     <button
//                                                         onClick={(e) => { e.stopPropagation(); handleApply(cust); }} // Stop propagation to prevent row click
//                                                         className="px-6 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-150"
//                                                     >
//                                                         Apply
//                                                     </button>
//                                                 </td>
//                                             </tr>
//                                         ))
//                                     ) : (
//                                         <tr>
//                                             <td colSpan="8" className="px-4 py-6 text-center text-gray-500 text-lg">
//                                                 No matching customers found.
//                                             </td>
//                                         </tr>
//                                     )}
//                                 </tbody>
//                             </table>
//                         </div>
//                     )}
//                 </div>

//                 <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-600">
//                     <button
//                         onClick={handlePrevPage}
//                         disabled={currentPage === 1}
//                         className="px-4 py-2 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
//                     >
//                         Previous
//                     </button>
//                     <div className="font-semibold">
//                         Showing {startItem}-{endItem} of {totalItems} entries
//                     </div>
//                     <button
//                         onClick={handleNextPage}
//                         disabled={filtered.length <= currentPage * itemsPerPage}
//                         className="px-4 py-2 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
//                     >
//                         Next
//                     </button>
//                 </div>
//             </div>

//             {/* Tailwind CSS Animations (add to your CSS file or a style block if not globally available) */}
//             <style jsx="true">{`
//                 @keyframes fade-in {
//                     from { opacity: 0; }
//                     to { opacity: 1; }
//                 }
//                 @keyframes scale-in {
//                     from { transform: scale(0.95); opacity: 0; }
//                     to { transform: scale(1); opacity: 1; }
//                 }
//                 .animate-fade-in {
//                     animation: fade-in 0.2s ease-out forwards;
//                 }
//                 .animate-scale-in {
//                     animation: scale-in 0.3s ease-out forwards;
//                 }
//                 /* Custom Scrollbar */
//                 .custom-scrollbar::-webkit-scrollbar {
//                     width: 8px;
//                     height: 8px;
//                 }
//                 .custom-scrollbar::-webkit-scrollbar-track {
//                     background: #f1f1f1;
//                     border-radius: 10px;
//                 }
//                 .custom-scrollbar::-webkit-scrollbar-thumb {
//                     background: #888;
//                     border-radius: 10px;
//                 }
//                 .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//                     background: #555;
//                 }
//             `}</style>
//         </div>
//     );
// };

// export default CustomerMastLookupModal;



import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, faSort, faSortUp, faSortDown, 
    faSpinner, faSearch, faFilter, faUser,
} from '@fortawesome/free-solid-svg-icons';
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";

const CustomerMastLookupModal = ({ isOpen, onClose, customParam }) => {
    const columnConfig = [
        { key: 'custCode', label: 'Customer Code', width: '120px' },
        { key: 'custName', label: 'Customer Name', width: '350px' },
        { key: 'source',   label: 'Source',        width: '80px'  },
        { key: 'custTin',  label: 'TIN',           width: '200px' },
        { key: 'atcCode',  label: 'ATC',           width: '60px'  },
        { key: 'vatCode',  label: 'VAT',           width: '60px'  },
        { key: 'addr',     label: 'Address',       width: 'auto'  }
    ];

    const [customers, setCustomers] = useState([]);
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
            const { data: result } = await apiClient.get("/lookupCustomer", {
                params: { json_data: JSON.stringify(payload) }
            });

            const custData = Array.isArray(result?.data) && result.data[0]?.result
                ? JSON.parse(result.data[0].result)
                : [];

            setCustomers(custData);
            setFiltered(custData);
            setCurrentPage(1); 
        } catch (err) {
            console.error("Failed to fetch customers:", err);
            setCustomers([]);
            setFiltered([]);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, customParam, searchMode]);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        } else {
            // Reset state on close
            setSearchTerm('');
            setFilters(columnConfig.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {}));
        }
    }, [isOpen]);

    useEffect(() => {
        let currentFiltered = [...customers];
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
    }, [filters, customers, sortConfig]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

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

                <h2 className="text-sm font-semibold text-blue-800 p-3 border-b border-gray-100">Select Customer</h2>

                <div className="p-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-center">
                    <div className="relative flex-grow max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                            <FontAwesomeIcon icon={faUser} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search Customer Name..."
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
                            <input type="radio" name="sm_cust" value="start" checked={searchMode === 'start'} onChange={(e) => setSearchMode(e.target.value)} className="accent-blue-600" />
                            <span className="text-xs text-gray-700">Starts with</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name="sm_cust" value="part" checked={searchMode === 'part'} onChange={(e) => setSearchMode(e.target.value)} className="accent-blue-600" />
                            <span className="text-xs text-gray-700">Contains</span>
                        </label>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => fetchData()} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors">
                            <FontAwesomeIcon icon={faFilter} size="sm" /> Load Records
                        </button>
                    </div>
                </div>

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
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((cust, index) => (
                                            <tr key={index} className="hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => onClose(cust)}>
                                                {columnConfig.map(col => (
                                                    <td key={col.key} className="px-4 py-2 break-words whitespace-normal align-top" style={{ width: col.width }}>
                                                        {cust[col.key]}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-2 align-top">
                                                    <button className="px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-700 text-[10px]">Apply</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={columnConfig.length + 1} className="px-4 py-10 text-center text-gray-500 text-sm">
                                                No records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-3 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-600">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-blue-100 rounded disabled:opacity-50 hover:bg-blue-200 transition-colors">Previous</button>
                    <div>Showing {startItem}-{endItem} of {totalItems}</div>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={filtered.length <= currentPage * itemsPerPage} className="px-3 py-1 bg-blue-100 rounded disabled:opacity-50 hover:bg-blue-200 transition-colors">Next</button>
                </div>
            </div>
            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default CustomerMastLookupModal;