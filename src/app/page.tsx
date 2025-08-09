"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit3, Search, Filter, MapPin, Building2, Pickaxe } from 'lucide-react';
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
  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDeposit = {
      id: Math.max(...miningData.map(d => d.id)) + 1,
      ...formData,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude)
    };
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
  };

  // Handle form submission for editing deposit
  const handleEditDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeposit) return;
    const updatedData = miningData.map(deposit =>
      deposit.id === editingDeposit.id
        ? {
            ...formData,
            id: editingDeposit.id,
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude)
          }
        : deposit
    );
    setMiningData(updatedData);
    setIsEditDialogOpen(false);
    setEditingDeposit(null);
    setSelectedDeposit(null);
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

  const uniqueResources = [...new Set(miningData.map(d => d.resource))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Pickaxe className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Global Mining Resources</h1>
                <p className="text-sm text-gray-600">Interactive map of worldwide mineral deposits</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                {filteredData.length} Deposits
              </Badge>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deposit
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters and Search */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Company, project, or country..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="resource-filter">Resource Type</Label>
                  <Select value={resourceFilter} onValueChange={setResourceFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Resources</SelectItem>
                      {uniqueResources.map(resource => (
                        <SelectItem key={resource} value={resource}>
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
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Deposit Details</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(selectedDeposit)}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Company</Label>
                    <p className="text-sm">{selectedDeposit.companyName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Project</Label>
                    <p className="text-sm font-semibold">{selectedDeposit.projectName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: resourceColors[selectedDeposit.resource] || '#666' }}
                    />
                    <span className="text-sm">{selectedDeposit.resource}</span>
                    <Badge variant={selectedDeposit.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                      {selectedDeposit.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Location</Label>
                    <p className="text-sm">{selectedDeposit.country}</p>
                    <p className="text-xs text-gray-500">
                      {selectedDeposit.latitude.toFixed(4)}, {selectedDeposit.longitude.toFixed(4)}
                    </p>
                  </div>
                  {selectedDeposit.description && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-sm">{selectedDeposit.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Map Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  World Mining Deposits Map
                </CardTitle>
                <CardDescription>
                  Click on markers to view deposit details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef}
                  className="relative w-full h-96 bg-gradient-to-b from-blue-200 to-blue-300 rounded-lg overflow-hidden border"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%),
                      linear-gradient(to bottom, #87CEEB 0%, #4682B4 100%)
                    `
                  }}
                >
                  {/* Continent shapes (simplified) */}
                  <svg className="absolute inset-0 w-full h-full">
                    {/* North America */}
                    <path
                      d="M 100 80 Q 150 60 200 80 Q 250 70 280 90 Q 300 120 280 150 Q 250 180 200 170 Q 150 160 120 180 Q 80 150 100 80"
                      fill="rgba(34, 197, 94, 0.6)"
                      stroke="rgba(34, 197, 94, 0.8)"
                      strokeWidth="1"
                    />
                    
                    {/* South America */}
                    <path
                      d="M 180 200 Q 220 190 240 220 Q 250 260 240 300 Q 220 340 200 360 Q 180 340 170 300 Q 160 260 180 200"
                      fill="rgba(34, 197, 94, 0.6)"
                      stroke="rgba(34, 197, 94, 0.8)"
                      strokeWidth="1"
                    />
                    
                    {/* Africa */}
                    <path
                      d="M 380 140 Q 420 130 450 160 Q 460 200 450 240 Q 440 280 420 300 Q 380 310 360 280 Q 350 240 360 200 Q 370 160 380 140"
                      fill="rgba(34, 197, 94, 0.6)"
                      stroke="rgba(34, 197, 94, 0.8)"
                      strokeWidth="1"
                    />
                    
                    {/* Europe */}
                    <path
                      d="M 380 60 Q 420 50 450 70 Q 460 90 450 110 Q 420 120 380 110 Q 360 90 380 60"
                      fill="rgba(34, 197, 94, 0.6)"
                      stroke="rgba(34, 197, 94, 0.8)"
                      strokeWidth="1"
                    />
                    
                    {/* Asia */}
                    <path
                      d="M 480 60 Q 580 50 650 80 Q 700 100 720 140 Q 710 180 680 200 Q 620 210 580 190 Q 520 180 480 160 Q 460 120 480 60"
                      fill="rgba(34, 197, 94, 0.6)"
                      stroke="rgba(34, 197, 94, 0.8)"
                      strokeWidth="1"
                    />
                    
                    {/* Australia */}
                    <path
                      d="M 600 280 Q 650 270 680 290 Q 690 310 680 330 Q 650 340 600 330 Q 580 310 600 280"
                      fill="rgba(34, 197, 94, 0.6)"
                      stroke="rgba(34, 197, 94, 0.8)"
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
                          className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                            isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                          }`}
                          style={{
                            backgroundColor: resourceColors[deposit.resource] || '#666'
                          }}
                        />
                        {isSelected && (
                          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap z-20">
                            {deposit.projectName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Resource Types</Label>
                  <div className="flex flex-wrap gap-3">
                    {uniqueResources.map(resource => (
                      <div key={resource} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: resourceColors[resource] || '#666' }}
                        />
                        <span className="text-xs text-gray-600">{resource}</span>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Mining Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="company">Company Name*</Label>
              <Input
                id="company"
                required
                value={formData.companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, companyName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="project">Project Name*</Label>
              <Input
                id="project"
                required
                value={formData.projectName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, projectName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="resource">Resource*</Label>
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
                <Label htmlFor="status">Status</Label>
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
                <Label htmlFor="latitude">Latitude*</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  required
                  placeholder="e.g., 40.2731"
                  value={formData.latitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, latitude: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude*</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  required
                  placeholder="e.g., -116.6374"
                  value={formData.longitude}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, longitude: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Country*</Label>
              <Input
                id="country"
                required
                value={formData.country}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, country: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={2}
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" className="bg-blue-600 hover:bg-blue-700" onClick={handleAddDeposit}>
                Add Deposit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Deposit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Mining Deposit</DialogTitle>
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
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" onClick={handleEditDeposit}>
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