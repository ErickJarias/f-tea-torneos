import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, signInWithPopup, googleProvider, signOut, collection, onSnapshot, query, where, orderBy, doc, setDoc, addDoc, deleteDoc, OperationType, handleFirestoreError } from './firebase';
import { User } from 'firebase/auth';
import { Tournament, Team, Player, Match, AppSettings, Sponsor, UserProfile } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Trophy, 
  Users, 
  Calendar, 
  BarChart3, 
  Plus, 
  LogIn, 
  LogOut, 
  Settings, 
  ChevronRight, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  BrainCircuit, 
  TrendingUp,
  Play,
  Download,
  Star,
  Activity,
  Video,
  Camera,
  ExternalLink,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Components ---

const Navbar = ({ user, onLogin, onLogout, theme, setTheme, isAdmin, onOpenAdmin }: { 
  user: User | null, 
  onLogin: () => void, 
  onLogout: () => void,
  theme: 'light' | 'dark',
  setTheme: (t: 'light' | 'dark') => void,
  isAdmin: boolean,
  onOpenAdmin: () => void
}) => (
  <nav className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-20 items-center">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
            <Trophy className="w-7 h-7 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black font-display tracking-tighter uppercase leading-none">Fútea</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] leading-none mt-1">Pro Management</span>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Admin Button */}
          {isAdmin && (
            <Button variant="outline" size="icon" onClick={onOpenAdmin} className="rounded-xl border-primary/20 hover:bg-primary/10 transition-colors">
              <Settings className="w-4 h-4" />
            </Button>
          )}

          {/* Theme Controls */}
          <div className="bg-muted/50 p-1 rounded-2xl border border-primary/10">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="rounded-xl h-9 w-9"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-black uppercase tracking-tight">{user.displayName}</span>
                <Badge variant="outline" className="text-[9px] font-bold py-0 h-4 border-primary/20 text-primary">ORGANIZADOR</Badge>
              </div>
              <Button variant="secondary" size="icon" onClick={onLogout} className="rounded-xl hover:bg-destructive hover:text-destructive-foreground transition-all">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <Button onClick={onLogin} className="gap-2 rounded-xl font-bold uppercase tracking-wider text-xs px-6 shadow-xl shadow-primary/20">
              <LogIn className="w-4 h-4" />
              Acceso Staff
            </Button>
          )}
        </div>
      </div>
    </div>
  </nav>
);

const SponsorsMarquee = ({ sponsors }: { sponsors: Sponsor[] }) => (
  <div className="bg-primary text-primary-foreground overflow-hidden py-3 border-y border-primary-foreground/10">
    <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
      {sponsors && sponsors.length > 0 ? (
        <>
          {sponsors.map(s => (
            <div key={s.id} className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-all cursor-pointer">
              {s.logoUrl ? (
                <img src={s.logoUrl} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg rotate-45 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary-foreground -rotate-45" />
                </div>
              )}
              <span className="text-xs font-black uppercase tracking-[0.2em]">{s.name}</span>
            </div>
          ))}
          {/* Duplicate for marquee effect */}
          {sponsors.map(s => (
            <div key={`dup-${s.id}`} className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-all cursor-pointer">
              {s.logoUrl ? (
                <img src={s.logoUrl} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg rotate-45 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary-foreground -rotate-45" />
                </div>
              )}
              <span className="text-xs font-black uppercase tracking-[0.2em]">{s.name}</span>
            </div>
          ))}
        </>
      ) : (
        <div className="text-xs font-bold uppercase tracking-widest opacity-50 px-8">Fútea - Gestión Deportiva de Élite</div>
      )}
    </div>
  </div>
);

const AdminPanel = ({ 
  isOpen, 
  onClose, 
  settings, 
  tournaments, 
  onDeleteTournament 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  settings: AppSettings | null,
  tournaments: Tournament[],
  onDeleteTournament: (id: string) => void
}) => {
  const [newSponsor, setNewSponsor] = useState<Partial<Sponsor>>({ name: '', tier: 'gold' });
  const [sponsorLogo, setSponsorLogo] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('sponsors');

  // Fetch users for dashboard
  useEffect(() => {
    if (isOpen) {
      setIsLoadingUsers(true);
      const q = query(collection(db, 'users'), orderBy('lastLoginAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
        setUsers(docs);
        setIsLoadingUsers(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
        setIsLoadingUsers(false);
      });
      return unsubscribe;
    }
  }, [isOpen]);

  const handleSponsorFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSponsorLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addSponsor = async () => {
    if (!settings || !newSponsor.name || !sponsorLogo) {
      return;
    }
    const sponsor: Sponsor = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSponsor.name,
      logoUrl: sponsorLogo,
      tier: newSponsor.tier as any
    };
    const updatedSponsors = [...(settings.globalSponsors || []), sponsor];
    await setDoc(doc(db, 'settings', 'global'), { ...settings, globalSponsors: updatedSponsors });
    setNewSponsor({ name: '', tier: 'gold' });
    setSponsorLogo(null);
  };

  const removeSponsor = async (id: string) => {
    if (!settings) return;
    const updatedSponsors = settings.globalSponsors.filter(s => s.id !== id);
    await setDoc(doc(db, 'settings', 'global'), { ...settings, globalSponsors: updatedSponsors });
  };

  const getInactivityDays = (lastLogin: string) => {
    const last = new Date(lastLogin).getTime();
    const now = new Date().getTime();
    return Math.floor((now - last) / (1000 * 60 * 60 * 24));
  };

  const menuItems = [
    { id: 'sponsors', label: 'Sponsors', icon: Sparkles },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'tournaments', label: 'Torneos', icon: Trophy },
    { id: 'config', label: 'Ajustes', icon: Settings },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-6xl h-[95vh] p-0 overflow-hidden flex flex-col md:flex-row rounded-3xl border-none shadow-2xl">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r flex flex-col">
          <div className="p-6 border-b hidden md:block">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter">Admin</h2>
            </div>
          </div>
          
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible p-2 md:p-4 gap-1 scrollbar-hide">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap md:w-full",
                  activeTab === item.id 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold uppercase text-[11px] tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-background/50 backdrop-blur-sm relative">
          <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
            {/* Header for Mobile */}
            <div className="md:hidden mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h2>
            </div>

            {activeTab === 'sponsors' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-card p-6 md:p-8 rounded-3xl border shadow-sm space-y-8">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <Plus className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-black uppercase tracking-tight">Nuevo Patrocinador</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre Comercial</Label>
                      <Input 
                        value={newSponsor.name} 
                        onChange={e => setNewSponsor({...newSponsor, name: e.target.value})} 
                        placeholder="Ej: Nike International" 
                        className="h-14 text-base font-bold rounded-2xl"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Categoría</Label>
                      <Select value={newSponsor.tier} onValueChange={v => setNewSponsor({...newSponsor, tier: v as any})}>
                        <SelectTrigger className="h-14 font-bold rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gold">Oro (Principal)</SelectItem>
                          <SelectItem value="silver">Plata (Partner)</SelectItem>
                          <SelectItem value="bronze">Bronce (Colaborador)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Logo de la Marca</Label>
                      <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-full md:flex-1">
                          <Input 
                            type="file" 
                            onChange={handleSponsorFile} 
                            accept="image/*" 
                            className="h-14 pt-4 cursor-pointer rounded-2xl border-dashed border-2" 
                          />
                        </div>
                        {sponsorLogo && (
                          <div className="w-24 h-24 rounded-2xl border bg-muted flex items-center justify-center p-2 overflow-hidden shrink-0">
                            <img src={sponsorLogo} className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={addSponsor} className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20">
                    Guardar Patrocinador
                  </Button>
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Patrocinadores Actuales</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settings?.globalSponsors?.map(s => (
                      <Card key={s.id} className="group relative border-none shadow-md hover:shadow-xl transition-all rounded-3xl overflow-hidden bg-card">
                        <CardContent className="p-8 flex flex-col items-center gap-6">
                          <div className="w-full aspect-video rounded-2xl bg-muted/50 flex items-center justify-center p-6 border border-primary/5">
                            {s.logoUrl ? (
                              <img src={s.logoUrl} className="max-w-full max-h-full object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
                            ) : (
                              <Activity className="w-12 h-12 opacity-10" />
                            )}
                          </div>
                          <div className="text-center space-y-2">
                            <p className="font-black uppercase text-sm tracking-tight">{s.name}</p>
                            <Badge variant="secondary" className="font-black text-[10px] uppercase tracking-widest px-3">{s.tier}</Badge>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => removeSponsor(s.id)} 
                            className="absolute top-4 right-4 h-10 w-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-xl"
                          >
                            <Plus className="w-5 h-5 rotate-45" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">Comunidad Fútea</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Base de datos de organizadores</p>
                  </div>
                  <Badge className="h-10 px-6 rounded-2xl font-black uppercase tracking-widest text-xs">
                    {users.length} Usuarios
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {isLoadingUsers ? (
                    <div className="py-20 flex flex-col items-center gap-4 opacity-30">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="font-black uppercase tracking-widest text-sm">Sincronizando...</p>
                    </div>
                  ) : users.map(u => {
                    const inactivity = getInactivityDays(u.lastLoginAt);
                    const isInactive = inactivity >= 7;
                    return (
                      <div key={u.uid} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-card rounded-[2.5rem] border shadow-sm gap-6 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-6 w-full sm:w-auto">
                          <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 shadow-inner">
                              {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <Users className="w-8 h-8 text-primary" />}
                            </div>
                            <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-card", isInactive ? "bg-destructive" : "bg-green-500")} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black uppercase text-base tracking-tight truncate">{u.displayName}</p>
                            <p className="text-xs text-muted-foreground truncate font-bold opacity-70">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-6 sm:pt-0">
                          <div className="text-left sm:text-right space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Estado</p>
                            <p className={cn("text-xs font-black uppercase tracking-tighter", isInactive ? "text-destructive" : "text-green-500")}>
                              {inactivity === 0 ? 'Activo hoy' : `Hace ${inactivity} días`}
                            </p>
                          </div>
                          <Button 
                            variant={isInactive ? "destructive" : "outline"} 
                            className="h-12 px-8 font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-lg"
                            onClick={() => window.location.href = `mailto:${u.email}?subject=Te extrañamos en Fútea&body=Hola ${u.displayName}, hace tiempo que no gestionas tus torneos...`}
                          >
                            Contactar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'tournaments' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Torneos Globales</h3>
                <div className="grid grid-cols-1 gap-4">
                  {tournaments.map(t => (
                    <div key={t.id} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-card rounded-[2.5rem] border shadow-sm gap-6 hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner shrink-0">
                          <Trophy className="w-8 h-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-black uppercase text-base tracking-tight">{t.name}</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="outline" className="text-[10px] font-black py-0 h-6 uppercase tracking-widest border-primary/20">{t.status}</Badge>
                            <Badge variant="outline" className="text-[10px] font-black py-0 h-6 uppercase tracking-widest border-blue-500/20">{t.type}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        onClick={() => onDeleteTournament(t.id)} 
                        className="w-full sm:w-auto h-12 px-10 font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-destructive/10"
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'config' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">Configuración</h3>
                  <div className="max-w-xl bg-card p-8 rounded-[2.5rem] border shadow-sm space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nombre de la App</Label>
                      <Input 
                        value={settings?.appName} 
                        onChange={async (e) => {
                          if (!settings) return;
                          await setDoc(doc(db, 'settings', 'global'), { ...settings, appName: e.target.value });
                        }} 
                        className="font-black uppercase tracking-tighter text-2xl h-16 rounded-2xl border-2 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-primary/5 rounded-[3rem] border border-primary/10 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-2xl">
                        <BrainCircuit className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-black uppercase tracking-widest text-sm">IA Insights</h4>
                    </div>
                    <ul className="space-y-4">
                      {['Recordatorios automáticos', 'Reportes de popularidad', 'Sponsors Premium'].map((text, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-8 bg-muted/30 rounded-[3rem] border border-primary/10 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-4 bg-background rounded-full shadow-inner">
                      <ShieldCheck className="w-12 h-12 text-primary/40" />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                      Seguridad Nivel Pro Activada
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TournamentCard = ({ 
  tournament, 
  onClick, 
  onDelete, 
  isOrganizer 
}: { 
  tournament: Tournament, 
  onClick: () => void, 
  onDelete: (id: string) => void,
  isOrganizer: boolean
}) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative"
  >
    <Card 
      className="cursor-pointer hover:shadow-2xl transition-all border-none bg-card/50 backdrop-blur-sm overflow-hidden group h-full flex flex-col" 
      onClick={onClick}
    >
      <div className="h-1.5 bg-gradient-to-r from-primary via-blue-500 to-primary" />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge variant={tournament.status === 'active' ? 'default' : 'secondary'} className="mb-2 font-bold tracking-wider uppercase text-[10px]">
            {tournament.status === 'active' ? 'En curso' : tournament.status === 'completed' ? 'Finalizado' : 'Borrador'}
          </Badge>
          <div className="flex gap-2">
            <Trophy className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            {isOrganizer && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(tournament.id);
                }}
              >
                <Plus className="w-4 h-4 rotate-45" />
              </Button>
            )}
          </div>
        </div>
        <CardTitle className="text-2xl font-black font-display uppercase tracking-tighter leading-none mb-1 group-hover:text-primary transition-colors">
          {tournament.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-xs font-medium opacity-70">
          {tournament.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-4">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-primary/10 rounded">
              <Users className="w-3 h-3 text-primary" />
            </div>
            <span>{tournament.type === 'league' ? 'Liga' : 'Eliminatoria'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-blue-500/10 rounded">
              <Calendar className="w-3 h-3 text-blue-500" />
            </div>
            <span>{tournament.startDate || 'Próximamente'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const isAdmin = user?.email === "tatanarias13@gmail.com";

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Settings Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setAppSettings({ id: snapshot.id, ...snapshot.data() } as AppSettings);
      } else {
        const defaults: Partial<AppSettings> = {
          appName: 'Fútea',
          globalSponsors: []
        };
        setDoc(doc(db, 'settings', 'global'), defaults);
      }
    });
    return unsubscribe;
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthReady(true);
      
      if (user) {
        // Sync user profile for tracking
        const userRef = doc(db, 'users', user.uid);
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Usuario',
          photoURL: user.photoURL || undefined,
          lastLoginAt: new Date().toISOString()
        };
        await setDoc(userRef, profile, { merge: true });
      }
    });
    return unsubscribe;
  }, []);

  // Tournaments Listener
  useEffect(() => {
    if (!isAuthReady) return;
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
      setTournaments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tournaments');
    });
    return unsubscribe;
  }, [isAuthReady]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const deleteTournament = async (tournamentId: string) => {
    // Custom confirmation logic would go here, for now using a safer approach
    try {
      await deleteDoc(doc(db, 'tournaments', tournamentId));
      if (selectedTournament?.id === tournamentId) {
        setSelectedTournament(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'tournaments');
    }
  };

  const createTournament = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const newTournament: Partial<Tournament> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as any,
      status: 'draft',
      organizerId: user.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      const newDocRef = doc(collection(db, 'tournaments'));
      await setDoc(newDocRef, newTournament);
      setIsCreateDialogOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tournaments');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Trophy className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
      <Navbar 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        theme={theme}
        setTheme={setTheme}
        isAdmin={isAdmin}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
      />
      {!selectedTournament && <SponsorsMarquee sponsors={appSettings?.globalSponsors || []} />}

      <AdminPanel 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
        settings={appSettings}
        tournaments={tournaments}
        onDeleteTournament={deleteTournament}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!selectedTournament ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="space-y-1">
                  <h1 className="text-6xl font-black font-display tracking-tighter uppercase leading-none">
                    Tus <span className="text-primary">Torneos</span>
                  </h1>
                  <p className="text-muted-foreground font-medium">Gestiona tus ligas y competiciones con tecnología de élite.</p>
                </div>
                {user && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger render={<Button className="gap-3 h-14 px-8 rounded-2xl font-black uppercase tracking-wider shadow-2xl shadow-primary/30 hover:scale-105 transition-transform" />}>
                      <Plus className="w-5 h-5" />
                      Crear Competición
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Torneo</DialogTitle>
                        <DialogDescription>
                          Configura los detalles básicos de tu competición.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={createTournament} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre del Torneo</Label>
                          <Input id="name" name="name" placeholder="Ej: Liga de Verano 2024" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Descripción</Label>
                          <Input id="description" name="description" placeholder="Breve descripción..." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">Formato</Label>
                          <Select name="type" defaultValue="league">
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="league">Liga (Todos contra todos)</SelectItem>
                              <SelectItem value="knockout">Eliminatoria (Playoffs)</SelectItem>
                              <SelectItem value="group_stage">Fase de Grupos + Playoffs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">Crear Torneo</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {tournaments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tournaments.map((t) => (
                    <TournamentCard 
                      key={t.id} 
                      tournament={t} 
                      isOrganizer={user?.uid === t.organizerId}
                      onDelete={deleteTournament}
                      onClick={() => setSelectedTournament(t)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/30">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No hay torneos todavía</h3>
                  <p className="text-muted-foreground mb-6">Crea tu primer torneo para empezar a gestionar.</p>
                  {!user && <Button onClick={handleLogin}>Inicia sesión para empezar</Button>}
                </div>
              )}
            </motion.div>
          ) : (
            <TournamentDetails 
              tournament={selectedTournament} 
              user={user} 
              onBack={() => setSelectedTournament(null)} 
            />
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t py-12 bg-muted/30 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-2xl font-black font-display tracking-tighter uppercase">Fútea</span>
          </div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">
            © 2024 Fútea - El futuro de la gestión deportiva.
          </p>
        </div>
      </footer>
    </div>
  );
}

// --- Tournament Details Component ---

const TournamentDetails = ({ tournament, user, onBack }: { tournament: Tournament, user: User | null, onBack: () => void }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState<string | null>(null);
  const [playerPhotoBase64, setPlayerPhotoBase64] = useState<string | null>(null);
  const [selectedRoundMVP, setSelectedRoundMVP] = useState<number | null>(null);
  const isOrganizer = user?.uid === tournament.organizerId;
  const isRosterLocked = matches.some(m => m.status !== 'scheduled');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlayerPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const teamsQ = query(collection(db, `tournaments/${tournament.id}/teams`), orderBy('points', 'desc'));
    const matchesQ = query(collection(db, `tournaments/${tournament.id}/matches`), orderBy('date', 'asc'));
    const playersQ = query(collection(db, `tournaments/${tournament.id}/players`), orderBy('goals', 'desc'));

    const unsubTeams = onSnapshot(teamsQ, s => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() } as Team))));
    const unsubMatches = onSnapshot(matchesQ, s => setMatches(s.docs.map(d => ({ id: d.id, ...d.data() } as Match))));
    const unsubPlayers = onSnapshot(playersQ, s => setPlayers(s.docs.map(d => ({ id: d.id, ...d.data() } as Player))));

    return () => { unsubTeams(); unsubMatches(); unsubPlayers(); };
  }, [tournament.id]);

  const addTeam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTeam: Partial<Team> = {
      name: formData.get('name') as string,
      tournamentId: tournament.id,
      points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0
    };
    try {
      await setDoc(doc(collection(db, `tournaments/${tournament.id}/teams`)), newTeam);
      setIsAddTeamOpen(false);
    } catch (error) { handleFirestoreError(error, OperationType.CREATE, 'teams'); }
  };

  const addMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMatch: Partial<Match> = {
      tournamentId: tournament.id,
      homeTeamId: formData.get('homeTeam') as string,
      awayTeamId: formData.get('awayTeam') as string,
      date: formData.get('date') as string,
      round: parseInt(formData.get('round') as string),
      status: 'scheduled',
      homeScore: 0,
      awayScore: 0
    };
    try {
      await setDoc(doc(collection(db, `tournaments/${tournament.id}/matches`)), newMatch);
      setIsAddMatchOpen(false);
    } catch (error) { handleFirestoreError(error, OperationType.CREATE, 'matches'); }
  };

  const updateMatchScore = async (matchId: string, homeScore: number, awayScore: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || match.status === 'finished') return;

    try {
      // Update match
      await setDoc(doc(db, `tournaments/${tournament.id}/matches/${matchId}`), {
        ...match,
        homeScore,
        awayScore,
        status: 'finished'
      });

      // Update Team Standings
      const homeTeam = teams.find(t => t.id === match.homeTeamId);
      const awayTeam = teams.find(t => t.id === match.awayTeamId);

      if (homeTeam && awayTeam) {
        const hPoints = homeScore > awayScore ? 3 : homeScore === awayScore ? 1 : 0;
        const aPoints = awayScore > homeScore ? 3 : homeScore === awayScore ? 1 : 0;

        await setDoc(doc(db, `tournaments/${tournament.id}/teams/${homeTeam.id}`), {
          ...homeTeam,
          played: homeTeam.played + 1,
          won: homeTeam.won + (homeScore > awayScore ? 1 : 0),
          drawn: homeTeam.drawn + (homeScore === awayScore ? 1 : 0),
          lost: homeTeam.lost + (homeScore < awayScore ? 1 : 0),
          goalsFor: homeTeam.goalsFor + homeScore,
          goalsAgainst: homeTeam.goalsAgainst + awayScore,
          points: homeTeam.points + hPoints
        });

        await setDoc(doc(db, `tournaments/${tournament.id}/teams/${awayTeam.id}`), {
          ...awayTeam,
          played: awayTeam.played + 1,
          won: awayTeam.won + (awayScore > homeScore ? 1 : 0),
          drawn: awayTeam.drawn + (homeScore === awayScore ? 1 : 0),
          lost: awayTeam.lost + (awayScore < homeScore ? 1 : 0),
          goalsFor: awayTeam.goalsFor + awayScore,
          goalsAgainst: awayTeam.goalsAgainst + homeScore,
          points: awayTeam.points + aPoints
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'matches/teams');
    }
  };

  const metricLabels: Record<string, string> = {
    pace: 'Ritmo',
    shooting: 'Tiro',
    passing: 'Pase',
    dribbling: 'Regate',
    defending: 'Defensa',
    physical: 'Físico'
  };

  const addPlayer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTeamForPlayer) return;
    
    // Check player limit (e.g., 20 players)
    const teamPlayers = players.filter(p => p.teamId === selectedTeamForPlayer);
    if (teamPlayers.length >= 20) {
      return;
    }

    const isRosterLocked = matches.some(m => m.status !== 'scheduled');
    if (isRosterLocked) {
      return;
    }

    const formData = new FormData(e.currentTarget);
    const newPlayer: Partial<Player> = {
      name: formData.get('name') as string,
      lastName: formData.get('lastName') as string,
      cedula: formData.get('cedula') as string,
      nationality: formData.get('nationality') as string,
      birthDate: formData.get('birthDate') as string,
      jerseyNumber: formData.get('jerseyNumber') as string,
      teamId: selectedTeamForPlayer,
      tournamentId: tournament.id,
      position: formData.get('position') as string,
      photoUrl: playerPhotoBase64 || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
      videoUrl: formData.get('videoUrl') as string,
      goals: 0, 
      assists: 0, 
      yellowCards: 0, 
      redCards: 0,
      metrics: {
        pace: parseInt(formData.get('pace') as string) || 60,
        shooting: parseInt(formData.get('shooting') as string) || 60,
        passing: parseInt(formData.get('passing') as string) || 60,
        dribbling: parseInt(formData.get('dribbling') as string) || 60,
        defending: parseInt(formData.get('defending') as string) || 60,
        physical: parseInt(formData.get('physical') as string) || 60,
      }
    };
    try {
      // Use cedula as the document ID if provided
      const playerDocId = (formData.get('cedula') as string) || doc(collection(db, 'temp')).id;
      await setDoc(doc(db, `tournaments/${tournament.id}/players`, playerDocId), newPlayer);
      setIsAddPlayerOpen(false);
      setPlayerPhotoBase64(null);
    } catch (error) { handleFirestoreError(error, OperationType.CREATE, 'players'); }
  };

  const generateFixtures = async () => {
    if (teams.length < 2) {
      return;
    }

    const tournamentTeams = [...teams];
    if (tournamentTeams.length % 2 !== 0) {
      tournamentTeams.push({ id: 'bye', name: 'DESCANSO', points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, tournamentId: tournament.id });
    }

    const numTeams = tournamentTeams.length;
    const numRounds = numTeams - 1;
    const matchesPerRound = numTeams / 2;

    try {
      for (let round = 0; round < numRounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
          const homeIdx = (round + match) % (numTeams - 1);
          let awayIdx = (numTeams - 1 - match + round) % (numTeams - 1);

          if (match === 0) awayIdx = numTeams - 1;

          const homeTeam = tournamentTeams[homeIdx];
          const awayTeam = tournamentTeams[awayIdx];

          if (homeTeam.id !== 'bye' && awayTeam.id !== 'bye') {
            const matchDate = new Date();
            matchDate.setDate(matchDate.getDate() + (round * 7)); // One round per week
            matchDate.setHours(10 + match, 0, 0, 0); // Staggered hours

            await addDoc(collection(db, `tournaments/${tournament.id}/matches`), {
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              date: matchDate.toISOString(),
              round: round + 1,
              status: 'scheduled',
              homeScore: 0,
              awayScore: 0,
              tournamentId: tournament.id
            });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'matches');
    }
  };

  const deletePlayer = async (playerId: string) => {
    const isRosterLocked = matches.some(m => m.status !== 'scheduled');
    if (isRosterLocked) {
      return;
    }

    try {
      await deleteDoc(doc(db, `tournaments/${tournament.id}/players`, playerId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'players');
    }
  };

  const addMatchEvent = async (matchId: string, type: 'goal', playerId: string, teamId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      minute: 0,
      playerId,
      teamId
    };

    const updatedEvents = [...(match.events || []), newEvent];
    
    try {
      await setDoc(doc(db, `tournaments/${tournament.id}/matches/${matchId}`), {
        ...match,
        events: updatedEvents,
        homeScore: teamId === match.homeTeamId ? (match.homeScore || 0) + 1 : match.homeScore,
        awayScore: teamId === match.awayTeamId ? (match.awayScore || 0) + 1 : match.awayScore,
      });
      
      const player = players.find(p => p.id === playerId);
      if (player) {
        await setDoc(doc(db, `tournaments/${tournament.id}/players/${playerId}`), {
          ...player,
          goals: (player.goals || 0) + 1
        });
      }
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, 'match_event'); }
  };

  const getRoundMVP = (round: number) => {
    const roundMatches = matches.filter(m => m.round === round);
    const scorerCounts: Record<string, number> = {};
    
    roundMatches.forEach(m => {
      m.events?.forEach(e => {
        if (e.type === 'goal') {
          scorerCounts[e.playerId] = (scorerCounts[e.playerId] || 0) + 1;
        }
      });
    });

    let mvpId = null;
    let maxGoals = 0;
    for (const [pid, count] of Object.entries(scorerCounts)) {
      if (count > maxGoals) {
        maxGoals = count;
        mvpId = pid;
      }
    }

    return mvpId ? players.find(p => p.id === mvpId) : null;
  };

  const updateMatchLive = async (matchId: string, h: number, a: number, isFinished: boolean) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || match.status === 'finished') return;
    try {
      if (isFinished) {
        await updateMatchScore(matchId, h, a);
      } else {
        await setDoc(doc(db, `tournaments/${tournament.id}/matches/${matchId}`), {
          ...match,
          homeScore: h,
          awayScore: a,
          status: 'live'
        });
      }
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, 'matches'); }
  };

  const exportReport = () => {
    const data = {
      tournament: tournament.name,
      teams: teams.map(t => ({ name: t.name, points: t.points })),
      topScorers: players.slice(0, 5).map(p => ({ name: p.name, goals: p.goals }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tournament.name}_report.json`;
    a.click();
  };

  const [activeTab, setActiveTab] = useState<'standings' | 'fixtures' | 'stats' | 'teams' | 'scouting' | 'awards'>('standings');

  return (
    <motion.div
      key="details"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-[calc(100vh-12rem)]"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <Button variant="secondary" size="icon" onClick={onBack} className="rounded-2xl shrink-0 h-14 w-14 shadow-lg hover:scale-105 transition-transform">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-5xl font-black font-display tracking-tighter uppercase leading-none">{tournament.name}</h1>
              {isOrganizer && (
                <Badge className="gap-1.5 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] py-1 px-3 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> 
                  Control Panel
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground font-medium opacity-80">{tournament.description}</p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          {isOrganizer && (
            <>
              <Button variant="outline" size="icon" onClick={exportReport} title="Exportar Informe" className="h-12 w-12 rounded-xl border-primary/20">
                <Download className="w-5 h-5" />
              </Button>
              <Dialog open={isAddMatchOpen} onOpenChange={setIsAddMatchOpen}>
                <DialogTrigger render={<Button variant="outline" className="gap-2 h-12 px-6 rounded-xl border-primary/20 font-bold uppercase tracking-wider text-xs" />}>
                  <Calendar className="w-4 h-4" />
                  Programar
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Programar Nuevo Partido</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={addMatch} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Local</Label>
                        <Select name="homeTeam" required>
                          <SelectTrigger><SelectValue placeholder="Equipo Local" /></SelectTrigger>
                          <SelectContent>
                            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Visitante</Label>
                        <Select name="awayTeam" required>
                          <SelectTrigger><SelectValue placeholder="Equipo Visitante" /></SelectTrigger>
                          <SelectContent>
                            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fecha y Hora</Label>
                        <Input type="datetime-local" name="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Jornada</Label>
                        <Input type="number" name="round" defaultValue="1" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Programar</Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
            {[
              { id: 'standings', label: 'Clasificación', icon: BarChart3 },
              { id: 'fixtures', label: 'Calendario', icon: Calendar },
              { id: 'stats', label: 'Goleadores', icon: Trophy },
              { id: 'awards', label: 'Premios', icon: Star },
              { id: 'teams', label: 'Equipos', icon: Users },
              { id: 'scouting', label: 'AI Scouting', icon: Sparkles, color: 'text-primary' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 border-transparent",
                  activeTab === item.id 
                    ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/30 border-primary" 
                    : "hover:bg-card hover:border-primary/20 text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className={cn("w-4 h-4", activeTab !== item.id && item.color)} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'standings' && (
                <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-primary/5 bg-primary/5">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-xl font-black uppercase tracking-tighter">Tabla de Posiciones</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Temporada Regular 2024</CardDescription>
                      </div>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="w-[60px] text-center font-black uppercase text-[10px]">Pos</TableHead>
                            <TableHead className="font-black uppercase text-[10px]">Equipo</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px]">PJ</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px]">G</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px]">E</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px]">P</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px]">GF</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px]">GC</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px]">DG</TableHead>
                            <TableHead className="text-center font-black uppercase text-[10px] bg-primary/5 text-primary">PTS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teams.length > 0 ? teams.map((team, index) => (
                            <TableRow key={team.id} className="hover:bg-primary/5 transition-colors border-primary/5">
                              <TableCell className="text-center font-black text-sm">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center mx-auto",
                                  index === 0 ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20" :
                                  index === 1 ? "bg-slate-300 text-slate-700" :
                                  index === 2 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"
                                )}>
                                  {index + 1}
                                </div>
                              </TableCell>
                              <TableCell className="font-bold">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-[10px]">
                                    {team.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  {team.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono">{team.played}</TableCell>
                              <TableCell className="text-center font-mono">{team.won}</TableCell>
                              <TableCell className="text-center font-mono">{team.drawn}</TableCell>
                              <TableCell className="text-center font-mono">{team.lost}</TableCell>
                              <TableCell className="text-center font-mono">{team.goalsFor}</TableCell>
                              <TableCell className="text-center font-mono">{team.goalsAgainst}</TableCell>
                              <TableCell className="text-center font-mono font-bold">{team.goalsFor - team.goalsAgainst}</TableCell>
                              <TableCell className="text-center font-black bg-primary/5 text-primary text-lg">{team.points}</TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                                No hay equipos registrados.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'fixtures' && (
                <div className="space-y-8">
                  {/* MVP Section */}
                  {matches.length > 0 && (
                    <div className="bg-card border-none shadow-2xl rounded-3xl p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                      
                      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                          <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 rotate-3">
                            <Star className="w-6 h-6 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">MVP de la Jornada</h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rendimiento de Élite</p>
                          </div>
                        </div>
                        <Select 
                          value={selectedRoundMVP?.toString() || (matches.length > 0 ? Math.max(...matches.map(m => m.round)).toString() : "")} 
                          onValueChange={(val) => setSelectedRoundMVP(parseInt(val))}
                        >
                          <SelectTrigger className="w-[180px] h-12 rounded-xl border-primary/10 bg-muted/50 font-bold uppercase tracking-widest text-[10px]">
                            <SelectValue placeholder="Seleccionar Fecha" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(new Set(matches.map(m => m.round))).sort((a,b) => b-a).map(r => (
                              <SelectItem key={r} value={r.toString()} className="font-bold uppercase text-[10px]">Jornada {r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(() => {
                        const currentRound = selectedRoundMVP || (matches.length > 0 ? Math.max(...matches.map(m => m.round)) : 1);
                        const mvp = getRoundMVP(currentRound);
                        if (!mvp) return (
                          <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/20">
                            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Esperando resultados...</p>
                          </div>
                        );
                        return (
                          <div className="relative flex flex-col md:flex-row items-center gap-8 bg-primary/5 p-6 rounded-2xl border border-primary/10">
                            <div className="relative">
                              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-primary shadow-2xl rotate-3 group-hover:rotate-0 transition-transform">
                                <img src={mvp.photoUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg">
                                {matches.filter(m => m.round === currentRound).reduce((acc, m) => acc + (m.events?.filter(e => e.type === 'goal' && e.playerId === mvp.id).length || 0), 0)}
                              </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                              <h4 className="text-3xl font-black uppercase tracking-tighter leading-none">{mvp.name} {mvp.lastName}</h4>
                              <p className="text-primary font-black uppercase tracking-widest text-xs mt-1">
                                {teams.find(t => t.id === mvp.teamId)?.name} • {mvp.position}
                              </p>
                              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold uppercase text-[9px] tracking-widest">
                                  Goles en la fecha: {matches.filter(m => m.round === currentRound).reduce((acc, m) => acc + (m.events?.filter(e => e.type === 'goal' && e.playerId === mvp.id).length || 0), 0)}
                                </Badge>
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none font-bold uppercase text-[9px] tracking-widest">
                                  Dorsal #{mvp.jerseyNumber}
                                </Badge>
                              </div>
                            </div>
                            <div className="hidden lg:block">
                              <Trophy className="w-16 h-16 text-primary opacity-10" />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Calendario de Partidos
                      </h2>
                      {isOrganizer && (
                        <Button variant="outline" size="sm" onClick={generateFixtures} className="gap-2 border-primary/20 hover:bg-primary/5">
                          <Sparkles className="w-4 h-4 text-primary" />
                          Generar Calendario Automático
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {matches.length > 0 ? matches.map((match) => (
                    <Card key={match.id} className="overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm">
                      <div className="bg-muted/50 px-4 py-2 flex justify-between items-center text-xs font-medium uppercase tracking-wider">
                        <span>Jornada {match.round}</span>
                        <div className="flex items-center gap-2">
                          {match.status === 'live' && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                          <Badge variant={match.status === 'live' ? 'destructive' : match.status === 'finished' ? 'secondary' : 'outline'} className="text-[10px]">
                            {match.status === 'live' ? 'En Vivo' : match.status === 'finished' ? 'Finalizado' : 'Programado'}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-center gap-4">
                          <div className="flex-1 text-right font-bold text-lg">
                            {teams.find(t => t.id === match.homeTeamId)?.name || 'Local'}
                          </div>
                          <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-lg font-mono text-2xl font-black">
                            <span>{match.homeScore ?? '-'}</span>
                            <span className="text-muted-foreground text-sm">VS</span>
                            <span>{match.awayScore ?? '-'}</span>
                          </div>
                          <div className="flex-1 text-left font-bold text-lg">
                            {teams.find(t => t.id === match.awayTeamId)?.name || 'Visitante'}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-2">
                          <div className="text-center text-xs text-muted-foreground">
                            {new Date(match.date).toLocaleString()}
                          </div>
                          {isOrganizer && match.status !== 'finished' && (
                                <div className="flex gap-2">
                                  <Dialog>
                                    <DialogTrigger render={<Button variant="ghost" size="sm" className="text-xs h-7">Actualizar En Vivo</Button>} />
                                    <DialogContent className="max-w-md">
                                      <DialogHeader><DialogTitle>Marcador en Tiempo Real</DialogTitle></DialogHeader>
                                      <div className="space-y-6">
                                        <div className="flex items-center justify-center gap-8 py-4 bg-muted/30 rounded-xl">
                                          <div className="text-center">
                                            <div className="text-xs font-bold uppercase mb-2">{teams.find(t => t.id === match.homeTeamId)?.name}</div>
                                            <div className="text-4xl font-black">{match.homeScore || 0}</div>
                                          </div>
                                          <span className="text-xl font-bold text-muted-foreground">VS</span>
                                          <div className="text-center">
                                            <div className="text-xs font-bold uppercase mb-2">{teams.find(t => t.id === match.awayTeamId)?.name}</div>
                                            <div className="text-4xl font-black">{match.awayScore || 0}</div>
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          <h4 className="text-sm font-bold flex items-center gap-2">
                                            <Plus className="w-4 h-4" /> Registrar Gol
                                          </h4>
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label className="text-[10px] uppercase">Goleador {teams.find(t => t.id === match.homeTeamId)?.name}</Label>
                                              <Select onValueChange={(val: string) => addMatchEvent(match.id, 'goal', val, match.homeTeamId)}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                <SelectContent>
                                                  {players.filter(p => p.teamId === match.homeTeamId).map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="space-y-2">
                                              <Label className="text-[10px] uppercase">Goleador {teams.find(t => t.id === match.awayTeamId)?.name}</Label>
                                              <Select onValueChange={(val: string) => addMatchEvent(match.id, 'goal', val, match.awayTeamId)}>
                                                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                <SelectContent>
                                                  {players.filter(p => p.teamId === match.awayTeamId).map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                        </div>

                                        <Button 
                                          variant="destructive" 
                                          className="w-full"
                                          onClick={() => updateMatchLive(match.id, match.homeScore || 0, match.awayScore || 0, true)}
                                        >
                                          Finalizar Partido
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-center py-20 border-2 border-dashed rounded-2xl">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <p className="text-muted-foreground">No hay partidos programados.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

              {activeTab === 'stats' && (
                <Card className="border-none shadow-sm bg-card/50">
                  <CardHeader>
                    <CardTitle>Goleadores</CardTitle>
                    <CardDescription>Máximos anotadores del torneo.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Jugador</TableHead>
                          <TableHead>Equipo</TableHead>
                          <TableHead className="text-right">Goles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {players.length > 0 ? players.slice(0, 10).map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>{teams.find(t => t.id === p.teamId)?.name}</TableCell>
                            <TableCell className="text-right font-bold">{p.goals}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                              No hay estadísticas disponibles.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'teams' && (
                <div className="space-y-8">
                  {isOrganizer && (
                    <div className="p-6 border-2 border-dashed rounded-2xl bg-muted/20 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Gestión de Equipos</h3>
                        <p className="text-sm text-muted-foreground">Crea los equipos participantes y luego inscribe a sus jugadores.</p>
                      </div>
                      <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
                        <DialogTrigger render={<Button className="gap-2">
                          <Plus className="w-4 h-4" />
                          Crear Nuevo Equipo
                        </Button>} />
                        <DialogContent>
                          <DialogHeader><DialogTitle>Añadir Equipo al Torneo</DialogTitle></DialogHeader>
                          <form onSubmit={addTeam} className="space-y-4">
                            <div className="space-y-2">
                              <Label>Nombre del Equipo</Label>
                              <Input name="name" placeholder="Ej: Los Galácticos FC" required />
                            </div>
                            <Button type="submit" className="w-full">Registrar Equipo</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team) => (
                      <Card key={team.id} className="overflow-hidden group hover:shadow-md transition-all border-muted/50 bg-card/50">
                        <div className="h-24 bg-muted flex items-center justify-center relative">
                          <div className="w-16 h-16 bg-background rounded-full shadow-sm flex items-center justify-center">
                            <Users className="w-8 h-8 text-primary/40" />
                          </div>
                        </div>
                        <CardContent className="p-4 text-center">
                          <h3 className="font-bold text-lg mb-1">{team.name}</h3>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">
                            {team.played} PJ • {team.points} Puntos
                          </p>
                          
                          {isOrganizer && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary disabled:opacity-50"
                              disabled={isRosterLocked}
                              onClick={() => {
                                setSelectedTeamForPlayer(team.id);
                                setIsAddPlayerOpen(true);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              {isRosterLocked ? 'Inscripciones Cerradas' : 'Inscribir Jugador'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Dialog open={isAddPlayerOpen} onOpenChange={setIsAddPlayerOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Añadir Jugador a {teams.find(t => t.id === selectedTeamForPlayer)?.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={addPlayer} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input name="name" placeholder="Ej: Cristiano" required />
                          </div>
                          <div className="space-y-2">
                            <Label>Apellido</Label>
                            <Input name="lastName" placeholder="Ej: Ronaldo" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Cédula / ID</Label>
                            <Input name="cedula" placeholder="ID único" required />
                          </div>
                          <div className="space-y-2">
                            <Label>Nacionalidad</Label>
                            <Input name="nationality" placeholder="Ej: Colombiano" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Fecha de Nacimiento</Label>
                            <Input type="date" name="birthDate" required />
                          </div>
                          <div className="space-y-2">
                            <Label>Dorsal / Camiseta</Label>
                            <Input type="number" name="jerseyNumber" placeholder="Ej: 10" required />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Posición</Label>
                            <Select name="position" defaultValue="Delantero">
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Portero">Portero</SelectItem>
                                <SelectItem value="Defensa">Defensa</SelectItem>
                                <SelectItem value="Mediocampista">Mediocampista</SelectItem>
                                <SelectItem value="Delantero">Delantero</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Foto del Jugador</Label>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange}
                                className="text-xs"
                              />
                              {playerPhotoBase64 && (
                                <div className="w-10 h-10 rounded-full overflow-hidden border shrink-0">
                                  <img src={playerPhotoBase64} className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Video de Scouting (URL)</Label>
                          <Input name="videoUrl" placeholder="https://youtube.com/..." />
                        </div>
                        <div className="space-y-4 border-t pt-4">
                          <Label className="text-xs font-bold uppercase text-primary">Métricas de Scouting (0-100)</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {Object.entries(metricLabels).map(([key, label]) => (
                              <div key={key} className="space-y-1">
                                <Label className="text-[10px]">{label}</Label>
                                <Input 
                                  type="number" 
                                  name={key} 
                                  min="0" 
                                  max="100" 
                                  defaultValue="75" 
                                  className="h-8 text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button type="submit" className="w-full">Guardar Jugador</Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <div className="mt-12">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Base de Datos de Jugadores & Scouting
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {players.map(player => (
                        <Card key={player.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-card/50">
                          <div className="relative h-48 overflow-hidden">
                            <img 
                              src={player.photoUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                              alt={player.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-4 left-4 right-4">
                              <h4 className="text-white font-bold text-lg">{player.name} {player.lastName}</h4>
                              <p className="text-white/70 text-xs uppercase tracking-wider">{player.position} • {teams.find(t => t.id === player.teamId)?.name}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary" className="bg-white/10 text-white border-none text-[10px]">{player.nationality}</Badge>
                                <Badge variant="secondary" className="bg-white/10 text-white border-none text-[10px]">ID: {player.cedula}</Badge>
                                <Badge variant="secondary" className="bg-primary text-primary-foreground border-none text-[10px] font-bold">#{player.jerseyNumber}</Badge>
                                {(player.redCards > 0 || player.yellowCards >= 3) && (
                                  <Badge variant="destructive" className="animate-pulse text-[10px] font-bold">SUSPENDIDO</Badge>
                                )}
                              </div>
                            </div>
                            <div className="absolute top-4 left-4 flex gap-2">
                              <Dialog>
                                <DialogTrigger render={<Button size="icon" variant="secondary" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 border-none" />}>
                                  <ShieldCheck className="w-4 h-4 text-white" />
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-transparent border-none shadow-2xl">
                                  <div className="relative aspect-[1.6/1] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex gap-6 items-center border-[4px] border-primary/30 rounded-2xl overflow-hidden">
                                    {/* Decorative elements */}
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                                    
                                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary/50 shadow-lg shrink-0">
                                      <img 
                                        src={player.photoUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    
                                    <div className="flex-1 space-y-2 text-white">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{player.name}</h3>
                                          <p className="text-2xl font-black uppercase tracking-tighter text-primary leading-none">{player.lastName}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] font-bold text-white/40 uppercase">Dorsal</p>
                                          <p className="text-2xl font-black text-primary leading-none">#{player.jerseyNumber}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="pt-2 space-y-1">
                                        <div className="flex justify-between border-b border-white/10 pb-1">
                                          <span className="text-[8px] font-bold text-white/40 uppercase">Cédula / ID</span>
                                          <span className="text-[10px] font-mono font-bold">{player.cedula}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-white/10 pb-1">
                                          <span className="text-[8px] font-bold text-white/40 uppercase">Equipo</span>
                                          <span className="text-[10px] font-bold">{teams.find(t => t.id === player.teamId)?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-[8px] font-bold text-white/40 uppercase">Posición</span>
                                          <span className="text-[10px] font-bold">{player.position}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="pt-2 flex justify-between items-center">
                                        <div className="flex items-center gap-1">
                                          <Trophy className="w-3 h-3 text-primary" />
                                          <span className="text-[8px] font-bold uppercase tracking-widest text-white/60">Tornea Official ID</span>
                                        </div>
                                        <div className="w-8 h-8 bg-white rounded-sm p-1">
                                          <div className="w-full h-full bg-black/10 rounded-sm" /> {/* Mock QR */}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-4 bg-background flex justify-center">
                                    <Button size="sm" variant="outline" className="gap-2 rounded-full" onClick={() => window.print()}>
                                      <Download className="w-4 h-4" /> Descargar Carnet
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              {isOrganizer && !isRosterLocked && (
                                <Button 
                                  size="icon" 
                                  variant="destructive" 
                                  className="w-8 h-8 rounded-full bg-red-500/20 backdrop-blur-md hover:bg-red-500/40 border-none"
                                  onClick={() => deletePlayer(player.id)}
                                >
                                  <Plus className="w-4 h-4 text-white rotate-45" />
                                </Button>
                              )}
                            </div>
                            {player.videoUrl && (
                              <a 
                                href={player.videoUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
                              >
                                <Play className="w-5 h-5 text-white fill-white" />
                              </a>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <div className="text-center p-2 bg-muted rounded-lg">
                                <div className="text-xs text-muted-foreground">Goles</div>
                                <div className="font-bold">{player.goals}</div>
                              </div>
                              <div className="text-center p-2 bg-muted rounded-lg">
                                <div className="text-xs text-muted-foreground">Asist.</div>
                                <div className="font-bold">{player.assists}</div>
                              </div>
                              <div className="text-center p-2 bg-muted rounded-lg">
                                <div className="text-xs text-muted-foreground">PJ</div>
                                <div className="font-bold">12</div>
                              </div>
                            </div>
                            
                            {player.metrics && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-muted-foreground">
                                  <span>Métricas de Scouting</span>
                                  <TrendingUp className="w-3 h-3" />
                                </div>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {Object.entries(player.metrics).map(([key, val]) => (
                                      <div key={key} className="space-y-1">
                                        <div className="flex justify-between text-[10px]">
                                          <span className="capitalize">{metricLabels[key] || key}</span>
                                          <span>{val}</span>
                                        </div>
                                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-primary transition-all duration-1000" 
                                            style={{ width: `${val}%` }} 
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

               {activeTab === 'awards' && (
                <div className="space-y-8 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bota de Oro */}
                    <Card className="border-none bg-gradient-to-br from-yellow-500/10 via-background to-background overflow-hidden">
                      <CardHeader className="text-center">
                        <div className="mx-auto bg-yellow-500/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                          <Trophy className="w-10 h-10 text-yellow-500" />
                        </div>
                        <CardTitle className="text-2xl font-display font-black uppercase tracking-tighter">Bota de Oro</CardTitle>
                        <CardDescription>Máximos goleadores del torneo</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[...players].sort((a, b) => b.goals - a.goals).slice(0, 5).map((player, idx) => (
                            <div key={player.id} className={cn(
                              "flex items-center gap-4 p-3 rounded-xl transition-all",
                              idx === 0 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-muted/50"
                            )}>
                              <div className="w-8 h-8 flex items-center justify-center font-black text-lg italic text-muted-foreground">
                                {idx + 1}
                              </div>
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-background shadow-sm">
                                <img src={player.photoUrl || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold leading-none">{player.name} {player.lastName}</p>
                                <p className="text-xs text-muted-foreground">{teams.find(t => t.id === player.teamId)?.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-yellow-600">{player.goals}</p>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Goles</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Guante de Oro / Valla menos vencida */}
                    <Card className="border-none bg-gradient-to-br from-blue-500/10 via-background to-background overflow-hidden">
                      <CardHeader className="text-center">
                        <div className="mx-auto bg-blue-500/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                          <ShieldCheck className="w-10 h-10 text-blue-500" />
                        </div>
                        <CardTitle className="text-2xl font-display font-black uppercase tracking-tighter">Guante de Oro</CardTitle>
                        <CardDescription>Equipos con la valla menos vencida</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[...teams].sort((a, b) => a.goalsAgainst - b.goalsAgainst).slice(0, 5).map((team, idx) => (
                            <div key={team.id} className={cn(
                              "flex items-center gap-4 p-3 rounded-xl transition-all",
                              idx === 0 ? "bg-blue-500/10 border border-blue-500/20" : "bg-muted/50"
                            )}>
                              <div className="w-8 h-8 flex items-center justify-center font-black text-lg italic text-muted-foreground">
                                {idx + 1}
                              </div>
                              <div className="w-12 h-12 rounded-lg bg-white p-1 shadow-sm flex items-center justify-center">
                                {team.logoUrl ? (
                                  <img src={team.logoUrl} className="w-full h-full object-contain" />
                                ) : (
                                  <ShieldCheck className="w-6 h-6 text-muted" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold leading-none">{team.name}</p>
                                <p className="text-xs text-muted-foreground">{team.played} partidos jugados</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-black text-blue-600">{team.goalsAgainst}</p>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Goles Rec.</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'scouting' && (
                <ScoutingTab tournament={tournament} teams={teams} players={players} matches={matches} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Sponsors Section */}
      <div className="mt-24 pt-12 border-t border-primary/10">
        <div className="flex flex-col items-center space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-primary/20" />
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Main Sponsors</h3>
            <div className="h-px w-12 bg-primary/20" />
          </div>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-muted rounded-2xl group-hover:rotate-12 transition-transform" />
                <span className="font-display font-black text-xl tracking-tighter uppercase">SPONSOR {i}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ScoutingTab = ({ tournament, teams, players, matches }: { tournament: Tournament, teams: Team[], players: Player[], matches: Match[] }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `Analiza los datos de este torneo de fútbol llamado "${tournament.name}".
      Equipos: ${teams.map(t => `${t.name} (${t.points} pts)`).join(', ')}.
      Máximos goleadores: ${players.slice(0, 5).map(p => `${p.name} de ${teams.find(t => t.id === p.teamId)?.name} con ${p.goals} goles`).join(', ')}.
      Últimos partidos: ${matches.filter(m => m.status === 'finished').slice(-5).map(m => `${teams.find(t => t.id === m.homeTeamId)?.name} ${m.homeScore} - ${m.awayScore} ${teams.find(t => t.id === m.awayTeamId)?.name}`).join(', ')}.
      
      Por favor genera un informe de scouting inteligente que incluya:
      1. Resumen del estado actual de la liga.
      2. Jugadores destacados (Promesas).
      3. Predicción para el próximo campeón basada en la racha actual.
      4. Recomendaciones tácticas para los equipos que van abajo.
      
      Responde en formato Markdown elegante.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAnalysis(response.text || "No se pudo generar el análisis.");
    } catch (error) {
      console.error("AI Error:", error);
      setAnalysis("Error al conectar con la inteligencia artificial.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
        <div className="bg-primary/10 p-4 rounded-full">
          <BrainCircuit className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold font-display">AI Scouting & Analytics</h2>
        <p className="text-muted-foreground">
          Utiliza nuestra inteligencia artificial para analizar el rendimiento de los jugadores, 
          predecir resultados y descubrir talentos ocultos en tu torneo.
        </p>
        <Button onClick={generateAnalysis} disabled={loading} className="gap-2">
          {loading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Sparkles className="w-4 h-4" />
            </motion.div>
          ) : <Sparkles className="w-4 h-4" />}
          {loading ? "Analizando datos..." : "Generar Informe Inteligente"}
        </Button>
      </div>

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Informe de Scouting
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

