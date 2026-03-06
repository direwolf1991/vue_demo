export function parseIso(d: string | null): Date | null {
  if (!d) return null;
  const [y, m, dd] = d.split("-").map(Number);
  if (!y || !m || !dd) return null;
  return new Date(Date.UTC(y, m - 1, dd));
}

export function workingDays(start: string | null, end: string | null): number {
  const da = parseIso(start);
  const db = parseIso(end);
  if (!da || !db || db < da) return 0;
  let days = 0;
  for (let t = da.getTime(); t <= db.getTime(); t += 86400000) {
    const d = new Date(t);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) days++;
  }
  return days;
}

export function isDelayed(row: any): boolean {
  const plannedEnd = parseIso(row.plannedEnd);
  if (!plannedEnd) return false;
  const actualEnd = parseIso(row.actualEnd);
  if (actualEnd) return actualEnd.getTime() > plannedEnd.getTime();
  const today = new Date();
  return today.getTime() > plannedEnd.getTime() && Number(row.progress || 0) < 100;
}

export function delayDays(row: any): number {
  const plannedEnd = parseIso(row.plannedEnd);
  if (!plannedEnd) return 0;
  const baseEnd = parseIso(row.actualEnd) || new Date();
  const diff = Math.floor((baseEnd.getTime() - plannedEnd.getTime()) / 86400000);
  return Math.max(0, diff);
}

export function buildMilestoneIndex(milestones: any[] = [], map = new Map<string, any>()) {
  for (const m of milestones) {
    map.set(String(m.id), m);
    if (m.children?.length) buildMilestoneIndex(m.children, map);
  }
  return map;
}

export function mergeMilestoneNode(t: any, index: Map<string, any>) {
  const orig = index.get(String(t.id));
  const merged: any = orig ? { ...orig } : { id: t.id, tasks: [], owner: "", children: [] };
  merged.id = t.id;
  merged.name = t.name;
  merged.type = t.type;
  merged.plannedStart = t.plannedStart;
  merged.plannedEnd = t.plannedEnd;
  merged.deliverables = Array.isArray(t.deliverables) ? t.deliverables : merged.deliverables;
  merged.deliverable = t.deliverable || merged.deliverable;
  merged.children = (t.children || []).map((c: any) => mergeMilestoneNode(c, index));
  return merged;
}
