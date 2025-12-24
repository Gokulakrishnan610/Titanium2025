'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, Settings, Plus, Eye, Shield, AlertTriangle } from 'lucide-react';

interface Club {
  id: number;
  name: string;
  slug: string;
  description: string;
  club_type: string;
  email: string;
  phone?: string;
  website?: string;
  logo?: string;
  banner?: string;
  primary_color: string;
  secondary_color: string;
  status: string;
  is_default: boolean;
  allow_public_events: boolean;
  require_approval: boolean;
  payment_gateway: string;
  total_events: number;
  total_members: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ClubMembership {
  id: number;
  club: number;
  club_name: string;
  user: number;
  user_details: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  role: string;
  status: string;
  can_create_events: boolean;
  can_manage_members: boolean;
  can_manage_payments: boolean;
  can_view_analytics: boolean;
  joined_at: string;
}

interface AdminAccess {
  has_access: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  club_admin_count: number;
}

const ClubManagement: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [myClubs, setMyClubs] = useState<ClubMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all-clubs');

  // Form state for creating/editing clubs
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    club_type: 'technical',
    email: '',
    phone: '',
    website: '',
    primary_color: '#007bff',
    secondary_color: '#6c757d',
    payment_gateway: 'cashfree'
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/clubs/check_admin_access/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAdminAccess(data);
        
        if (data.has_access) {
          fetchClubs();
          fetchMyClubs();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setClubs(data);
      } else if (response.status === 403) {
        console.error('Access denied to club management');
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyClubs = async () => {
    try {
      const response = await fetch('/api/clubs/my_clubs/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMyClubs(data);
      } else if (response.status === 403) {
        console.error('Access denied to club memberships');
      }
    } catch (error) {
      console.error('Error fetching my clubs:', error);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/clubs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          ...formData,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        }),
      });

      if (response.ok) {
        const newClub = await response.json();
        setClubs([...clubs, newClub]);
        setShowCreateDialog(false);
        setFormData({
          name: '',
          description: '',
          club_type: 'technical',
          email: '',
          phone: '',
          website: '',
          primary_color: '#007bff',
          secondary_color: '#6c757d',
          payment_gateway: 'cashfree'
        });
        alert('Club created successfully!');
      } else if (response.status === 403) {
        alert('Access denied. Only Django admin users can create clubs.');
      } else {
        alert('Failed to create club. Please try again.');
      }
    } catch (error) {
      console.error('Error creating club:', error);
      alert('Error creating club. Please try again.');
    }
  };

  const handleJoinClub = async (clubSlug: string) => {
    try {
      const response = await fetch(`/api/clubs/${clubSlug}/join/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        fetchMyClubs(); // Refresh my clubs
        alert('Successfully joined the club as admin!');
      } else if (response.status === 403) {
        alert('Access denied. Only Django admin users can join clubs through this interface.');
      } else {
        alert('Failed to join club. Please try again.');
      }
    } catch (error) {
      console.error('Error joining club:', error);
      alert('Error joining club. Please try again.');
    }
  };

  const getClubTypeColor = (type: string) => {
    const colors = {
      technical: 'bg-gray-800 text-white border border-gray-600',
      cultural: 'bg-gray-700 text-white border border-gray-500',
      sports: 'bg-gray-600 text-white border border-gray-400',
      academic: 'bg-gray-900 text-white border border-gray-700',
      social: 'bg-black text-white border border-gray-800',
      other: 'bg-gray-500 text-white border border-gray-300',
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-white text-black border border-gray-300',
      moderator: 'bg-gray-200 text-black border border-gray-400',
      event_manager: 'bg-gray-700 text-white border border-gray-500',
      member: 'bg-gray-800 text-white border border-gray-600',
    };
    return colors[role as keyof typeof colors] || colors.member;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  // Show access denied message if user doesn't have admin access
  if (!adminAccess?.has_access) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
            <p className="text-gray-400 mb-4">
              Club Management is restricted to Django admin users only.
            </p>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-white">Access Requirements:</span>
            </div>
            <ul className="text-sm text-gray-300 text-left space-y-1">
              <li>• Django staff user status</li>
              <li>• Django superuser status</li>
              <li>• Or club admin role in existing clubs</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Contact your system administrator to request access.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-white text-black hover:bg-gray-200"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Club Management</h1>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-400">
                {adminAccess?.is_staff || adminAccess?.is_superuser 
                  ? 'Django Admin Access' 
                  : `Club Admin (${adminAccess?.club_admin_count} clubs)`
                }
              </span>
            </div>
          </div>
          {(adminAccess?.is_staff || adminAccess?.is_superuser) && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-white text-black hover:bg-gray-200 border border-gray-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Club
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl bg-black border border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Club</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Fill in the details to create a new club.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClub} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Club Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-gray-900 border-gray-700 text-white focus:border-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="club_type" className="text-white">Club Type</Label>
                    <Select value={formData.club_type} onValueChange={(value) => setFormData({ ...formData, club_type: value })}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="technical" className="text-white hover:bg-gray-800">Technical</SelectItem>
                        <SelectItem value="cultural" className="text-white hover:bg-gray-800">Cultural</SelectItem>
                        <SelectItem value="sports" className="text-white hover:bg-gray-800">Sports</SelectItem>
                        <SelectItem value="academic" className="text-white hover:bg-gray-800">Academic</SelectItem>
                        <SelectItem value="social" className="text-white hover:bg-gray-800">Social</SelectItem>
                        <SelectItem value="other" className="text-white hover:bg-gray-800">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="bg-gray-900 border-gray-700 text-white focus:border-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-gray-900 border-gray-700 text-white focus:border-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-white">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white focus:border-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website" className="text-white">Website (Optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white focus:border-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary_color" className="text-white">Primary Color</Label>
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="bg-gray-900 border-gray-700 h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_gateway" className="text-white">Payment Gateway</Label>
                    <Select value={formData.payment_gateway} onValueChange={(value) => setFormData({ ...formData, payment_gateway: value })}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="cashfree" className="text-white hover:bg-gray-800">Cashfree</SelectItem>
                        <SelectItem value="payu" className="text-white hover:bg-gray-800">PayU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    Create Club
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-gray-700">
            <TabsTrigger 
              value="all-clubs" 
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              All Clubs
            </TabsTrigger>
            <TabsTrigger 
              value="my-clubs"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black"
            >
              My Clubs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all-clubs" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <Card key={club.id} className="bg-gray-900 border-gray-700 hover:border-gray-500 transition-all duration-200 hover:shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-white">
                          {club.name}
                          {club.is_default && (
                            <Badge className="bg-white text-black">Default</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-gray-400">{club.description}</CardDescription>
                      </div>
                      <Badge className={getClubTypeColor(club.club_type)}>
                        {club.club_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Users className="w-4 h-4" />
                        {club.total_members} members
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {club.total_events} events
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Settings className="w-4 h-4" />
                        {club.payment_gateway}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedClub(club)}
                        className="border-gray-600 text-white hover:bg-gray-800"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleJoinClub(club.slug)}
                        disabled={myClubs.some(mc => mc.club === club.id)}
                        className={myClubs.some(mc => mc.club === club.id) 
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed" 
                          : "bg-white text-black hover:bg-gray-200"
                        }
                      >
                        {myClubs.some(mc => mc.club === club.id) ? 'Admin' : 'Join as Admin'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my-clubs" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myClubs.map((membership) => {
                const club = clubs.find(c => c.id === membership.club);
                if (!club) return null;

                return (
                  <Card key={membership.id} className="bg-gray-900 border-gray-700 hover:border-gray-500 transition-all duration-200 hover:shadow-xl">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white">{membership.club_name}</CardTitle>
                          <CardDescription className="text-gray-400">{club.description}</CardDescription>
                        </div>
                        <Badge className={getRoleColor(membership.role)}>
                          {membership.role}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-400">
                          <strong>Permissions:</strong>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {membership.can_create_events && (
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">Create Events</Badge>
                          )}
                          {membership.can_manage_members && (
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">Manage Members</Badge>
                          )}
                          {membership.can_manage_payments && (
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">Manage Payments</Badge>
                          )}
                          {membership.can_view_analytics && (
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">View Analytics</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Joined: {new Date(membership.joined_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Club Details Dialog */}
        {selectedClub && (
          <Dialog open={!!selectedClub} onOpenChange={() => setSelectedClub(null)}>
            <DialogContent className="max-w-4xl bg-black border border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle className="text-white">{selectedClub.name}</DialogTitle>
                <DialogDescription className="text-gray-400">{selectedClub.description}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-white">Contact Information</h3>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div><strong>Email:</strong> {selectedClub.email}</div>
                      {selectedClub.phone && <div><strong>Phone:</strong> {selectedClub.phone}</div>}
                      {selectedClub.website && (
                        <div>
                          <strong>Website:</strong>{' '}
                          <a href={selectedClub.website} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
                            {selectedClub.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 text-white">Settings</h3>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div><strong>Status:</strong> {selectedClub.status}</div>
                      <div><strong>Payment Gateway:</strong> {selectedClub.payment_gateway}</div>
                      <div><strong>Public Events:</strong> {selectedClub.allow_public_events ? 'Yes' : 'No'}</div>
                      <div><strong>Requires Approval:</strong> {selectedClub.require_approval ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-white">Statistics</h3>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div><strong>Total Members:</strong> {selectedClub.total_members}</div>
                      <div><strong>Total Events:</strong> {selectedClub.total_events}</div>
                      <div><strong>Created:</strong> {new Date(selectedClub.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2 text-white">Branding</h3>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: selectedClub.primary_color }}
                        ></div>
                        <span className="text-sm text-gray-300">Primary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border border-gray-600"
                          style={{ backgroundColor: selectedClub.secondary_color }}
                        ></div>
                        <span className="text-sm text-gray-300">Secondary</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default ClubManagement;