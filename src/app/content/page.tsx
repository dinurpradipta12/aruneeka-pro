'use client';

import React from 'react';
import AruneekaShell from '@/components/AruneekaShell';
import AruneekaContentPlan from '@/components/AruneekaContentPlan';
import ContentDetailModal from '@/components/ContentDetailModal';
import NewContentWizard from '@/components/NewContentWizard';
import AruneekaMetricsModal from '@/components/AruneekaMetricsModal';
import AruneekaConfirmModal from "@/components/AruneekaConfirmModal";
import { supabase } from '@/lib/supabase';

export default function ContentPage({ selectedProfileId }: { selectedProfileId?: string }) {
  const [isWizardOpen, setIsWizardOpen] = React.useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = React.useState(false);
  const [selectedContent, setSelectedContent] = React.useState<any>(null);
  const [editingContent, setEditingContent] = React.useState<any>(null);
  const [plans, setPlans] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleteModal, setDeleteModal] = React.useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  React.useEffect(() => {
    fetchPlans();

    // Realtime Subscription
    const workspaceId = getWorkspaceId();
    if (workspaceId) {
      const channel = supabase
        .channel(`content_changes_${workspaceId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "v2_agency_content_plans"
          },
          () => {
            fetchPlans();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

  }, [selectedProfileId]);

  const getWorkspaceId = () => {
    const userStr = localStorage.getItem('aruneeka_user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.workspace_id || user.parent_user_id || user.id; // Fallback
  };

  const getUserId = () => {
    const userStr = localStorage.getItem('aruneeka_user');
    return userStr ? JSON.parse(userStr).id : null;
  };

  const fetchPlans = async () => {
    const workspaceId = getWorkspaceId();
    const userId = getUserId();
    if (!workspaceId || !userId) return;

    setLoading(true);
    let query = supabase
      .from('v2_agency_content_plans')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    if (selectedProfileId) {
      query = query.eq('target_account', selectedProfileId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (data) setPlans(data);
    setLoading(false);
  };

  // Only include columns that exist in the v2_agency_content_plans table
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
      workspace_id: user.workspace_id || user.parent_user_id || user.id,
      user_id: user.id, author_name: user.full_name || "Team Member"
    };
  };

  const handleSaveContent = async (data: any) => {
    const payload = sanitizePayload(data);
    const workspaceId = getWorkspaceId();
    
    if (editingContent) {
      const { error } = await supabase
        .from('v2_agency_content_plans')
        .update(payload)
        .eq('id', editingContent.id)
        .eq('workspace_id', workspaceId); // Security check
      
      if (error) {
        console.error('Update error:', error);
        alert(`Gagal update: ${error.message}`);
      } else {
        fetchPlans();
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
        fetchPlans();
      }
    }
    setIsWizardOpen(false);
  };

  const handleDelete = async (id: string) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    const workspaceId = getWorkspaceId();
    const { error } = await supabase
      .from("v2_agency_content_plans")
      .delete()
      .eq("id", deleteModal.id)
      .eq("workspace_id", workspaceId);

    if (!error) fetchPlans();
  };


  const handleSaveMetrics = async (id: string, metrics: any) => {
    const workspaceId = getWorkspaceId();
    const { error } = await supabase
      .from('v2_agency_content_plans')
      .update({ metrics, metrics_updated: true })
      .eq('id', id)
      .eq('workspace_id', workspaceId);
    
    if (!error) fetchPlans();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const workspaceId = getWorkspaceId();
    const { error } = await supabase
      .from('v2_agency_content_plans')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('workspace_id', workspaceId);
    
    if (!error) fetchPlans();
    else alert(`Gagal update status: ${error.message}`);
  };

  const handleInlineUpdate = async (id: string, field: string, value: string) => {
    const workspaceId = getWorkspaceId();
    const { error } = await supabase
      .from('v2_agency_content_plans')
      .update({ [field]: value })
      .eq('id', id)
      .eq('workspace_id', workspaceId);
    if (!error) fetchPlans();
  };

  return (
    <AruneekaShell 
      onNewStrategy={() => { setEditingContent(null); setIsWizardOpen(true); }}
    >
      <AruneekaContentPlan 
        plans={plans} 
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
    </AruneekaShell>
  );
}
 
