import fs from 'fs';
import path from 'path';

export function writeReport(reportPath: string, content: string): void {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, content, 'utf8');
}
