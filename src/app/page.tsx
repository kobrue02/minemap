"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic'; // ← This is the correct import
import { Plus, Search, Filter, MapPin, X, Edit, Trash2, Pickaxe, ChevronDown } from 'lucide-react';

// Dynamic import of your MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-slate-100 via-blue-50 to-green-50 rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  )
});

// Types
interface MiningDeposit {
  id: number;
  companyName: string;
  projectName: string;
  resource: string;
  latitude: number;
  longitude: number;
  country: string;
  status: string;
  description: string;
}

interface FormData {
  companyName: string;
  projectName: string;
  resource: string;
  latitude: string;
  longitude: string;
  country: string;
  status: string;
  description: string;
}

// Sample mining data
const initialMiningData = [
  {
    id: 1,
    companyName: "Barrick Gold Corporation",
    projectName: "Cortez Gold Mine",
    resource: "Gold",
    latitude: 40.2731,
    longitude: -116.6374,
    country: "USA",
    status: "Active",
    description: "Large-scale gold mining operation in Nevada"
  },
  {
    id: 2,
    companyName: "BHP",
    projectName: "Escondida",
    resource: "Copper",
    latitude: -24.2370,
    longitude: -69.0800,
    country: "Chile",
    status: "Active",
    description: "World's largest copper mine"
  },
  {
    id: 3,
    companyName: "Newmont Corporation",
    projectName: "Boddington Gold Mine",
    resource: "Gold",
    latitude: -32.7500,
    longitude: 116.4000,
    country: "Australia",
    status: "Active",
    description: "Major gold and copper mine in Western Australia"
  },
  {
    id: 4,
    companyName: "Pan American Silver",
    projectName: "Dolores Mine",
    resource: "Silver",
    latitude: 26.0833,
    longitude: -108.5000,
    country: "Mexico",
    status: "Active",
    description: "Silver and gold mining operation"
  },
  {
    id: 5,
    companyName: "Vale S.A.",
    projectName: "Carajás Mine",
    resource: "Iron Ore",
    latitude: -6.0000,
    longitude: -50.0000,
    country: "Brazil",
    status: "Active",
    description: "One of the world's largest iron ore mines"
  },
  {
    id: 6,
    companyName: "Fresnillo plc",
    projectName: "Fresnillo Mine",
    resource: "Silver",
    latitude: 23.1667,
    longitude: -102.8833,
    country: "Mexico",
    status: "Active",
    description: "World's largest silver mine"
  }
];

// Resource colors for map markers
const resourceColors: Record<string, string> = {
  'Gold': '#FFD700',
  'Silver': '#C0C0C0',
  'Copper': '#B87333',
  'Iron Ore': '#8B4513',
  'Platinum': '#E5E4E2',
  'Zinc': '#7F7F7F',
  'Lead': '#2F4F4F',
  'Nickel': '#D3D3D3'
};

const MiningResourcesMap = () => {
  const [miningData, setMiningData] = useState<MiningDeposit[]>(initialMiningData);
  const [filteredData, setFilteredData] = useState<MiningDeposit[]>(initialMiningData);
  const [selectedDeposit, setSelectedDeposit] = useState<MiningDeposit | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<MiningDeposit | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    projectName: '',
    resource: '',
    latitude: '',
    longitude: '',
    country: '',
    status: 'Active',
    description: ''
  });

  // Filter data
  useEffect(() => {
    let filtered = miningData;

    if (searchTerm) {
      filtered = filtered.filter(deposit =>
        deposit.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (resourceFilter !== 'all') {
      filtered = filtered.filter(deposit => deposit.resource === resourceFilter);
    }

    setFilteredData(filtered);
  }, [miningData, searchTerm, resourceFilter]);

  const handleDepositSelect = (deposit: MiningDeposit) => {
    setSelectedDeposit(deposit);
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      projectName: '',
      resource: '',
      latitude: '',
      longitude: '',
      country: '',
      status: 'Active',
      description: ''
    });
  };

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDeposit: MiningDeposit = {
      id: Math.max(...miningData.map(d => d.id)) + 1,
      companyName: formData.companyName,
      projectName: formData.projectName,
      resource: formData.resource,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      country: formData.country,
      status: formData.status,
      description: formData.description
    };
    
    setMiningData([...miningData, newDeposit]);
    resetForm();
    setShowAddForm(false);
  };

  const handleEditDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeposit) return;
    
    const updatedData = miningData.map(deposit =>
      deposit.id === editingDeposit.id 
        ? {
            ...deposit,
            companyName: formData.companyName,
            projectName: formData.projectName,
            resource: formData.resource,
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            country: formData.country,
            status: formData.status,
            description: formData.description
          }
        : deposit
    );
    
    setMiningData(updatedData);
    setEditingDeposit(null);
    setSelectedDeposit(null);
    resetForm();
  };

  const openEditDialog = (deposit: MiningDeposit) => {
    setEditingDeposit(deposit);
    setFormData({
      companyName: deposit.companyName,
      projectName: deposit.projectName,
      resource: deposit.resource,
      latitude: deposit.latitude.toString(),
      longitude: deposit.longitude.toString(),
      country: deposit.country,
      status: deposit.status,
      description: deposit.description
    });
  };

  const handleDeleteDeposit = (depositId: number) => {
    setMiningData(miningData.filter(deposit => deposit.id !== depositId));
    if (selectedDeposit?.id === depositId) {
      setSelectedDeposit(null);
    }
  };

  const uniqueResources = [...new Set(miningData.map(d => d.resource))];

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between relative z-30 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center">
            <Pickaxe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Mining Resources</h1>
            <p className="text-sm text-gray-500">{filteredData.length} deposits worldwide</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search deposits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Add Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Deposit</span>
          </button>
        </div>
      </div>

      {/* Filters Dropdown */}
      {showFilters && (
        <div className="absolute top-20 right-6 w-64 bg-white rounded-lg border border-gray-200 shadow-lg z-40 p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resource Type</label>
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Resources</option>
                {uniqueResources.map(resource => (
                  <option key={resource} value={resource}>{resource}</option>
                ))}
              </select>
            </div>
            
            {/* Legend */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Legend</label>
              <div className="space-y-2">
                {uniqueResources.map(resource => (
                  <div key={resource} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: resourceColors[resource] }}
                    />
                    <span className="text-sm text-gray-700">{resource}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Map Area */}
        <div className="h-full w-full">
          <MapComponent 
            deposits={filteredData}
            selectedDeposit={selectedDeposit}
            onDepositSelect={handleDepositSelect}
          />
        </div>

        {/* Selected Deposit Panel */}
        {selectedDeposit && (
          <div className="absolute top-4 left-4 w-80 bg-white rounded-lg border border-gray-200 shadow-lg z-20">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Deposit Details</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditDialog(selectedDeposit)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteDeposit(selectedDeposit.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
                <button
                  onClick={() => setSelectedDeposit(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-semibold text-gray-900">{selectedDeposit.projectName}</h4>
                <p className="text-sm text-gray-600">{selectedDeposit.companyName}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: resourceColors[selectedDeposit.resource] }}
                />
                <span className="text-sm font-medium">{selectedDeposit.resource}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedDeposit.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedDeposit.status}
                </span>
              </div>
              
              <div className="text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{selectedDeposit.country}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedDeposit.latitude.toFixed(4)}, {selectedDeposit.longitude.toFixed(4)}
                </p>
              </div>
              
              {selectedDeposit.description && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedDeposit.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingDeposit) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDeposit ? 'Edit Deposit' : 'Add New Deposit'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingDeposit(null);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name*</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name*</label>
                  <input
                    type="text"
                    required
                    value={formData.projectName}
                    onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource*</label>
                  <select
                    required
                    value={formData.resource}
                    onChange={(e) => setFormData({...formData, resource: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select resource</option>
                    {Object.keys(resourceColors).map(resource => (
                      <option key={resource} value={resource}>{resource}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Exploration">Exploration</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude*</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude*</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country*</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingDeposit(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={editingDeposit ? handleEditDeposit : handleAddDeposit}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {editingDeposit ? 'Update Deposit' : 'Add Deposit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiningResourcesMap;