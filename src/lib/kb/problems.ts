// One row per problem inside a merged ticket, counted the desk's way (CauseTable): every report is
// counted once, under the cause its tenant and channel give it (causes.ts). The desk's own reading
// (desk-notes.json) marks the reports that are a one-day move, which no parser or hint flip can
// produce: they get a row of their own and stay counted where they are filed.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'unplaced' | 'one-day';

export type ProblemRow = {
  problem: Problem;
  ids: string[];
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // For 'one-day': the causes these reports are filed under, cause → count.
  filedUnder?: Record<string, number>;
};

export type Split = { rows: number; unique: number; merged: number; filed: ProblemRow[]; readAs: ProblemRow[] };

function row(problem: Problem, rs: Report[]): ProblemRow {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    ids: rs.map((r) => r.id).sort(),
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function splitTicket(
  exported: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const merged = uniqueById(exported).filter((r) => r.mergedInto === ticket);
  const filedAs = (r: Report): Problem => causeOf(r, tenantOf(r)) ?? 'unplaced';
  const by = new Map<Problem, Report[]>();
  for (const r of merged) by.set(filedAs(r), [...(by.get(filedAs(r)) ?? []), r]);
  const filed = [...by.entries()].map(([p, rs]) => row(p, rs)).sort((a, b) => b.ids.length - a.ids.length);

  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  const readAs = moved.length
    ? [{ ...row('one-day', moved), filedUnder: moved.reduce<Record<string, number>>((n, r) => ({ ...n, [filedAs(r)]: (n[filedAs(r)] ?? 0) + 1 }), {}) }]
    : [];
  return { rows: exported.length, unique: uniqueById(exported).length, merged: merged.length, filed, readAs };
}
