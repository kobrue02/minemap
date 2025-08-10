"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Search, Filter, MapPin, Trash2, Pickaxe } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Dynamic import for Leaflet map (to avoid SSR issues)
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center">
      <div className="text-white text-lg">Loading map...</div>
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<MiningDeposit | null>(null);

  // Form state for new/edit deposit
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

  // Load deposits from API on component mount
  useEffect(() => {
    const fetchDeposits = async () => {
      try {
        const response = await fetch('/api/deposits');
        if (response.ok) {
          const data = await response.json();
          setMiningData(data);
        } else {
          console.error('Failed to fetch deposits');
        }
      } catch (error) {
        console.error('Error fetching deposits:', error);
      }
    };

    fetchDeposits();
  }, []);

  // Filter data based on search and resource filter
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

  // Handle deposit selection from map
  const handleDepositSelect = (deposit: MiningDeposit) => {
    setSelectedDeposit(deposit);
  };

  // Handle form submission for new deposit
  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: formData.companyName,
          project_name: formData.projectName,
          resource: formData.resource,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          country: formData.country,
          status: formData.status,
          description: formData.description
        }),
      });

      if (response.ok) {
        const newDeposit = await response.json();
        setMiningData([...miningData, newDeposit]);
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
        setIsAddDialogOpen(false);
      } else {
        console.error('Failed to add deposit');
      }
    } catch (error) {
      console.error('Error adding deposit:', error);
    }
  };

  // Handle form submission for editing deposit
  const handleEditDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeposit) return;
    
    try {
      const response = await fetch(`/api/deposits/${editingDeposit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          projectName: formData.projectName,
          resource: formData.resource,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          country: formData.country,
          status: formData.status,
          description: formData.description
        }),
      });

      if (response.ok) {
        const updatedDeposit = await response.json();
        const updatedData = miningData.map(deposit =>
          deposit.id === editingDeposit.id ? updatedDeposit : deposit
        );
        setMiningData(updatedData);
        setIsEditDialogOpen(false);
        setEditingDeposit(null);
        setSelectedDeposit(null);
      } else {
        console.error('Failed to update deposit');
      }
    } catch (error) {
      console.error('Error updating deposit:', error);
    }
  };

  // Open edit dialog
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
    setIsEditDialogOpen(true);
  };

  // Handle delete deposit
  const handleDeleteDeposit = async (depositId: number) => {
    try {
      const response = await fetch(`/api/deposits/${depositId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMiningData(miningData.filter(deposit => deposit.id !== depositId));
        if (selectedDeposit?.id === depositId) {
          setSelectedDeposit(null);
        }
      } else {
        console.error('Failed to delete deposit');
      }
    } catch (error) {
      console.error('Error deleting deposit:', error);
    }
  };

  const uniqueResources = [...new Set(miningData.map(d => d.resource))];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-black rounded-lg">
                <Pickaxe className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">
                  Global Mining Resources
                </h1>
                <p className="text-sm text-gray-600 mt-1">Interactive map of worldwide mineral deposits</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
                <span className="text-black font-medium">{filteredData.length} Deposits</span>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-black hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deposit
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters and Search */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center text-black">
                  <Filter className="h-4 w-4 mr-2 text-gray-600" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search" className="text-gray-700 font-medium">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Company, project, or country..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="resource-filter" className="text-gray-700 font-medium">Resource Type</Label>
                  <Select value={resourceFilter} onValueChange={setResourceFilter}>
                    <SelectTrigger className="bg-white border-gray-300 text-black focus:bg-white focus:border-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="all" className="text-black hover:bg-gray-50">All Resources</SelectItem>
                      {uniqueResources.map(resource => (
                        <SelectItem key={resource} value={resource} className="text-black hover:bg-gray-50">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: resourceColors[resource] || '#666' }}
                            />
                            {resource}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Selected Deposit Details */}
            {selectedDeposit && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-black">Deposit Details</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(selectedDeposit)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDeposit(selectedDeposit.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Company</Label>
                    <p className="text-sm text-black">{selectedDeposit.companyName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Project</Label>
                    <p className="text-sm font-semibold text-black">{selectedDeposit.projectName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: resourceColors[selectedDeposit.resource] || '#666' }}
                    />
                    <span className="text-sm text-black">{selectedDeposit.resource}</span>
                    <Badge variant={selectedDeposit.status === 'Active' ? 'default' : 'secondary'} className="text-xs bg-gray-100 text-gray-800 border border-gray-200">
                      {selectedDeposit.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Location</Label>
                    <p className="text-sm text-black">{selectedDeposit.country}</p>
                    <p className="text-xs text-gray-500">
                      {selectedDeposit.latitude.toFixed(4)}, {selectedDeposit.longitude.toFixed(4)}
                    </p>
                  </div>
                  {selectedDeposit.description && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Description</Label>
                      <p className="text-sm text-black">{selectedDeposit.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Map Area */}
          <div className="lg:col-span-3">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-black">
                  <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                  World Mining Deposits Map
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Click on markers to view deposit details • Scroll to zoom • Drag to pan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapComponent 
                  deposits={filteredData}
                  selectedDeposit={selectedDeposit}
                  onDepositSelect={handleDepositSelect}
                />
                
                {/* Legend */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <Label className="text-sm font-medium text-black mb-3 block">Resource Types</Label>
                  <div className="flex flex-wrap gap-4">
                    {uniqueResources.map(resource => (
                      <div key={resource} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ 
                            backgroundColor: resourceColors[resource] || '#666'
                          }}
                        />
                        <span className="text-xs text-gray-700 font-medium">{resource}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Deposit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-black">Add New Mining Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company" className="text-gray-700 font-medium">Company Name*</Label>
              <Input
                id="company"
                required
                value={formData.companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, companyName: e.target.value})}
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
              />
            </div>
            <div>
              <Label htmlFor="project" className="text-gray-700 font-medium">Project Name*</Label>
              <Input
                id="project"
                required
                value={formData.projectName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, projectName: e.target.value})}
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="resource" className="text-gray-700 font-medium">Resource*</Label>
                <Select value={formData.resource} onValueChange={(value: string) => setFormData({...formData, resource: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-black focus:bg-white focus:border-black">
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {Object.keys(resourceColors).map(resource => (
                      <SelectItem key={resource} value={resource} className="text-black hover:bg-gray-50">{resource}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status" className="text-gray-700 font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value: string) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-black focus:bg-white focus:border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="Active" className="text-black hover:bg-gray-50">Active</SelectItem>
                    <SelectItem value="Inactive" className="text-black hover:bg-gray-50">Inactive</SelectItem>
                    <SelectItem value="Exploration" className="text-black hover:bg-gray-50">Exploration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="latitude" className="text-gray-700 font-medium">Latitude*</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  required
                  placeholder="e.g., 40.2731"
                  value={formData.latitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, latitude: e.target.value})}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-gray-700 font-medium">Longitude*</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  required
                  placeholder="e.g., -116.6374"
                  value={formData.longitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, longitude: e.target.value})}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country" className="text-gray-700 font-medium">Country*</Label>
              <Input
                id="country"
                required
                value={formData.country}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, country: e.target.value})}
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-700 font-medium">Description</Label>
              <Textarea
                id="description"
                rows={2}
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button type="button" className="bg-black hover:bg-gray-800 text-white font-medium" onClick={handleAddDeposit}>
                Add Deposit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Deposit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-black">Edit Mining Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-company" className="text-gray-700 font-medium">Company Name*</Label>
              <Input
                id="edit-company"
                required
                value={formData.companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, companyName: e.target.value})}
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
              />
            </div>
            <div>
              <Label htmlFor="edit-project" className="text-gray-700 font-medium">Project Name*</Label>
              <Input
                id="edit-project"
                required
                value={formData.projectName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, projectName: e.target.value})}
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-resource" className="text-gray-700 font-medium">Resource*</Label>
                <Select value={formData.resource} onValueChange={(value: string) => setFormData({...formData, resource: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-black focus:bg-white focus:border-black">
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {Object.keys(resourceColors).map(resource => (
                      <SelectItem key={resource} value={resource} className="text-black hover:bg-gray-50">{resource}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status" className="text-gray-700 font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value: string) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-black focus:bg-white focus:border-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="Active" className="text-black hover:bg-gray-50">Active</SelectItem>
                    <SelectItem value="Inactive" className="text-black hover:bg-gray-50">Inactive</SelectItem>
                    <SelectItem value="Exploration" className="text-black hover:bg-gray-50">Exploration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-latitude" className="text-gray-700 font-medium">Latitude*</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="any"
                  required
                  value={formData.latitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, latitude: e.target.value})}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude" className="text-gray-700 font-medium">Longitude*</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="any"
                  required
                  value={formData.longitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, longitude: e.target.value})}
                  className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-country" className="text-gray-700 font-medium">Country*</Label>
              <Input
                id="edit-country"
                required
                value={formData.country}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, country: e.target.value})}
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-gray-700 font-medium">Description</Label>
              <Textarea
                id="edit-description"
                rows={2}
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
                className="bg-white border-gray-300 text-black placeholder:text-gray-400 focus:bg-white focus:border-black"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
              <Button type="submit" className="bg-black hover:bg-gray-800 text-white font-medium" onClick={handleEditDeposit}>
                Update Deposit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
  };
  
export default MiningResourcesMap;