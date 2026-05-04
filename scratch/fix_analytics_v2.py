
import sys

path = '/Users/dinurm.pradipta/.gemini/antigravity/scratch/aruneeka-pro/src/components/AruneekaAnalytics.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
found = False
for line in lines:
    new_lines.append(line)
    if 'rel="noreferrer"' in line:
        found = True
        break

if not found:
    print("Could not find marker")
    sys.exit(1)

tail = [
    '                                     className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${item.post_link ? "bg-amethyst-dark text-white hover:bg-black" : "bg-slate-50 text-slate-300 cursor-not-allowed"}`}\n',
    '                                   >\n',
    '                                      <ExternalLink size={16}/>\n',
    '                                   </a>\n',
    '                                </div>\n',
    '                             </td>\n',
    '                          </tr>\n',
    '                       );\n',
    '                    })}\n',
    '                  </tbody>\n',
    '               </table>\n',
    '            </div>\n',
    '            </div>\n',
    '         </motion.div>\n',
    '         </>\n',
    '      )}\n',
    '    </div>\n',
    '  );\n',
    '};\n\n',
    'export default AruneekaAnalytics;\n'
]

with open(path, 'w') as f:
    f.writelines(new_lines + tail)
