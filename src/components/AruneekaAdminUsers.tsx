"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  UserPlus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Filter,
  Clock,
  Calendar,
  Zap,
  Sparkles,
  ChevronRight,
  Package,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

// --- SUB-COMPONENTS FOR ANALYTICS ---

const GrowthChart = ({
  data,
  color,
  maxVal,
}: {
  data: any[];
  color: string;
  maxVal: number;
}) => {
  if (data.length === 0) return null;

  const width = 450;
  const height = 150;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Generate points for the SVG path
  const points = data
    .map((d: any, i: number) => {
      const x = (i / (data.length - 1 || 1)) * chartWidth + paddingLeft;
      const y = paddingTop + chartHeight - (d.value / maxVal) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const colorMap: any = {
    amethyst: "#916DD5",
    emerald: "#10B981",
    indigo: "#6366F1",
  };

  // Y-axis indicators (0, 25%, 50%, 75%, 100%)
  const yIndicators = [
    0,
    Math.ceil(maxVal * 0.25),
    Math.ceil(maxVal * 0.5),
    Math.ceil(maxVal * 0.75),
    maxVal,
  ];

  return (
    <div className="w-full h-[180px] flex items-center justify-center mt-6">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient
            id={`grad-${color}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={colorMap[color]} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colorMap[color]} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-Axis Grid Lines & Indicators */}
        {yIndicators.map((val: number, i: number) => {
          const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
          return (
            <g key={`y-${i}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={paddingLeft - 10}
                y={y}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-[10px] font-black fill-slate-300 tracking-tighter"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Area under the line */}
        <motion.path
          initial={{
            opacity: 0,
            d: `M ${paddingLeft},${paddingTop + chartHeight} ${points
              .split(" ")
              .map(
                (p: any) => p.split(",")[0] + "," + (paddingTop + chartHeight),
              )
              .join(" ")}`,
          }}
          animate={{
            opacity: 1,
            d: `M ${paddingLeft},${paddingTop + chartHeight} ${points} V ${paddingTop + chartHeight} Z`,
          }}
          transition={{ duration: 1, ease: "easeOut" }}
          fill={`url(#grad-${color})`}
        />

        {/* The actual line */}
        <motion.polyline
          fill="none"
          stroke={colorMap[color]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* X-Axis Labels (Date Periods) */}
        {data.map((d: any, i: number) => {
          const x = (i / (data.length - 1 || 1)) * chartWidth + paddingLeft;
          return (
            <text
              key={`x-${i}`}
              x={x}
              y={height - 5}
              textAnchor="middle"
              className="text-[10px] font-black fill-slate-400 uppercase tracking-tighter"
            >
              {d.name}
            </text>
          );
        })}

        {/* Data Points */}
        {data.map((d: any, i: number) => {
          const x = (i / (data.length - 1 || 1)) * chartWidth + paddingLeft;
          const y = paddingTop + chartHeight - (d.value / maxVal) * chartHeight;
          return (
            <g key={`pt-${i}`} className="group/pt">
              <circle
                cx={x}
                cy={y}
                r="10"
                fill="transparent"
                className="cursor-pointer"
              />
              <motion.circle
                cx={x}
                cy={y}
                r="4"
                fill="white"
                stroke={colorMap[color]}
                strokeWidth="2.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 + i * 0.1 }}
              />
              {/* Tooltip on hover (Simulated) */}
              <g className="opacity-0 group-hover/pt:opacity-100 transition-opacity pointer-events-none">
                <rect
                  x={x - 15}
                  y={y - 30}
                  width="30"
                  height="20"
                  rx="6"
                  fill="#1E293B"
                />
                <text
                  x={x}
                  y={y - 16}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-white"
                >
                  {d.value}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const AnalyticsCard = ({ title, value, trend, color, data, maxVal }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const bgColors: any = {
    amethyst: "bg-amethyst-primary/5",
    emerald: "bg-emerald-50",
    indigo: "bg-indigo-50",
  };

  const textColors: any = {
    amethyst: "text-amethyst-primary",
    emerald: "text-emerald-500",
    indigo: "text-indigo-600",
  };

  return (
    <motion.div
      layout
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-white border cursor-pointer group rounded-[32px] p-6 md:p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden relative ${isExpanded ? "ring-2 ring-slate-100" : "border-slate-100"}`}
    >
      <div className="flex items-center justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {title}
          </p>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl md:text-3xl font-black text-slate-800">
              {value}
            </h3>
            <span
              className={`px-2 py-1 ${bgColors[color]} ${textColors[color]} rounded-lg text-[9px] font-black uppercase tracking-widest`}
            >
              {trend}
            </span>
          </div>
        </div>
        <div
          className={`w-10 h-10 md:w-12 md:h-12 ${bgColors[color]} ${textColors[color]} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}
        >
          {title.includes("Active") ? (
            <Zap size={18} className="md:w-5 md:h-5" />
          ) : title.includes("Member") ? (
            <Users size={18} className="md:w-5 md:h-5" />
          ) : (
            <ShieldCheck size={18} className="md:w-5 md:h-5" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="pt-6 border-t border-slate-50 mt-6"
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Growth Trend
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase italic">
                Last {data.length} periods
              </p>
            </div>

            <GrowthChart data={data} color={color} maxVal={maxVal} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-3 md:bottom-4 right-6 md:right-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
          Click to {isExpanded ? "close" : "expand"}
        </span>
        <ArrowUpDown size={10} className="text-slate-300" />
      </div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---

interface AppUser {
  id: string;
  full_name: string;
  username: string;
  role: string;
  status: string;
  workspace_id?: string;
  parent_user_id?: string;
  avatar_url?: string;
  created_at: string;
  subscription_expiry?: string;
  subscription_tier?: string;
  is_verified?: boolean;
}

interface AruneekaAdminUsersProps {
  subscriptionTier?: string;
}

const AruneekaAdminUsers = ({
  subscriptionTier = "free",
}: AruneekaAdminUsersProps) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newExpiry, setNewExpiry] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState<{
    show: boolean;
    type: "delete" | "update";
  }>({ show: false, type: "delete" });
  const [packages, setPackages] = useState<any[]>([]);
  const [packageFilter, setPackageFilter] = useState<string>("all");

  const fetchPackages = async () => {
    const { data, error } = await supabase.from('v2_agency_packages').select('*').order('monthly_price', { ascending: true });
    if (error) console.error("Error fetching packages:", error.message);
    if (data) setPackages(data);
  };

  const getPackageName = (tier: string) => {
    if (!tier || tier === 'free') return 'Free Trial';
    
    // 1. Try to find package where ID or Name matches the tier string
    const pkg = packages.find(p => 
      p.id === tier || 
      p.name === tier ||
      p.name.toLowerCase() === tier.toLowerCase()
    );
    
    if (pkg) return pkg.name;

    // 2. Try partial match
    const partialPkg = packages.find(p => p.name.toLowerCase().includes(tier.toLowerCase()) || tier.toLowerCase().includes(p.name.toLowerCase()));
    if (partialPkg) return partialPkg.name;

    // 3. Fallback to keyword matching for technical IDs (pro/agency)
    const techPkg = packages.find(p => 
      (tier === 'pro' && (p.name.toLowerCase().includes('pro') || p.name.toLowerCase().includes('creator'))) ||
      (tier === 'agency' && p.name.toLowerCase().includes('agency'))
    );

    return techPkg ? techPkg.name : (tier.charAt(0).toUpperCase() + tier.slice(1));
  };

  const handleUpdateTier = async (userId: string, newTier: string) => {
    setIsUpdating(true);
    try {
      const updates: any = { subscription_tier: newTier };
      
      // Automatic Expiry Logic: If upgrading to Pro/Agency, set expiry to +30 days from now
      if (newTier === 'pro' || newTier === 'agency') {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        updates.subscription_expiry = expiry.toISOString();
      } else if (newTier === 'free') {
        updates.subscription_expiry = null;
      }

      const { error } = await supabase
        .from('v2_agency_users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (e: any) {
      alert("Gagal update package: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateExpiry = async () => {
    if (!editingUser || !newExpiry) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("v2_agency_users")
        .update({ subscription_expiry: new Date(newExpiry).toISOString() })
        .eq("id", editingUser.id);

      if (error) throw error;
      fetchUsers();
      setEditingUser(null);
    } catch (e: any) {
      alert("Gagal update: " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // 1. Fetch users
      const { data: userData, error: userError } = await supabase
        .from('v2_agency_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (userError) throw userError;

      // 2. Fetch all workspaces to count ownership locally (more reliable than nested count in some schemas)
      const { data: wsData, error: wsError } = await supabase
        .from('v2_agency_workspaces')
        .select('owner_id');
      
      if (wsError) throw wsError;

      // 3. Map workspace counts to owners
      const wsCounts = wsData.reduce((acc: any, ws: any) => {
        if (ws.owner_id) {
          acc[ws.owner_id] = (acc[ws.owner_id] || 0) + 1;
        }
        return acc;
      }, {});
      
      if (userData) {
        const transformed = userData.map((u: any) => ({
          ...u,
          workspace_count: wsCounts[u.id] || 0
        }));
        
        setUsers(transformed.filter((u: any) => u.status !== 'Pending'));
        setPendingUsers(transformed.filter((u: any) => u.status === 'Pending'));
      }
    } catch (e) {
      console.error("Fetch users error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPackages();
    const userStr = localStorage.getItem("aruneeka_user");
    if (userStr) setCurrentUser(JSON.parse(userStr));

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "v2_agency_users" },
        () => {
          fetchUsers();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      const { error } = await supabase
        .from("v2_agency_users")
        .update({ status: "Active", is_verified: true })
        .eq("id", userId);

      if (error) throw error;
      setPendingUsers((prev: any[]) =>
        prev.filter((u: any) => u.id !== userId),
      );
    } catch (e: any) {
      alert("Gagal menyetujui user: " + e.message);
    } finally {
      setApprovingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const workspaceId = (userToDelete as any).workspace_id;
      const targetUserId = userToDelete.id;

      console.log("Starting Nuclear Scrub for user:", targetUserId);

      // --- PHASE 1: INDIVIDUAL PERSONAL DATA ---
      await supabase
        .from("v2_agency_inbox")
        .delete()
        .eq("user_id", targetUserId);
      await supabase
        .from("v2_agency_workspace_members")
        .delete()
        .eq("user_id", targetUserId);

      // --- PHASE 2: WORKSPACE & DEPENDENCIES ---
      const { data: workspaces } = await supabase
        .from("v2_agency_workspaces")
        .select("id")
        .eq("owner_id", targetUserId);

      if (workspaces && workspaces.length > 0) {
        for (const ws of workspaces) {
          const wsId = ws.id;

          await Promise.all([
            supabase
              .from("v2_agency_content_plans")
              .delete()
              .eq("workspace_id", wsId),
            supabase
              .from("v2_agency_kpi_targets")
              .delete()
              .eq("workspace_id", wsId),
            supabase
              .from("v2_agency_strategy_checklist")
              .delete()
              .eq("workspace_id", wsId),
            supabase
              .from("v2_agency_accounts")
              .delete()
              .eq("workspace_id", wsId),
            supabase
              .from("v2_agency_intelligence")
              .delete()
              .eq("workspace_id", wsId),
            supabase
              .from("v2_agency_social_profiles")
              .delete()
              .eq("workspace_id", wsId),
          ]);

          const { data: squadMembers } = await supabase
            .from("v2_agency_users")
            .select("id")
            .eq("workspace_id", wsId);

          if (squadMembers && squadMembers.length > 0) {
            const memberIds = squadMembers.map((m: any) => m.id);
            await supabase
              .from("v2_agency_inbox")
              .delete()
              .in("user_id", memberIds);
            await supabase
              .from("v2_agency_workspace_members")
              .delete()
              .in("user_id", memberIds);
          }

          const { error: wsDelError } = await supabase
            .from("v2_agency_workspaces")
            .delete()
            .eq("id", wsId);

          if (wsDelError) {
            await supabase
              .from("v2_agency_workspaces")
              .update({ owner_id: null })
              .eq("id", wsId);
          }
        }
      }

      // --- PHASE 3: FINAL SQUAD & USER PURGE ---
      if (workspaceId) {
        const { error: finalUsersError } = await supabase
          .from("v2_agency_users")
          .delete()
          .eq("workspace_id", workspaceId);

        if (finalUsersError) {
          await supabase
            .from("v2_agency_users")
            .delete()
            .eq("id", targetUserId);
        }

        setUsers((prev: any[]) =>
          prev.filter((u: any) => (u as any).workspace_id !== workspaceId),
        );
      } else {
        const { error: finalUserError } = await supabase
          .from("v2_agency_users")
          .delete()
          .eq("id", targetUserId);

        if (finalUserError) throw finalUserError;
        setUsers((prev: any[]) =>
          prev.filter((u: any) => u.id !== targetUserId),
        );
      }

      setShowDeleteConfirm(false);
      setUserToDelete(null);
      setShowSuccessModal({ show: true, type: "delete" });

      setTimeout(
        () => setShowSuccessModal({ show: false, type: "delete" }),
        3000,
      );
    } catch (e: any) {
      alert("Gagal menghapus total: " + e.message);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const filteredUsers = users.filter((u: any) => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (packageFilter === "all") return matchesSearch;
    
    const userTier = u.subscription_tier || "free";
    if (packageFilter === "free") return matchesSearch && (userTier === "free" || userTier.toLowerCase().includes("trial"));
    
    return matchesSearch && userTier === packageFilter;
  });

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "Superuser":
        return "bg-black text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest";
      case "Admin":
        return "bg-amethyst-primary/10 text-amethyst-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amethyst-primary/20";
      case "developer":
        return "bg-amethyst-primary text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest";
      default:
        return "bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest";
    }
  };

  const storedUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("aruneeka_user") || "{}")
      : {};
  const isDevOrSuper =
    currentUser?.role === "developer" ||
    currentUser?.role === "Superuser" ||
    storedUser?.role === "developer" ||
    storedUser?.role === "Superuser";
  const isMasterAccount =
    currentUser?.username === "arunika" || storedUser?.username === "arunika";

  if (!isDevOrSuper && !isMasterAccount) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-inner">
          <ShieldCheck size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            Access Restricted
          </h3>
          <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
            Halaman User Management bersifat global dan sangat sensitif. Hanya
            akun dengan kasta{" "}
            <span className="text-amethyst-primary font-bold">developer</span>{" "}
            yang diizinkan melakukan verifikasi populasi user.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Stats */}
      <div className="flex flex-col gap-8 md:gap-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-amethyst-primary">
              <ShieldCheck size={18} className="md:w-5 md:h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                System Administration
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
              User Management
            </h2>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
            <Clock size={14} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Real-time Sync Active
            </span>
          </div>
        </div>

        {/* INTERACTIVE ANALYTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(() => {
            const activeUsers = users.filter((u: any) => u.status === "Active");
            const invitedMembers = users.filter(
              (u: any) => u.role === "Member",
            );
            const totalPop = users.length + pendingUsers.length;

            const getGrowthData = () => {
              const periods: { [key: string]: number } = {};
              const sortedUsers = [...users, ...pendingUsers].sort(
                (a: any, b: any) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              );

              sortedUsers.forEach((u: any) => {
                const date = new Date(u.created_at);
                const period = `${date.getDate()}/${date.toLocaleString("default", { month: "short" })}`;
                periods[period] = (periods[period] || 0) + 1;
              });

              const result = Object.entries(periods).map(
                ([name, value]: [string, any]) => ({ name, value }),
              );
              if (result.length === 1)
                return [{ name: "", value: 0 }, ...result];
              return result;
            };

            const chartData = getGrowthData();
            const maxVal = Math.max(...chartData.map((d: any) => d.value), 5);

            return (
              <>
                <AnalyticsCard
                  title="Total Population"
                  value={totalPop}
                  trend="+12%"
                  color="indigo"
                  data={chartData}
                  maxVal={maxVal}
                />
                <AnalyticsCard
                  title="Active Now"
                  value={activeUsers.length}
                  trend="Live"
                  color="emerald"
                  data={chartData}
                  maxVal={maxVal}
                />
                <AnalyticsCard
                  title="Invited Members"
                  value={invitedMembers.length}
                  trend="Team"
                  color="amethyst"
                  data={chartData}
                  maxVal={maxVal}
                />
              </>
            );
          })()}
        </div>
      </div>

      {/* WAITING LIST / APPROVAL QUEUE */}
      <AnimatePresence>
        {pendingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-2 text-amber-500">
                <Clock className="animate-pulse" size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  Antrean Persetujuan ({pendingUsers.length})
                </span>
              </div>
              <div className="h-px bg-amber-100 flex-1 mx-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingUsers.map((pUser: any) => (
                <motion.div
                  layout
                  key={pUser.id}
                  className="bg-amber-50 border border-amber-100 rounded-[32px] p-6 flex flex-col justify-between gap-4 group hover:shadow-lg hover:shadow-amber-500/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {pUser.avatar_url ? (
                      <img
                        src={pUser.avatar_url}
                        alt={pUser.full_name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 font-black shadow-sm border border-amber-200">
                        {pUser.full_name?.[0] || "U"}
                      </div>
                    )}
                    <div>
                      <p className="font-black text-slate-800 text-sm tracking-tight">
                        {pUser.full_name}
                      </p>
                      <p className="text-[10px] text-amber-600 font-bold opacity-70 italic">
                        @{pUser.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(pUser.id)}
                      disabled={approvingId === pUser.id}
                      className="flex-1 py-3 bg-white text-emerald-500 border border-emerald-100 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {approvingId === pUser.id ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              ease: "linear",
                            }}
                          >
                            <Clock size={12} />
                          </motion.div>
                          Processing...
                        </>
                      ) : (
                        "Approve"
                      )}
                    </button>
                    <button className="px-4 py-3 bg-white text-slate-400 border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all">
                      Ignore
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search
            size={16}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 text-xs font-bold text-slate-800 outline-none focus:ring-2 ring-amethyst-light/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all">
            <Filter size={18} />
          </button>
          {users.length + pendingUsers.length >= 2 &&
          subscriptionTier === "free" &&
          !(
            currentUser?.role === "Superuser" ||
            currentUser?.role === "developer"
          ) ? (
            <button
              onClick={() =>
                alert(
                  "limit 2 users reached. upgrade to pro to invite more team members.",
                )
              }
              className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-bold text-[10px] tracking-tight border border-slate-200 cursor-not-allowed"
            >
              <ShieldCheck size={16} /> Upgrade to invite more
            </button>
          ) : (
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-amethyst-dark text-white rounded-2xl font-bold text-[10px] tracking-tight hover:bg-black transition-all shadow-lg shadow-amethyst-dark/20">
              <UserPlus size={16} /> Register new user
            </button>
          )}
        </div>
      </div>

      {/* Package Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
         <button 
           onClick={() => setPackageFilter('all')}
           className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${packageFilter === 'all' ? 'bg-amethyst-primary text-white shadow-lg shadow-amethyst-primary/20' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
         >
            All Users ({users.length})
         </button>
         <button 
           onClick={() => setPackageFilter('free')}
           className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${packageFilter === 'free' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
         >
            Free Trial ({users.filter((u:any) => !u.subscription_tier || u.subscription_tier === 'free' || u.subscription_tier.toLowerCase().includes('trial')).length})
         </button>
         {packages.map((pkg: any) => {
            const count = users.filter((u: any) => u.subscription_tier === pkg.name).length;
            return (
               <button 
                 key={pkg.id}
                 onClick={() => setPackageFilter(pkg.name)}
                 className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${packageFilter === pkg.name ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
               >
                  {pkg.name} ({count})
               </button>
            );
         })}
      </div>

      {/* Data Table / Mobile List */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-[40px] border border-slate-100 shadow-premium overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6">User Profile</th>
                <th className="px-8 py-6">System Role</th>
                <th className="px-8 py-6">Active Package</th>
                <th className="px-8 py-6">Subscription Period</th>
                <th className="px-8 py-6">Usage Health</th>
                <th className="px-8 py-6 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user: any) => {
                const expiryDate = user.subscription_expiry
                  ? new Date(user.subscription_expiry)
                  : null;
                const isUnlimited =
                  user.role === "Superuser" ||
                  user.role === "developer";
                const expiryStr = isUnlimited
                  ? "Never"
                  : expiryDate
                    ? expiryDate.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "None";
                return (
                  <motion.tr
                    layout
                    key={user.id}
                    className="hover:bg-slate-50/30 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-amethyst-light/20 flex items-center justify-center text-amethyst-dark font-black text-lg border border-amethyst-light/10 shadow-inner">
                            {user.full_name?.charAt(0) ||
                              user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800 tracking-tight">
                              {user.full_name || "Anonymous User"}
                            </p>
                            {user.parent_user_id && (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-md text-[7px] font-black uppercase tracking-widest border border-indigo-100">
                                Invited
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-bold tracking-tight">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={getRoleStyle(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      {isUnlimited ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border bg-black text-white border-black transition-all">
                          <ShieldCheck size={12} className="animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            System Master
                          </span>
                        </div>
                      ) : (
                        <select
                          value={user.subscription_tier || "free"}
                          onChange={(e) =>
                            handleUpdateTier(user.id, e.target.value)
                          }
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer hover:shadow-md appearance-none pr-8 relative bg-no-repeat bg-[right_12px_center] ${
                            (user.subscription_tier?.toLowerCase().includes("agency") || user.subscription_tier?.toLowerCase().includes("team")) 
                              ? "bg-amethyst-primary/10 border-amethyst-primary/20 text-amethyst-primary" 
                              : (user.subscription_tier?.toLowerCase().includes("pro") || user.subscription_tier?.toLowerCase().includes("creator") || user.subscription_tier?.toLowerCase().includes("single")) 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                : "bg-slate-50 border-slate-100 text-slate-400"
                          }`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/xml' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                            backgroundSize: "12px",
                          }}
                        >
                          <option value="free">Free Trial</option>
                          {packages.map((pkg: any) => (
                             <option key={pkg.id} value={pkg.name}>
                                {pkg.name}
                             </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-8 py-6">
                              <div className="flex flex-col gap-1 group/expiry">
                                 <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black text-slate-800 tracking-tight">
                                       {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <ChevronRight size={10} className="text-slate-300" />
                                    <span className={`text-[11px] font-black tracking-tight ${expiryDate && expiryDate < new Date() ? 'text-rose-500' : 'text-amethyst-primary'}`}>
                                       {expiryStr}
                                    </span>
                                    {!isUnlimited && (
                                       <button 
                                          onClick={() => {
                                             setEditingUser(user);
                                             setNewExpiry(user.subscription_expiry ? user.subscription_expiry.split('T')[0] : '');
                                          }}
                                          className="p-1 bg-slate-50 text-slate-300 rounded-md hover:bg-amethyst-primary/10 hover:text-amethyst-primary transition-all opacity-0 group-hover/expiry:opacity-100"
                                       >
                                          <Edit3 size={10} />
                                       </button>
                                    )}
                                 </div>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                                    Registration to Expiry
                                 </p>
                              </div>
                    </td>
                                        <td className="px-8 py-6">
                              {(() => {
                                 const count = user.workspace_count || 0;
                                 const tier = user.subscription_tier || 'free';
                                 
                                 // Define limits (Example)
                                 const limits: any = { free: 1, pro: 5, agency: 10 };
                                 const isWarning = !isUnlimited && tier !== 'agency' && count > (limits[tier] || 1);
                                 
                                 return (
                                    <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${isWarning ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                       <Activity size={14} className={isWarning ? 'animate-pulse' : ''} />
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-black uppercase tracking-widest">
                                             {count} Workspace{count > 1 ? 's' : ''}
                                          </span>
                                          <span className="text-[8px] font-bold opacity-60 uppercase">
                                             {isWarning ? 'Limit Warning' : 'Optimal Usage'}
                                          </span>
                                       </div>
                                    </div>
                                 );
                              })()}
                           </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-3 text-slate-300 hover:text-amethyst-primary transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-4">
          {filteredUsers.map((user: any) => (
            <motion.div
              layout
              key={user.id}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-amethyst-light/20 flex items-center justify-center text-amethyst-dark font-black text-lg">
                      {user.full_name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-slate-800 text-base tracking-tight">
                        {user.full_name || "Anonymous"}
                      </p>
                      {user.parent_user_id && (
                        <div className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-md text-[7px] font-black uppercase">
                          Invited
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold italic">
                      @{user.username}
                    </p>
                  </div>
                </div>
                <button className="p-3 bg-slate-50 text-slate-300 rounded-xl">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Role
                  </p>
                  <span className={getRoleStyle(user.role)}>{user.role}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Usage
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-700 uppercase">
                    <Activity size={12} className="text-emerald-500" />
                    {user.workspace_count || 0} Workspaces
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Package size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Plan
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-amethyst-primary uppercase tracking-widest">
                    {getPackageName(user.subscription_tier)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Subscription Period
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[9px] font-bold text-slate-400">
                        {new Date(user.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <ChevronRight size={8} className="text-slate-300" />
                      <p className="text-[10px] font-black text-amethyst-primary italic">
                        {user.subscription_expiry
                          ? new Date(user.subscription_expiry).toLocaleDateString(
                              "id-ID",
                              { day: "numeric", month: "short" },
                            )
                          : "Never"}
                      </p>
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setNewExpiry(
                            user.subscription_expiry
                              ? user.subscription_expiry.split("T")[0]
                              : "",
                          );
                        }}
                        className="p-1.5 bg-slate-100 text-slate-400 rounded-lg"
                      >
                        <Edit3 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Manual Expiry Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative z-10 space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amethyst-primary/10 text-amethyst-primary rounded-[24px] flex items-center justify-center mx-auto mb-4">
                  <Calendar size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                  Adjust Expiry Date
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                  Manual override for {editingUser.full_name}
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    New Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-black outline-none focus:ring-4 ring-amethyst-primary/10 transition-all text-slate-800"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleUpdateExpiry}
                  disabled={isUpdating}
                  className="w-full py-5 bg-amethyst-primary text-white rounded-[24px] font-black text-xs uppercase tracking-[2px] shadow-xl shadow-amethyst-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Apply Changes"}
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="w-full py-5 bg-slate-50 text-slate-400 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AruneekaAdminUsers;
