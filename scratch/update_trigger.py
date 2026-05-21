import os

file_path = "/Users/dinurm.pradipta/.gemini/antigravity/scratch/aruneeka-pro/src/components/AruneekaShell.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find("const handleAdminAction = async (action: 'approve'")
if start_idx != -1:
    user_idx = content.find("if (type === 'user')", start_idx)
    if user_idx != -1:
        end_idx = content.find("} else {", user_idx)
        old_block = content[user_idx:end_idx]
        print("Found old block:")
        print(repr(old_block))
        
        new_block = """if (type === 'user') {
               const { error } = await supabase.from('v2_agency_users').update({ 
                  status: action === 'approve' ? 'Active' : 'Rejected',
                  is_verified: action === 'approve' ? true : false
               }).eq('id', id);
               if (error) throw error;
               showToast(`User ${action === 'approve' ? 'disetujui' : 'ditolak'}!`, action === 'approve' ? 'success' : 'error');
            }"""
            
        content = content[:user_idx] + new_block + content[end_idx:]
        print("Successfully updated user approval logic dynamically!")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Saved file!")
