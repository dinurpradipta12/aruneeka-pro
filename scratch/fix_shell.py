
path = '/Users/dinurm.pradipta/.gemini/antigravity/scratch/aruneeka-pro/src/components/AruneekaShell.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if 'const showToast = (message: string, type: any = \'success\') => {' in line:
        new_lines.append('\n')
        new_lines.append('   const openDetail = (content: any) => {\n')
        new_lines.append('      setSelectedContent(content);\n')
        new_lines.append('      setIsDetailOpen(true);\n')
        new_lines.append('   };\n')
        new_lines.append('\n')
        new_lines.append('   const openMetrics = (content: any) => {\n')
        new_lines.append('      setSelectedContent(content);\n')
        new_lines.append('      setIsMetricsOpen(true);\n')
        new_lines.append('   };\n')

with open(path, 'w') as f:
    f.writelines(new_lines)
