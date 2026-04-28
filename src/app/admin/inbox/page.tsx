'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, CheckCircle2, XCircle, Clock, Package, MoreVertical, CreditCard, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function AdminInboxPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'pricing'>('requests');
  const [previewProof, setPreviewProof] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    type: 'approve' | 'reject' | 'delete-pkg';
    title: string;
    description: string;
    data?: any;
  } | null>(null);

  // Package Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [benefitInput, setBenefitInput] = useState('');
  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'Personal',
    price_type: 'Monthly',
    price: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_number: '',
    benefits: []
  });

  useEffect(() => {
    let channel: any;

    const init = async () => {
      const userStr = localStorage.getItem('aruneeka_user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      const user = JSON.parse(userStr);
      if (user.role !== 'Superuser' && user.role !== 'developer') {
        router.push('/');
        return;
      }
      setIsAuthorized(true);
      fetchData();

      // Enable Realtime Listener for Inbox with a UNIQUE name per session
      const channelId = `admin-inbox-${Date.now()}`;
      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes', 
          { event: '*', schema: 'public', table: 'v2_agency_inbox' }, 
          () => {
            console.log("Realtime update detected in Inbox!");
            fetchData();
          }
        )
        .subscribe();
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Requests
      const { data: inboxData, error: inboxError } = await supabase
        .from('v2_agency_inbox')
        .select('*, v2_agency_users(full_name, username, avatar_url)')
        .order('created_at', { ascending: false });
      
      if (inboxError) console.error("Inbox permission error:", inboxError.message);
      
      // Fetch Packages
      const { data: pkgData, error: pkgError } = await supabase
        .from('v2_agency_packages')
        .select('*')
        .order('monthly_price', { ascending: true });

      if (pkgError) console.error("Package access error:", pkgError.message);

      if (inboxData) setMessages(inboxData);
      if (pkgData) setPackages(pkgData);
    } catch (e) {
      console.error("System fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string, userId: string, tier: string) => {
    setLoading(true);
    // Get existing message to clear the proof from payload
    const msg = messages.find(m => m.id === id);
    let newPayload = { ...msg.payload };
    
    // Clear the proof to save storage
    if (newPayload.proof) {
       delete newPayload.proof;
       newPayload.proof_deleted = true;
    }

    const { error: inboxError } = await supabase
      .from('v2_agency_inbox')
      .update({ 
        status,
        payload: newPayload 
      })
      .eq('id', id);

    if (status === 'approved') {
      // Get current user data to check existing expiry
      const { data: userData } = await supabase
        .from('v2_agency_users')
        .select('subscription_expiry')
        .eq('id', userId)
        .single();

      let expiryDate = new Date();
      const currentExpiry = userData?.subscription_expiry ? new Date(userData.subscription_expiry) : null;

      if (currentExpiry && currentExpiry > new Date()) {
         // Cumulative: Add 30 days to current future expiry
         expiryDate = new Date(currentExpiry);
         expiryDate.setDate(expiryDate.getDate() + 30);
      } else {
         // Fresh / Expired: 30 days from now
         expiryDate.setDate(expiryDate.getDate() + 30);
      }

      await supabase
        .from('v2_agency_users')
        .update({ 
          subscription_tier: tier.toLowerCase(),
          subscription_expiry: expiryDate.toISOString() 
        })
        .eq('id', userId);
    }
    
    setConfirmAction(null);
    fetchData();
  };

  const handleAddBenefit = () => {
    if (!benefitInput) return;
    setFormData({ ...formData, benefits: [...formData.benefits, benefitInput] });
    setBenefitInput('');
  };

  const removeBenefit = (index: number) => {
    const newBenefits = [...formData.benefits];
    newBenefits.splice(index, 1);
    setFormData({ ...formData, benefits: newBenefits });
  };

  const handleEdit = (pkg: any) => {
    setEditingPackageId(pkg.id);
    let parsedBenefits = [];
    try {
      const raw = pkg.features || '[]';
      parsedBenefits = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(parsedBenefits)) parsedBenefits = [String(raw)];
    } catch(e) { parsedBenefits = [String(pkg.features)]; }

    setFormData({
      name: pkg.name,
      type: pkg.type || 'Personal',
      price_type: pkg.price_type || 'Monthly',
      price: pkg.monthly_price,
      bank_name: pkg.bank_name || '',
      bank_account_name: pkg.bank_account_name || '',
      bank_account_number: pkg.bank_account_number || '',
      benefits: parsedBenefits
    });
    setIsModalOpen(true);
  };

  const handleSavePackage = async () => {
    const payload = {
      name: formData.name,
      type: formData.type,
      price_type: formData.price_type,
      monthly_price: Number(formData.price),
      bank_name: formData.bank_name,
      bank_account_name: formData.bank_account_name,
      bank_account_number: formData.bank_account_number,
      features: JSON.stringify(formData.benefits)
    };

    let error;
    if (editingPackageId) {
      const { error: err } = await supabase.from('v2_agency_packages').update(payload).eq('id', editingPackageId);
      error = err;
    } else {
      const { error: err } = await supabase.from('v2_agency_packages').insert([payload]);
      error = err;
    }

    if (!error) {
      setIsModalOpen(false);
      setEditingPackageId(null);
      setFormData({
        name: '', type: 'Personal', price_type: 'Monthly', price: '', 
        bank_name: '', bank_account_name: '', bank_account_number: '', benefits: []
      });
      fetchData();
    } else {
      alert("Error: " + error.message);
    }
  };

  const handleDuplicate = (pkg: any) => {
    setEditingPackageId(null); // Karena ini paket baru hasil copy
    let parsedBenefits = [];
    try {
      const raw = pkg.features || '[]';
      parsedBenefits = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch(e) { parsedBenefits = [String(pkg.features)]; }

    setFormData({
      name: `${pkg.name} (Copy)`,
      type: pkg.type || 'Personal',
      price_type: pkg.price_type || 'Monthly',
      price: pkg.monthly_price,
      bank_name: pkg.bank_name || '',
      bank_account_name: pkg.bank_account_name || '',
      bank_account_number: pkg.bank_account_number || '',
      benefits: parsedBenefits
    });
    setIsModalOpen(true);
  };

  const handleDeletePackage = async (id: string) => {
    const { error } = await supabase.from('v2_agency_packages').delete().eq('id', id);
    if (!error) {
       setConfirmAction(null);
       fetchData();
    } else alert(error.message);
  };

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFE] pb-20 font-sans">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                localStorage.removeItem('aruneeka_selected_workspace');
                router.push('/');
              }}
              className="w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-amethyst-dark hover:text-white hover:scale-105 transition-all shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
               <Mail size={18} className="text-amethyst-primary" />
               <span className="text-sm font-bold text-slate-700">Inbox center</span>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
             <button 
               onClick={() => setActiveTab('requests')}
               className={`px-6 py-2 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
               Payment requests
             </button>
             <button 
               onClick={() => setActiveTab('pricing')}
               className={`px-6 py-2 rounded-xl text-[11px] font-bold transition-all ${activeTab === 'pricing' ? 'bg-white text-amethyst-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
               Package management
             </button>
          </nav>
        </div>
      </header>

      <main className="px-8 max-w-[1600px] mx-auto mt-12">
        <AnimatePresence mode="wait">
          {activeTab === 'requests' ? (
            <motion.div 
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
               <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Subscription requests</h2>
                  <p className="text-xs text-slate-400 font-medium">{messages.length} total messages</p>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {messages.map((msg: any) => (
                    <div key={msg.id} className="bg-white border border-slate-100 rounded-[32px] p-8 flex items-center justify-between group hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 shadow-inner">
                             {msg.v2_agency_users?.avatar_url ? (
                               <img src={msg.v2_agency_users.avatar_url} className="w-full h-full object-cover" />
                             ) : (
                               <span className="text-slate-300 font-bold">{msg.v2_agency_users?.full_name?.[0]}</span>
                             )}
                          </div>
                          <div className="space-y-1">
                             <div className="flex items-center gap-3">
                                <h3 className="font-bold text-slate-800 tracking-tight">{msg.v2_agency_users?.full_name || 'System User'}</h3>
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                                  msg.status === 'approved' ? 'bg-emerald-50 text-emerald-500' : 
                                  msg.status === 'rejected' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                                }`}>
                                  {msg.status}
                                </span>
                             </div>
                             <p className="text-xs text-slate-400 font-medium max-w-md line-clamp-1">{msg.message}</p>
                             <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                                   <Clock size={12} /> {new Date(msg.created_at).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-amethyst-primary font-bold">
                                   <CreditCard size={12} /> Request for {msg.payload?.tier || 'Pro'}
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-2">
                           {msg.status === "pending" && (
                             <>
                               {msg.payload?.proof && (
                                 <button 
                                   onClick={() => setPreviewProof(msg.payload.proof)}
                                   className="px-6 py-3 bg-white text-amethyst-primary border border-amethyst-primary/20 rounded-2xl font-bold text-[10px] hover:bg-amethyst-primary/5 transition-all"
                                 >
                                   View Proof
                                 </button>
                               )}
                               <button 
                                 onClick={() => setConfirmAction({
                                    id: msg.id,
                                    type: 'approve',
                                    title: 'Approve Request?',
                                    description: 'User ini akan mendapatkan akses langganan dan bukti bayar akan otomatis dihapus.',
                                    data: { userId: msg.user_id, tier: msg.payload?.tier || "pro" }
                                 })}
                                 className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-[10px] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                               >
                                 Approve
                               </button>
                               <button 
                                 onClick={() => setConfirmAction({
                                    id: msg.id,
                                    type: 'reject',
                                    title: 'Reject Request?',
                                    description: 'Permintaan akan ditolak dan bukti bayar akan dihapus demi privasi.',
                                    data: { userId: msg.user_id }
                                 })}
                                 className="px-6 py-3 bg-white text-slate-400 border border-slate-200 rounded-2xl font-bold text-[10px] hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all"
                               >
                                 Reject
                               </button>
                             </>
                           )}

                          <button className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100">
                             <MoreVertical size={16} />
                          </button>
                       </div>
                    </div>
                  ))}
                  
                  {messages.length === 0 && (
                    <div className="py-40 flex flex-col items-center justify-center text-slate-300">
                       <Mail size={64} className="opacity-10 mb-4" />
                       <p className="text-[10px] font-bold uppercase tracking-[0.3em]">No incoming requests</p>
                    </div>
                  )}
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
               <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Package management</h2>
                    <p className="text-xs text-slate-400 font-medium">Configure your service tiers and pricing</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-4 bg-amethyst-primary text-white rounded-[24px] font-bold text-xs shadow-xl shadow-amethyst-primary/20 hover:scale-105 active:scale-95 transition-all">
                    Add new package
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {packages.map((pkg: any) => (
                    <div key={pkg.id} className="bg-white border border-slate-100 rounded-[48px] p-10 flex flex-col justify-between group hover:border-amethyst-primary/30 hover:shadow-2xl hover:shadow-amethyst-primary/10 transition-all duration-700 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-amethyst-light/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                       
                       <div className="space-y-6 relative z-10">
                          <div className="w-14 h-14 bg-amethyst-light/30 text-amethyst-primary rounded-[20px] flex items-center justify-center">
                             <Package size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{pkg.name}</h3>
                             <p className="text-3xl font-black text-amethyst-dark mt-2 tracking-tighter">
                               Rp{Number(pkg.monthly_price).toLocaleString('id-ID')}
                               <span className="text-xs font-bold text-slate-400">
                                 {pkg.type === 'Team' ? '/person/mo' : '/mo'}
                               </span>
                            </p>
                          </div>
                        <div className="space-y-3 pt-6 border-t border-slate-50">
                           {(() => {
                              try {
                                 const rawFeatures = pkg.features || '[]';
                                 const feats = typeof rawFeatures === 'string' ? JSON.parse(rawFeatures) : rawFeatures;
                                 return Array.isArray(feats) ? feats.map((f: string, i: number) => (
                                   <div key={i} className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      {f}
                                   </div>
                                 )) : (
                                   <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      {String(rawFeatures)}
                                   </div>
                                 );
                              } catch (e) {
                                 return (
                                   <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      {String(pkg.features)}
                                   </div>
                                 );
                              }
                           })()}
                        </div>
                       </div>

                       <div className="mt-10 flex flex-col gap-3 relative z-10">
                          <div className="grid grid-cols-2 gap-2">
                             <button 
                               onClick={() => handleEdit(pkg)}
                               className="py-3.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                             >
                                Edit
                             </button>
                             <button 
                               onClick={() => handleDuplicate(pkg)}
                               className="py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-400 hover:bg-amethyst-primary hover:text-white hover:border-amethyst-primary transition-all flex items-center justify-center gap-2"
                             >
                                <Copy size={12} /> Duplicate
                             </button>
                          </div>
                          <button 
                            onClick={() => setConfirmAction({
                              id: pkg.id,
                              type: 'delete-pkg',
                              title: 'Delete Package?',
                              description: 'Paket ini akan dihapus permanen. User yang berlangganan paket ini tidak akan terpengaruh secara langsung.'
                            })}
                            className="w-full py-4 bg-rose-50/50 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                             <Trash2 size={12} /> Delete Package
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Package Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amethyst-light/20 text-amethyst-primary rounded-2xl flex items-center justify-center">
                      <Package size={20} />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-slate-800 tracking-tight">{editingPackageId ? 'Edit Package' : 'Create New Package'}</h3>
                     <p className="text-xs text-slate-400 font-medium">{editingPackageId ? 'Update your tier configuration' : 'Configure tier details and payment info'}</p>
                   </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 flex-1">
                {/* Subscription Type Toggle */}
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subscription Type</label>
                   <div className="flex p-1.5 bg-slate-50 rounded-[20px] border border-slate-100">
                      <button 
                        onClick={() => setFormData({...formData, type: 'Personal', price_type: 'Monthly'})}
                        className={`flex-1 py-3rounded-xl text-[11px] font-bold transition-all py-3 rounded-xl ${formData.type === 'Personal' ? 'bg-white text-amethyst-dark shadow-sm' : 'text-slate-400'}`}
                      >Personal</button>
                      <button 
                        onClick={() => setFormData({...formData, type: 'Team', price_type: 'Per Member'})}
                        className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all py-3 rounded-xl ${formData.type === 'Team' ? 'bg-white text-amethyst-dark shadow-sm' : 'text-slate-400'}`}
                      >Team Subscription</button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Package Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Creator Pro"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl text-[12px] font-bold outline-none focus:bg-white focus:border-amethyst-primary/30 transition-all" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      {formData.type === 'Team' ? 'Price (Per Member/Mo)' : 'Monthly Price'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                      <input 
                        type="number" 
                        placeholder="0"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-transparent rounded-2xl text-[12px] font-bold outline-none focus:bg-white focus:border-amethyst-primary/30 transition-all" 
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div className="p-6 bg-amethyst-primary/5 rounded-[32px] border border-amethyst-primary/10 space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                      <CreditCard size={18} className="text-amethyst-primary" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-amethyst-primary">Rekening Pembayaran</h4>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-bold text-slate-400 ml-1">Nama Bank</label>
                         <input 
                           type="text" placeholder="BCA / Mandiri"
                           value={formData.bank_name}
                           onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                           className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold outline-none focus:border-amethyst-primary/30"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-bold text-slate-400 ml-1">Nomor Rekening</label>
                         <input 
                           type="text" placeholder="000-000-000"
                           value={formData.bank_account_number}
                           onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                           className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold outline-none focus:border-amethyst-primary/30"
                         />
                      </div>
                      <div className="col-span-2 space-y-2">
                         <label className="text-[9px] font-bold text-slate-400 ml-1">Atas Nama (Holder Name)</label>
                         <input 
                           type="text" placeholder="Nama Lengkap Pemilik"
                           value={formData.bank_account_name}
                           onChange={(e) => setFormData({...formData, bank_account_name: e.target.value})}
                           className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold outline-none focus:border-amethyst-primary/30"
                         />
                      </div>
                   </div>
                </div>

                {/* Benefit List Builder */}
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Package Benefits</label>
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       placeholder="Tambah benefit paket..."
                       value={benefitInput}
                       onChange={(e) => setBenefitInput(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAddBenefit()}
                       className="flex-1 px-5 py-4 bg-slate-50 border border-transparent rounded-2xl text-[12px] font-bold outline-none focus:bg-white focus:border-amethyst-primary/30 transition-all" 
                     />
                     <button 
                       onClick={handleAddBenefit}
                       className="px-6 bg-amethyst-dark text-white rounded-2xl font-bold text-xs hover:bg-black transition-all"
                     >Add</button>
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                      {formData.benefits.map((b: string, i: number) => (
                        <div key={i} className="flex items-center justify-between px-5 py-3 bg-slate-50 rounded-xl border border-slate-100 group">
                           <div className="flex items-center gap-3">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              <span className="text-[11px] font-bold text-slate-600">{b}</span>
                           </div>
                           <button onClick={() => removeBenefit(i)} className="text-slate-300 hover:text-rose-500 transition-all"><XCircle size={14} /></button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-[11px] font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                 <button 
                   onClick={handleSavePackage}
                   className="px-10 py-3.5 bg-amethyst-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-amethyst-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                   {editingPackageId ? 'Update Package' : 'Create Package'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Proof Preview Modal */}
      <AnimatePresence>
        {previewProof && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPreviewProof(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] overflow-hidden relative z-10 max-w-2xl w-full shadow-2xl flex flex-col" 
            >
               <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-amethyst-primary/10 text-amethyst-primary rounded-xl flex items-center justify-center"><CreditCard size={18} /></div>
                     <div>
                        <h3 className="font-bold text-slate-800 tracking-tight">Bukti Pembayaran</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Verification</p>
                     </div>
                  </div>
                  <button onClick={() => setPreviewProof(null)} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
               </div>
               <div className="p-10 bg-slate-50/50 flex-1 overflow-auto flex items-center justify-center min-h-[400px]">
                  <img src={previewProof} className="max-w-full rounded-[32px] shadow-2xl border-4 border-white" alt="Payment Proof" />
               </div>
               <div className="p-8 bg-white border-t border-slate-50 flex items-center justify-center gap-4">
                  <a 
                    href={previewProof} 
                    download="aruneeka-payment-proof.png" 
                    className="px-10 py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10" 
                  >
                    Download for Archive
                  </a>
                  <button onClick={() => setPreviewProof(null)} className="px-10 py-5 bg-slate-50 text-slate-400 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Close Preview</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Confirmation Modal */}
      <AnimatePresence>
         {confirmAction && (
            <div className="fixed inset-0 z-[20000] flex items-center justify-center p-6">
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 onClick={() => setConfirmAction(null)}
                 className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center shadow-2xl relative z-10 space-y-8" 
               >
                  <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto shadow-xl ${
                    confirmAction.type === 'approve' ? 'bg-emerald-50 text-emerald-500 shadow-emerald-500/10' : 
                    confirmAction.type === 'reject' ? 'bg-rose-50 text-rose-500 shadow-rose-500/10' : 'bg-amber-50 text-amber-500 shadow-amber-500/10'
                  }`}>
                     {confirmAction.type === 'approve' ? <CheckCircle2 size={32} /> : 
                      confirmAction.type === 'reject' ? <XCircle size={32} /> : <Trash2 size={32} />}
                  </div>
                  
                  <div className="space-y-3">
                     <h3 className="text-2xl font-black text-slate-800 tracking-tight">{confirmAction.title}</h3>
                     <p className="text-xs font-bold text-slate-400 leading-relaxed px-4 italic">
                        "{confirmAction.description}"
                     </p>
                  </div>

                  <div className="flex flex-col gap-3">
                     <button 
                       onClick={() => {
                          if (confirmAction.type === 'approve') handleStatusUpdate(confirmAction.id, 'approved', confirmAction.data.userId, confirmAction.data.tier);
                          else if (confirmAction.type === 'reject') handleStatusUpdate(confirmAction.id, 'rejected', confirmAction.data.userId, '');
                          else if (confirmAction.type === 'delete-pkg') handleDeletePackage(confirmAction.id);
                       }}
                       className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-[2px] shadow-xl transition-all hover:scale-105 active:scale-95 ${
                         confirmAction.type === 'approve' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
                         confirmAction.type === 'reject' ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-amber-500 text-white shadow-amber-500/20'
                       }`}
                     >
                        Confirm Action
                     </button>
                     <button onClick={() => setConfirmAction(null)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                        Maybe Later
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
