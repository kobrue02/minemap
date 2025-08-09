"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit3, Search, Filter, MapPin, Trash2, Pickaxe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 400 });

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

  // Update map dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        setMapDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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

  // Convert lat/lng to map coordinates
  const coordsToMapPosition = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * mapDimensions.width;
    const y = ((90 - lat) / 180) * mapDimensions.height;
    return { x, y };
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Pickaxe className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Global Mining Resources
                </h1>
                <p className="text-sm text-gray-300 mt-1">Interactive map of worldwide mineral deposits</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <span className="text-white font-medium">{filteredData.length} Deposits</span>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
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
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center text-white">
                  <Filter className="h-4 w-4 mr-2 text-blue-400" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search" className="text-gray-300 font-medium">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Company, project, or country..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-blue-400"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="resource-filter" className="text-gray-300 font-medium">Resource Type</Label>
                  <Select value={resourceFilter} onValueChange={setResourceFilter}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="all" className="text-white hover:bg-slate-700">All Resources</SelectItem>
                      {uniqueResources.map(resource => (
                        <SelectItem key={resource} value={resource} className="text-white hover:bg-slate-700">
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
              <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">Deposit Details</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(selectedDeposit)}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDeposit(selectedDeposit.id)}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Company</Label>
                    <p className="text-sm text-white">{selectedDeposit.companyName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Project</Label>
                    <p className="text-sm font-semibold text-white">{selectedDeposit.projectName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: resourceColors[selectedDeposit.resource] || '#666' }}
                    />
                    <span className="text-sm text-white">{selectedDeposit.resource}</span>
                    <Badge variant={selectedDeposit.status === 'Active' ? 'default' : 'secondary'} className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                      {selectedDeposit.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Location</Label>
                    <p className="text-sm text-white">{selectedDeposit.country}</p>
                    <p className="text-xs text-gray-400">
                      {selectedDeposit.latitude.toFixed(4)}, {selectedDeposit.longitude.toFixed(4)}
                    </p>
                  </div>
                  {selectedDeposit.description && (
                    <div>
                      <Label className="text-sm font-medium text-gray-300">Description</Label>
                      <p className="text-sm text-white">{selectedDeposit.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Map Area */}
          <div className="lg:col-span-3">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-white">
                  <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                  World Mining Deposits Map
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Click on markers to view deposit details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef}
                  className="relative w-full h-96 rounded-xl overflow-hidden border border-white/20"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 50%),
                      linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #64748b 75%, #94a3b8 100%)
                    `
                  }}
                >
                  {/* Continent shapes (simplified) */}
                  <svg className="absolute inset-0 w-full h-full">
                    {/* North America */}
                    <path
                      d="M 100 80 Q 150 60 200 80 Q 250 70 280 90 Q 300 120 280 150 Q 250 180 200 170 Q 150 160 120 180 Q 80 150 100 80"
                      fill="rgba(59, 130, 246, 0.3)"
                      stroke="rgba(59, 130, 246, 0.6)"
                      strokeWidth="1"
                    />
                    
                    {/* South America */}
                    <path
                      d="M 180 200 Q 220 190 240 220 Q 250 260 240 300 Q 220 340 200 360 Q 180 340 170 300 Q 160 260 180 200"
                      fill="rgba(147, 51, 234, 0.3)"
                      stroke="rgba(147, 51, 234, 0.6)"
                      strokeWidth="1"
                    />
                    
                    {/* Africa */}
                    <path
                      d="M 380 140 Q 420 130 450 160 Q 460 200 450 240 Q 440 280 420 300 Q 380 310 360 280 Q 350 240 360 200 Q 370 160 380 140"
                      fill="rgba(34, 197, 94, 0.3)"
                      stroke="rgba(34, 197, 94, 0.6)"
                      strokeWidth="1"
                    />
                    
                    {/* Europe */}
                    <path
                      d="M 380 60 Q 420 50 450 70 Q 460 90 450 110 Q 420 120 380 110 Q 360 90 380 60"
                      fill="rgba(239, 68, 68, 0.3)"
                      stroke="rgba(239, 68, 68, 0.6)"
                      strokeWidth="1"
                    />
                    
                    {/* Asia */}
                    <path
                      d="M 480 60 Q 580 50 650 80 Q 700 100 720 140 Q 710 180 680 200 Q 620 210 580 190 Q 520 180 480 160 Q 460 120 480 60"
                      fill="rgba(245, 158, 11, 0.3)"
                      stroke="rgba(245, 158, 11, 0.6)"
                      strokeWidth="1"
                    />
                    
                    {/* Australia */}
                    <path
                      d="M 600 280 Q 650 270 680 290 Q 690 310 680 330 Q 650 340 600 330 Q 580 310 600 280"
                      fill="rgba(236, 72, 153, 0.3)"
                      stroke="rgba(236, 72, 153, 0.6)"
                      strokeWidth="1"
                    />
                  </svg>

                  {/* Deposit Markers */}
                  {filteredData.map((deposit) => {
                    const position = coordsToMapPosition(deposit.latitude, deposit.longitude);
                    const isSelected = selectedDeposit?.id === deposit.id;
                    
                    return (
                      <div
                        key={deposit.id}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110 ${
                          isSelected ? 'scale-125 z-10' : 'z-5'
                        }`}
                        style={{
                          left: `${position.x}px`,
                          top: `${position.y}px`,
                        }}
                        onClick={() => setSelectedDeposit(deposit)}
                        title={`${deposit.projectName} - ${deposit.companyName}`}
                      >
                        <div 
                          className={`w-5 h-5 rounded-full border-2 border-white shadow-xl transition-all duration-300 ${
                            isSelected ? 'ring-4 ring-blue-400 ring-offset-2 scale-125' : 'hover:scale-110'
                          }`}
                          style={{
                            backgroundColor: resourceColors[deposit.resource] || '#666',
                            boxShadow: `0 0 20px ${resourceColors[deposit.resource] || '#666'}40`
                          }}
                        />
                        {isSelected && (
                          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-2 rounded-lg shadow-2xl text-xs whitespace-nowrap z-20 text-white font-medium">
                            {deposit.projectName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="mt-6 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl">
                  <Label className="text-sm font-medium text-white mb-3 block">Resource Types</Label>
                  <div className="flex flex-wrap gap-4">
                    {uniqueResources.map(resource => (
                      <div key={resource} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-white shadow-lg"
                          style={{ 
                            backgroundColor: resourceColors[resource] || '#666',
                            boxShadow: `0 0 10px ${resourceColors[resource] || '#666'}60`
                          }}
                        />
                        <span className="text-xs text-gray-300 font-medium">{resource}</span>
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
        <DialogContent className="max-w-md bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Mining Deposit</DialogTitle>
          </DialogHeader>
                      <div className="space-y-4">
              <div>
                <Label htmlFor="company" className="text-gray-300 font-medium">Company Name*</Label>
                <Input
                  id="company"
                  required
                  value={formData.companyName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, companyName: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-blue-400"
                />
              </div>
                          <div>
                <Label htmlFor="project" className="text-gray-300 font-medium">Project Name*</Label>
                <Input
                  id="project"
                  required
                  value={formData.projectName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, projectName: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-blue-400"
                />
              </div>
                          <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="resource" className="text-gray-300 font-medium">Resource*</Label>
                  <Select value={formData.resource} onValueChange={(value: string) => setFormData({...formData, resource: value})}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-blue-400">
                      <SelectValue placeholder="Select resource" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      {Object.keys(resourceColors).map(resource => (
                        <SelectItem key={resource} value={resource} className="text-white hover:bg-slate-700">{resource}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status" className="text-gray-300 font-medium">Status</Label>
                  <Select value={formData.status} onValueChange={(value: string) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/20 focus:border-blue-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="Active" className="text-white hover:bg-slate-700">Active</SelectItem>
                      <SelectItem value="Inactive" className="text-white hover:bg-slate-700">Inactive</SelectItem>
                      <SelectItem value="Exploration" className="text-white hover:bg-slate-700">Exploration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
                          <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="latitude" className="text-gray-300 font-medium">Latitude*</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    required
                    placeholder="e.g., 40.2731"
                    value={formData.latitude}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, latitude: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-blue-400"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude" className="text-gray-300 font-medium">Longitude*</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    required
                    placeholder="e.g., -116.6374"
                    value={formData.longitude}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, longitude: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="country" className="text-gray-300 font-medium">Country*</Label>
                <Input
                  id="country"
                  required
                  value={formData.country}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, country: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-blue-400"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300 font-medium">Description</Label>
                <Textarea
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20 focus:border-blue-400"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-white/20 text-white hover:bg-white/10">
                  Cancel
                </Button>
                <Button type="button" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium" onClick={handleAddDeposit}>
                  Add Deposit
                </Button>
              </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Deposit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Mining Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-company">Company Name*</Label>
              <Input
                id="edit-company"
                required
                value={formData.companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, companyName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-project">Project Name*</Label>
              <Input
                id="edit-project"
                required
                value={formData.projectName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, projectName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-resource">Resource*</Label>
                <Select value={formData.resource} onValueChange={(value: string) => setFormData({...formData, resource: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(resourceColors).map(resource => (
                      <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value: string) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Exploration">Exploration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-latitude">Latitude*</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="any"
                  required
                  value={formData.latitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, latitude: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-longitude">Longitude*</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="any"
                  required
                  value={formData.longitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, longitude: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-country">Country*</Label>
              <Input
                id="edit-country"
                required
                value={formData.country}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, country: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={2}
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium" onClick={handleEditDeposit}>
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