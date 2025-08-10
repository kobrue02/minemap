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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Convert lat/lng to map coordinates with zoom and pan
  const coordsToMapPosition = (lat: number, lng: number) => {
    const baseX = ((lng + 180) / 360) * mapDimensions.width;
    const baseY = ((90 - lat) / 180) * mapDimensions.height;
    const x = (baseX - pan.x) * zoom + mapDimensions.width / 2;
    const y = (baseY - pan.y) * zoom + mapDimensions.height / 2;
    return { x, y };
  };

  // Handle zoom
  const handleZoom = (delta: number, centerX: number, centerY: number) => {
    const newZoom = Math.max(0.5, Math.min(5, zoom + delta * 0.1));
    const zoomRatio = newZoom / zoom;
    
    setPan(prev => ({
      x: prev.x - (centerX - mapDimensions.width / 2) * (1 - zoomRatio) / newZoom,
      y: prev.y - (centerY - mapDimensions.height / 2) * (1 - zoomRatio) / newZoom
    }));
    setZoom(newZoom);
  };

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    handleZoom(e.deltaY > 0 ? -1 : 1, centerX, centerY);
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
                  Click on markers to view deposit details • Scroll to zoom • Drag to pan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  ref={mapRef}
                  className="relative w-full h-96 rounded-xl overflow-hidden border border-white/20 cursor-grab active:cursor-grabbing map-container"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.2) 0%, transparent 50%),
                      linear-gradient(135deg, #1e293b 0%, #334155 25%, #475569 50%, #64748b 75%, #94a3b8 100%)
                    `
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                >
                  {/* Ocean background with animation */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 opacity-20 animate-pulse"></div>
                  
                  {/* Ocean waves effect */}
                  <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 1000 500">
                      {Array.from({ length: 20 }, (_, i) => (
                        <path
                          key={i}
                          d={`M 0 ${i * 25} Q 250 ${i * 25 + 5} 500 ${i * 25} Q 750 ${i * 25 - 5} 1000 ${i * 25}`}
                          stroke="rgba(255, 255, 255, 0.3)"
                          strokeWidth="1"
                          fill="none"
                          style={{
                            animation: `wave ${3 + i * 0.1}s ease-in-out infinite`
                          }}
                        />
                      ))}
                    </svg>
                  </div>
                  
                  {/* Detailed World Map */}
                  <svg 
                    className="absolute inset-0 w-full h-full" 
                    viewBox="0 0 1000 500"
                    style={{
                      transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                  >
                    {/* North America - Detailed */}
                    <g className="continent north-america">
                      {/* Alaska */}
                      <path d="M 50 50 L 80 45 L 90 50 L 85 60 L 70 65 L 55 60 Z" fill="rgba(59, 130, 246, 0.4)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="0.5"/>
                      {/* Canada */}
                      <path d="M 80 45 L 120 40 L 140 50 L 150 70 L 140 90 L 120 100 L 100 95 L 85 85 L 70 75 L 55 60 L 70 65 Z" fill="rgba(59, 130, 246, 0.4)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="0.5"/>
                      {/* USA */}
                      <path d="M 120 40 L 180 35 L 200 45 L 210 65 L 200 85 L 180 95 L 160 90 L 140 80 L 120 70 L 100 95 L 120 100 Z" fill="rgba(59, 130, 246, 0.4)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="0.5"/>
                      {/* Mexico */}
                      <path d="M 180 35 L 220 30 L 240 40 L 250 60 L 240 80 L 220 90 L 200 85 L 180 95 Z" fill="rgba(147, 51, 234, 0.4)" stroke="rgba(147, 51, 234, 0.8)" strokeWidth="0.5"/>
                      {/* Central America */}
                      <path d="M 220 30 L 240 25 L 250 35 L 260 55 L 250 75 L 240 80 L 220 90 Z" fill="rgba(34, 197, 94, 0.4)" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="0.5"/>
                    </g>

                    {/* South America - Detailed */}
                    <g className="continent south-america">
                      {/* Brazil */}
                      <path d="M 240 25 L 280 20 L 320 25 L 340 45 L 350 75 L 340 105 L 320 125 L 280 130 L 260 120 L 250 100 L 240 80 L 250 75 Z" fill="rgba(34, 197, 94, 0.4)" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="0.5"/>
                      {/* Argentina */}
                      <path d="M 280 20 L 300 15 L 320 20 L 330 40 L 340 60 L 330 80 L 320 100 L 300 105 L 280 100 L 270 80 L 280 60 L 290 40 Z" fill="rgba(239, 68, 68, 0.4)" stroke="rgba(239, 68, 68, 0.8)" strokeWidth="0.5"/>
                      {/* Chile */}
                      <path d="M 300 15 L 320 10 L 330 20 L 340 40 L 330 60 L 320 80 L 300 85 L 290 65 L 300 45 Z" fill="rgba(245, 158, 11, 0.4)" stroke="rgba(245, 158, 11, 0.8)" strokeWidth="0.5"/>
                    </g>

                    {/* Europe - Detailed */}
                    <g className="continent europe">
                      {/* Scandinavia */}
                      <path d="M 450 30 L 470 25 L 480 35 L 475 45 L 465 50 L 455 45 Z" fill="rgba(59, 130, 246, 0.4)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="0.5"/>
                      {/* UK */}
                      <path d="M 440 40 L 450 35 L 455 40 L 450 45 L 445 45 Z" fill="rgba(239, 68, 68, 0.4)" stroke="rgba(239, 68, 68, 0.8)" strokeWidth="0.5"/>
                      {/* France */}
                      <path d="M 445 45 L 455 40 L 465 45 L 460 55 L 450 55 Z" fill="rgba(147, 51, 234, 0.4)" stroke="rgba(147, 51, 234, 0.8)" strokeWidth="0.5"/>
                      {/* Germany */}
                      <path d="M 455 40 L 475 35 L 485 45 L 480 55 L 465 55 L 455 50 Z" fill="rgba(34, 197, 94, 0.4)" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="0.5"/>
                      {/* Italy */}
                      <path d="M 465 55 L 475 50 L 480 60 L 475 70 L 465 65 Z" fill="rgba(245, 158, 11, 0.4)" stroke="rgba(245, 158, 11, 0.8)" strokeWidth="0.5"/>
                      {/* Spain */}
                      <path d="M 440 55 L 450 50 L 455 60 L 450 70 L 445 65 Z" fill="rgba(236, 72, 153, 0.4)" stroke="rgba(236, 72, 153, 0.8)" strokeWidth="0.5"/>
                    </g>

                    {/* Africa - Detailed */}
                    <g className="continent africa">
                      {/* North Africa */}
                      <path d="M 450 50 L 500 45 L 520 55 L 530 75 L 520 95 L 500 105 L 480 100 L 465 90 L 455 75 L 450 60 Z" fill="rgba(34, 197, 94, 0.4)" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="0.5"/>
                      {/* West Africa */}
                      <path d="M 480 100 L 520 95 L 540 105 L 550 125 L 540 145 L 520 155 L 500 150 L 485 140 L 480 125 Z" fill="rgba(59, 130, 246, 0.4)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="0.5"/>
                      {/* Central Africa */}
                      <path d="M 520 95 L 560 90 L 580 100 L 590 120 L 580 140 L 560 150 L 540 145 L 520 155 Z" fill="rgba(147, 51, 234, 0.4)" stroke="rgba(147, 51, 234, 0.8)" strokeWidth="0.5"/>
                      {/* East Africa */}
                      <path d="M 560 90 L 600 85 L 620 95 L 630 115 L 620 135 L 600 145 L 580 140 L 560 150 Z" fill="rgba(239, 68, 68, 0.4)" stroke="rgba(239, 68, 68, 0.8)" strokeWidth="0.5"/>
                      {/* South Africa */}
                      <path d="M 540 145 L 580 140 L 600 150 L 610 170 L 600 190 L 580 200 L 560 195 L 545 185 L 540 170 Z" fill="rgba(245, 158, 11, 0.4)" stroke="rgba(245, 158, 11, 0.8)" strokeWidth="0.5"/>
                    </g>

                    {/* Asia - Detailed */}
                    <g className="continent asia">
                      {/* Russia */}
                      <path d="M 480 35 L 600 30 L 650 40 L 680 60 L 690 80 L 680 100 L 650 120 L 600 125 L 550 120 L 500 115 L 480 105 L 470 85 L 480 65 Z" fill="rgba(59, 130, 246, 0.4)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="0.5"/>
                      {/* China */}
                      <path d="M 600 30 L 700 25 L 750 35 L 760 55 L 750 75 L 700 85 L 650 80 L 600 75 L 550 70 L 500 75 L 480 85 L 470 85 Z" fill="rgba(239, 68, 68, 0.4)" stroke="rgba(239, 68, 68, 0.8)" strokeWidth="0.5"/>
                      {/* India */}
                      <path d="M 550 70 L 600 65 L 620 75 L 630 95 L 620 115 L 600 125 L 580 120 L 570 100 L 560 80 Z" fill="rgba(34, 197, 94, 0.4)" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="0.5"/>
                      {/* Japan */}
                      <path d="M 750 35 L 760 30 L 765 35 L 760 40 L 755 40 Z" fill="rgba(147, 51, 234, 0.4)" stroke="rgba(147, 51, 234, 0.8)" strokeWidth="0.5"/>
                      {/* Southeast Asia */}
                      <path d="M 600 65 L 650 60 L 670 70 L 680 90 L 670 110 L 650 120 L 630 115 L 620 95 L 610 75 Z" fill="rgba(245, 158, 11, 0.4)" stroke="rgba(245, 158, 11, 0.8)" strokeWidth="0.5"/>
                    </g>

                    {/* Australia - Detailed */}
                    <g className="continent australia">
                      {/* Mainland */}
                      <path d="M 700 200 L 750 195 L 780 205 L 790 225 L 780 245 L 750 255 L 720 250 L 710 230 L 700 210 Z" fill="rgba(236, 72, 153, 0.4)" stroke="rgba(236, 72, 153, 0.8)" strokeWidth="0.5"/>
                      {/* Tasmania */}
                      <path d="M 720 250 L 730 245 L 735 250 L 730 255 L 725 255 Z" fill="rgba(59, 130, 246, 0.4)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="0.5"/>
                    </g>

                    {/* Greenland */}
                    <path d="M 120 40 L 140 35 L 150 45 L 145 55 L 135 60 L 125 55 Z" fill="rgba(147, 51, 234, 0.4)" stroke="rgba(147, 51, 234, 0.8)" strokeWidth="0.5"/>

                    {/* Iceland */}
                    <path d="M 430 35 L 435 30 L 440 35 L 435 40 L 430 40 Z" fill="rgba(34, 197, 94, 0.4)" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="0.5"/>

                    {/* New Zealand */}
                    <path d="M 800 220 L 820 215 L 830 225 L 825 235 L 815 240 L 805 235 Z" fill="rgba(245, 158, 11, 0.4)" stroke="rgba(245, 158, 11, 0.8)" strokeWidth="0.5"/>

                    {/* Grid lines for reference */}
                    {zoom > 2 && (
                      <g className="grid-lines" opacity="0.3">
                        {/* Latitude lines */}
                        {Array.from({ length: 18 }, (_, i) => (
                          <line 
                            key={`lat-${i}`} 
                            x1="0" y1={i * 25 + 25} 
                            x2="1000" y2={i * 25 + 25} 
                            stroke="rgba(255,255,255,0.2)" 
                            strokeWidth="0.5"
                          />
                        ))}
                        {/* Longitude lines */}
                        {Array.from({ length: 36 }, (_, i) => (
                          <line 
                            key={`lng-${i}`} 
                            x1={i * 25 + 25} y1="0" 
                            x2={i * 25 + 25} y2="500" 
                            stroke="rgba(255,255,255,0.2)" 
                            strokeWidth="0.5"
                          />
                        ))}
                      </g>
                    )}

                    {/* Country borders (more detailed at higher zoom) */}
                    {zoom > 1.5 && (
                      <g className="country-borders" opacity="0.6">
                        {/* Major rivers */}
                        <path d="M 200 45 L 210 65 L 220 85 L 230 105" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="1" fill="none"/>
                        <path d="M 550 70 L 560 90 L 570 110 L 580 130" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="1" fill="none"/>
                        <path d="M 600 30 L 610 50 L 620 70 L 630 90" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="1" fill="none"/>
                        
                        {/* Mountain ranges */}
                        <path d="M 180 35 L 190 40 L 200 35 L 210 40 L 220 35" stroke="rgba(139, 69, 19, 0.6)" strokeWidth="2" fill="none"/>
                        <path d="M 600 30 L 610 35 L 620 30 L 630 35 L 640 30" stroke="rgba(139, 69, 19, 0.6)" strokeWidth="2" fill="none"/>
                        <path d="M 480 100 L 490 105 L 500 100 L 510 105 L 520 100" stroke="rgba(139, 69, 19, 0.6)" strokeWidth="2" fill="none"/>
                      </g>
                    )}

                    {/* City markers at high zoom */}
                    {zoom > 3 && (
                      <g className="cities" opacity="0.8">
                        {/* Major cities */}
                        <circle cx="200" cy="65" r="2" fill="rgba(255, 255, 255, 0.8)"/>
                        <circle cx="450" cy="40" r="2" fill="rgba(255, 255, 255, 0.8)"/>
                        <circle cx="600" cy="75" r="2" fill="rgba(255, 255, 255, 0.8)"/>
                        <circle cx="750" cy="35" r="2" fill="rgba(255, 255, 255, 0.8)"/>
                        <circle cx="720" cy="230" r="2" fill="rgba(255, 255, 255, 0.8)"/>
                      </g>
                    )}

                    {/* Terrain details at very high zoom */}
                    {zoom > 4 && (
                      <g className="terrain" opacity="0.4">
                        {/* Forest areas */}
                        <path d="M 120 70 L 125 72 L 130 70 L 135 72 L 140 70" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="1" fill="none"/>
                        <path d="M 480 105 L 485 107 L 490 105 L 495 107 L 500 105" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="1" fill="none"/>
                        
                        {/* Desert areas */}
                        <path d="M 500 45 L 505 47 L 510 45 L 515 47 L 520 45" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1" fill="none"/>
                      </g>
                    )}
                  </svg>

                  {/* Zoom Controls */}
                  <div className="absolute top-4 right-4 flex flex-col space-y-2 z-30">
                    <button
                      onClick={() => handleZoom(1, mapDimensions.width / 2, mapDimensions.height / 2)}
                      className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleZoom(-1, mapDimensions.width / 2, mapDimensions.height / 2)}
                      className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                      }}
                      className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 text-xs font-medium"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Zoom Level Indicator */}
                  <div className="absolute bottom-4 left-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-medium z-30">
                    {Math.round(zoom * 100)}%
                  </div>

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