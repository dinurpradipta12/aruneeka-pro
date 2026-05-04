
import sys

path = '/Users/dinurm.pradipta/.gemini/antigravity/scratch/aruneeka-pro/src/components/AruneekaAnalytics.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Find the point where the render function ends
# The structure should be:
#      )
#   );
# };
# export default AruneekaAnalytics;

new_lines = []
for line in lines:
    if 'cs;' in line:
        continue
    if 'export default AruneekaAnalytics;' in line and len(new_lines) > 0 and 'export default AruneekaAnalytics;' in new_lines[-1]:
        continue
    new_lines.append(line)

# Let's just truncate at a known good point and rebuild the end
# The table ends with </tbody></table>...

final_lines = []
for i, line in enumerate(new_lines):
    final_lines.append(line)
    if '                  </tbody>' in line:
        # We found the end of table body
        # Now find the next few closing tags
        break

# Reconstruct the end
final_lines.append('               </table>\n')
final_lines.append('            </div>\n')
final_lines.append('            </div>\n')
final_lines.append('         </motion.div>\n')
final_lines.append('         </>\n')
final_lines.append('      )}\n')
final_lines.append('    </div>\n')
final_lines.append('  );\n')
final_lines.append('};\n\n')
final_lines.append('export default AruneekaAnalytics;\n')

with open(path, 'w') as f:
    f.writelines(final_lines)
