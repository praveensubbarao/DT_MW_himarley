import fs from 'fs';
import path from 'path';
import { SKILL_DIR } from '../shared/constants';
import type { SkillName } from '../shared/types';

export function loadSkills(skillNames: SkillName[]): string {
  const blocks: string[] = [];
  for (const name of skillNames) {
    const skillPath = path.join(SKILL_DIR, name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      blocks.push(`<skill name="${name}">\n[SKILL.md not found at ${skillPath}]\n</skill>`);
      continue;
    }
    const content = fs.readFileSync(skillPath, 'utf8');
    blocks.push(`<skill name="${name}">\n${content}\n</skill>`);
  }
  return blocks.join('\n\n');
}
