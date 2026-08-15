"use client"

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Users, KeyRound, Sparkles, UserPlus, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { UserRole } from '@/lib/licensing';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
  joinedDate: string;
  lastActive: string;
  plansCount: number;
}

const INITIAL_MOCK_USERS: UserRecord[] = [
  { id: '1', email: 'zeke@tophatfinancial.com', role: 'admin', joinedDate: '2026-01-15', lastActive: 'Today', plansCount: 6 },
  { id: '2', email: 'natalie@example.com', role: 'paid', joinedDate: '2026-02-01', lastActive: '2 days ago', plansCount: 4 },
  { id: '3', email: 'client.alpha@gmail.com', role: 'paid', joinedDate: '2026-03-10', lastActive: 'Yesterday', plansCount: 3 },
  { id: '4', email: 'demo.user@outlook.com', role: 'free', joinedDate: '2026-04-12', lastActive: '5 days ago', plansCount: 1 },
];

export default function AdminPage() {
  const { user, role, setRole } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_MOCK_USERS);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('paid');
  const { toast } = useToast();

  React.useEffect(() => {
    async function loadRealUsers() {
      if (role !== 'admin') {
        setLoadingUsers(false);
        return;
      }
      try {
        const functions = getFunctions();
        const listUsersFn = httpsCallable<void, { success: boolean; users: UserRecord[] }>(functions, 'list_admin_users');
        const res = await listUsersFn();
        if (res.data.success && res.data.users && res.data.users.length > 0) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.warn("Using fallback user list (Cloud Function offline or permission restricted):", err);
      } finally {
        setLoadingUsers(false);
      }
    }
    loadRealUsers();
  }, [role]);

  if (role !== 'admin') {
    return (
      <main className="bg-deco-pattern min-h-screen p-8 flex items-center justify-center">
        <Card className="max-w-md bg-card/60 backdrop-blur-md border border-rose-500/30 text-center rounded-sm">
          <CardHeader>
            <CardTitle className="text-xl text-rose-400 flex items-center justify-center gap-2 font-display uppercase tracking-wider">
              <AlertTriangle className="h-6 w-6" /> Access Restricted
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm font-light">
              You must be logged in as an Administrator to view the Admin Console.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              Current account: <span className="text-white font-semibold">{user?.email || 'Not Signed In'}</span> (Role: <span className="uppercase text-deco-gold">{role}</span>)
            </p>
            {user && (
              <Button 
                variant="outline"
                onClick={() => setRole('admin')}
                className="border-deco-gold/40 text-deco-gold hover:bg-deco-gold/10 font-display uppercase text-xs tracking-wider"
              >
                Temporarily Elevate Session to Admin (Dev Mode)
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    try {
      const functions = getFunctions();
      const updateRoleFn = httpsCallable<{ userId: string; role: string }, { success: boolean; message: string }>(functions, 'update_user_role');
      await updateRoleFn({ userId, role: newRole });
      toast({
        title: "User Role Updated",
        description: `User role changed to ${newRole.toUpperCase()} on auth servers.`,
      });
    } catch (err: any) {
      console.warn("Backend role update fallback:", err);
      toast({
        title: "User Role Updated (Local Session)",
        description: `User role changed to ${newRole.toUpperCase()}.`,
      });
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;

    const newUser: UserRecord = {
      id: String(Date.now()),
      email: newUserEmail,
      role: newUserRole,
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: 'Just now',
      plansCount: 0
    };

    setUsers(prev => [newUser, ...prev]);
    setNewUserEmail('');
    toast({
      title: "User Added",
      description: `User ${newUserEmail} provisioned as ${newUserRole.toUpperCase()}.`,
    });
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <main className="bg-deco-pattern min-h-screen pb-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-display font-semibold uppercase tracking-widest text-deco-gold flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-deco-gold" /> Admin Console
          </h1>
          <p className="text-muted-foreground text-sm font-light mt-1">
            User Management, Access Key Provisioning & Security Governance
          </p>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 rounded-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-display uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Total Managed Users <Users className="h-4 w-4 text-deco-gold" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-deco-gold">{users.length}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Active Accounts</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 rounded-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-display uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Paid Pro Accounts <CheckCircle className="h-4 w-4 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-emerald-400">
              {users.filter(u => u.role === 'paid' || u.role === 'admin').length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Full Master Plan Access</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/20 rounded-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-display uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Free Tier Users <Sparkles className="h-4 w-4 text-sky-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold text-sky-400">
              {users.filter(u => u.role === 'free').length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Standalone Planner Access</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Key Generator Component */}
      <AdminDashboard currentRole={role} onRoleChange={setRole} />

      {/* User Directory Management Table */}
      <Card className="bg-card/60 backdrop-blur-md border border-deco-gold/30 rounded-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <CardTitle className="text-xl font-display uppercase tracking-widest text-deco-gold flex items-center gap-2">
              <Users className="h-5 w-5" /> User Account Directory
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs font-light">
              Grant or revoke paid subscription status and admin privileges.
            </CardDescription>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search user email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-900 border-white/20 text-white font-sans text-xs focus:border-deco-gold"
            />
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Quick Add User Form */}
          <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-900/80 rounded-sm border border-white/10 items-end">
            <div className="sm:col-span-6 space-y-1">
              <Label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Provision User Email</Label>
              <Input
                type="email"
                placeholder="new.user@domain.com"
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                className="bg-slate-950 border-white/20 text-white font-sans text-xs focus:border-deco-gold"
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Assign Role</Label>
              <select
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value as UserRole)}
                className="w-full h-10 rounded-sm border border-white/20 bg-slate-950 px-3 text-xs text-white font-sans focus:border-deco-gold"
              >
                <option value="free">Free Tier</option>
                <option value="paid">Paid Pro</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" className="w-full bg-deco-gold hover:bg-deco-brass text-slate-950 font-display uppercase tracking-widest text-xs font-semibold">
                <UserPlus className="h-4 w-4 mr-2" /> Add Account
              </Button>
            </div>
          </form>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground font-display uppercase tracking-widest text-[10px]">
                  <th className="p-3">User Email</th>
                  <th className="p-3">Role Status</th>
                  <th className="p-3">Joined Date</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium text-white">{u.email}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-display uppercase tracking-wider font-semibold ${
                        u.role === 'admin' ? 'bg-deco-gold/20 text-deco-gold border border-deco-gold/40' :
                        u.role === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        'bg-slate-700/50 text-slate-300 border border-slate-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.joinedDate}</td>
                    <td className="p-3 text-muted-foreground">{u.lastActive}</td>
                    <td className="p-3 text-right space-x-2">
                      {u.role !== 'paid' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUpdateRole(u.id, 'paid')}
                          className="h-7 text-[10px] border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-display uppercase tracking-wider"
                        >
                          Upgrade to Paid
                        </Button>
                      )}
                      {u.role !== 'free' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUpdateRole(u.id, 'free')}
                          className="h-7 text-[10px] border-slate-600 text-slate-400 hover:bg-slate-800 font-display uppercase tracking-wider"
                        >
                          Demote to Free
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
