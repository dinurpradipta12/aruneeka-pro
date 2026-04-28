'use client';

import React from 'react';
import AruneekaShell from '@/components/AruneekaShell';
import AruneekaContentPlan from '@/components/AruneekaContentPlan';
import ContentDetailModal from '@/components/ContentDetailModal';
import NewContentWizard from '@/components/NewContentWizard';
import AruneekaMetricsModal from '@/components/AruneekaMetricsModal';
import AruneekaConfirmModal from "@/components/AruneekaConfirmModal";
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/components/AruneekaShell';

export const runtime = 'edge';

export default function ContentPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ profileId?: string }>;
}) {
  const resolvedSearchParams = React.use(searchParams);
  const selectedProfileId = resolvedSearchParams.profileId;

  return (
    <AruneekaShell>
      <ContentManager selectedProfileId={selectedProfileId} />
    </AruneekaShell>
  );
}

interface ContentManagerProps {
  selectedProfileId?: string;
}

const ContentManager = ({ selectedProfileId }: ContentManagerProps) => {
  const { selectedWorkspaceId, subscriptionTier = 'free' } = useWorkspace();
  const [isWizardOpen, setIsWizardOpen] = React.useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = React.useState(false);
  const [selectedContent, setSelectedContent] = React.useState<any>(null);
  const [editingContent, setEditingContent] = React.useState<any>(null);
  const [plans, setPlans] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'list' | 'kanban' | 'calendar'>('list');
  const [deleteModal, setDeleteModal] = React.useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  React.useEffect(() => {
    if (!selectedWorkspaceId) return;
    
    // Panggilan pertama (memunculkan efek loading)
    fetchPlans(false);
 
    // 1. Polling Otomatis (Setiap 5 menit / 300.000 ms)
    const pollingInterval = setInterval(() => {
      fetchPlans(true); // Diam-diam tanpa memicu loading screen
    }, 300000);

    // 2. Refetch on Window Focus (Tarik data cepat saat user kembali ke tab ini)
    const handleFocus = () => {
      fetchPlans(true); 
    };
    window.addEventListener('focus', handleFocus);
 
    return () => {
      clearInterval(pollingInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedProfileId, selectedWorkspaceId]);

  const fetchPlans = async (isSilent = false) => {
    const workspaceId = selectedWorkspaceId;
    if (!workspaceId) return;

    if (!isSilent) setLoading(true);
    let query = supabase
      .from('v2_agency_content_plans')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    if (selectedProfileId) {
      query = query.or(`target_account.eq.${selectedProfileId},target_account.is.null`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (data) setPlans(data);
    if (!isSilent) setLoading(false);
  };

  const sanitizePayload = (data: any) => {
    const userStr = localStorage.getItem('aruneeka_user');
    const user = userStr ? JSON.parse(userStr) : {};
    
    return {
      title: data.title || data.headline || null,
      description: data.description || null,
      platform: data.platform || null,
      content_pillar: data.content_pillar || null,
      target_account: data.target_account || null,
      status: data.status || 'Draft',
      due_date: data.due_date || null,
      script_link: data.script_link || null,
      content_link: data.content_link || null,
      post_link: data.post_link || null,
      workspace_id: selectedWorkspaceId,
      user_id: user.id, author_name: user.full_name || "Team Member"
    };
  };

  const handleSaveContent = async (data: any) => {
    let workspaceId = selectedWorkspaceId;
    
    if (!workspaceId) {
      const savedWs = localStorage.getItem('aruneeka_selected_workspace');
      if (savedWs) workspaceId = JSON.parse(savedWs).id;
    }

    if (!workspaceId) {
      alert("Brand tidak teridentifikasi. Silakan refresh halaman.");
      return;
    }

    const payload = { ...sanitizePayload(data), workspace_id: workspaceId };
    
    if (editingContent) {
      const { error } = await supabase
        .from('v2_agency_content_plans')
        .update(payload)
        .eq('id', editingContent.id)
        .eq('workspace_id', workspaceId); 
      
      if (error) {
        console.error('Update error:', error);
        alert(`Gagal update: ${error.message}`);
      } else {
        fetchPlans(true);
        setEditingContent(null);
      }
    } else {
      const { error } = await supabase
        .from('v2_agency_content_plans')
        .insert([{ ...payload, metrics_updated: false, metrics: {} }]);
      
      if (error) {
        const errStr = JSON.stringify(error, null, 2);
        console.error('Insert error full:', errStr);
        alert(`Gagal simpan:\n${errStr}`);
      } else {
        fetchPlans(true);
      }
    }
    setIsWizardOpen(false);
  };

  const handleDelete = async (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    const workspaceId = selectedWorkspaceId;
    const { error } = await supabase
      .from("v2_agency_content_plans")
      .delete()
      .eq("id", deleteModal.id)
      .eq("workspace_id", workspaceId);

    if (!error) fetchPlans(true);
    setDeleteModal({ isOpen: false, id: null });
  };

  const handleSaveMetrics = async (id: string, metrics: any) => {
    const workspaceId = selectedWorkspaceId;
    const { error } = await supabase
      .from('v2_agency_content_plans')
      .update({ metrics, metrics_updated: true })
      .eq('id', id)
      .eq('workspace_id', workspaceId);
    
    if (error) {
      console.error('Save metrics error:', error);
      alert(`Gagal menyimpan statistik: ${error.message}`);
      return error;
    }
    
    fetchPlans(true);
    return null;
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setPlans(prevPlans => prevPlans.map(p => p.id === id ? { ...p, status: newStatus } : p));
    const workspaceId = selectedWorkspaceId;
    const { error } = await supabase
      .from('v2_agency_content_plans')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('workspace_id', workspaceId);
    if (error) {
      alert(`Gagal update status: ${error.message}`);
      fetchPlans(true);
    }
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    setPlans(prevPlans => prevPlans.map(p => p.id === id ? { ...p, [field]: value } : p));
    const workspaceId = selectedWorkspaceId;
    const { error } = await supabase
      .from('v2_agency_content_plans')
      .update({ [field]: value })
      .eq('id', id)
      .eq('workspace_id', workspaceId);
    if (error) fetchPlans(true);
  };

  return (
    <>
      <AruneekaContentPlan 
        plans={plans} 
        view={activeTab === 'list' ? 'table' : activeTab}
        onViewChange={(v) => setActiveTab(v === 'table' ? 'list' : v)}
        subscriptionTier={subscriptionTier}
        selectedWorkspaceId={selectedWorkspaceId}
        selectedProfileId={selectedProfileId}
        onRefresh={() => fetchPlans(true)}
        onSelectContent={(p) => setSelectedContent(p)}
        onNewContent={() => { setEditingContent(null); setIsWizardOpen(true); }}
        onDelete={handleDelete}
        onEdit={(p) => { setEditingContent(p); setIsWizardOpen(true); }}
        onInsight={(p) => { setSelectedContent(p); setIsMetricsOpen(true); }}
        onStatusChange={handleStatusChange}
        onInlineUpdate={handleInlineUpdate}
      />

      <ContentDetailModal 
        isOpen={!!selectedContent && !isMetricsOpen}
        onClose={() => setSelectedContent(null)}
        content={selectedContent}
        onStatusChange={handleStatusChange}
      />

      <NewContentWizard 
        isOpen={isWizardOpen}
        onClose={() => { setIsWizardOpen(false); setEditingContent(null); }}
        onSave={handleSaveContent}
        editData={editingContent}
        selectedWorkspaceId={selectedWorkspaceId}
        selectedProfileId={selectedProfileId}
      />

      <AruneekaMetricsModal 
        isOpen={isMetricsOpen}
        onClose={() => { setIsMetricsOpen(false); setSelectedContent(null); }}
        onSave={handleSaveMetrics}
        content={selectedContent}
      />

      <AruneekaConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Hapus Konten"
        message="Apakah Anda yakin ingin menghapus konten ini secara permanen? Tindakan ini tidak dapat dibatalkan."
        type="danger"
        confirmText="Hapus Permanen"
      />
    </>
  );
}
