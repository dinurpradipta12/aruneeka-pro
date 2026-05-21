import os

file_path = "/Users/dinurm.pradipta/.gemini/antigravity/scratch/aruneeka-pro/src/components/AruneekaShell.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the specific syntax error
if "}} else {\n              // Subscription Approval logic" in content:
    content = content.replace(
        "}} else {\n              // Subscription Approval logic", 
        "} else {\n              // Subscription Approval logic"
    )
    print("Fixed brace error!")
else:
    # Let's do a more robust find and replace for line 621
    # Find the line that has exactly "}} else {"
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if "}} else {" in line:
            lines[i] = line.replace("}} else {", "} else {")
            print(f"Fixed brace error on line {i+1}!")
            break
    content = '\n'.join(lines)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("File saved successfully.")
