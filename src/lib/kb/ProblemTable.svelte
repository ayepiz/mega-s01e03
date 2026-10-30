<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { splitTicket, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';
  import type { Report } from '#lib/kb/causes';

  // issues: where each problem is tracked now, problem → link.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const placed = $derived(split.filed.reduce((n, p) => n + p.ids.length, 0));
  const list = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
  const issueLabel = (url: string) => url.replace(/^.*\/issues\//, 'issue #');
</script>

<p class="sum">
  <strong>{split.merged}</strong> reports merged into #{ticket} ·
  <strong>{split.filed.length + split.readAs.length}</strong> problems
  <span class="muted">({split.rows} export rows, {split.rows - split.unique} repeated, counted once)</span>
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>tenants</th><th>seen</th><th>tracked in</th></tr>
  </thead>
  <tbody>
    {#each [...split.filed, ...split.readAs] as p (p.problem)}
      <tr class:within={p.filedUnder}>
        <td><code>{p.problem}</code></td>
        <td><strong>{p.ids.length}</strong>{#if p.filedUnder}<span class="muted"> · within {list(p.filedUnder)}</span>{/if}</td>
        <td class="muted">{list(p.channels)}</td>
        <td>{p.tenants.length}</td>
        <td>{p.firstSeen} → {p.lastSeen}</td>
        <td>{#if issues[p.problem]}<a href={issues[p.problem]}>{issueLabel(issues[p.problem] ?? '')}</a>{:else}—{/if}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <td>filed</td><td><strong>{placed}</strong></td>
      <td colspan="4" class:bad={placed !== split.merged}>{placed === split.merged ? 'every report counted once, where its tenant files it' : `${split.merged - placed} reports unaccounted for`}</td>
    </tr>
  </tfoot>
</table>

{#each split.readAs as p (p.problem)}
  <p class="muted">
    {p.ids.length} reports read as a one-day move (desk-notes): {p.ids.join(', ')}. They stay counted under
    {Object.keys(p.filedUnder ?? {}).join(', ')}, where their tenant files them, and are tracked on their own as well.
  </p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .bad { color: var(--warn); font-weight: 600; }
  .within td { background: var(--note-bg); }
  tfoot td { border-bottom: none; }
</style>
