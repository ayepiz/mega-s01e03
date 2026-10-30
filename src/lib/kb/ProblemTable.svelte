<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { splitTicket, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';
  import type { Report } from '#lib/kb/causes';

  // issues: where each problem is tracked now, problem → link.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const total = $derived(split.problems.reduce((n, p) => n + p.ids.length, 0));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.merged}</strong> reports merged into #{ticket} ·
  <strong>{split.problems.length}</strong> {split.problems.length === 1 ? 'problem' : 'problems'}
  <span class="muted">({split.rows} export rows, {split.rows - split.unique} repeated)</span>
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>tenants</th><th>seen</th><th>tracked in</th></tr>
  </thead>
  <tbody>
    {#each split.problems as p (p.problem)}
      <tr>
        <td><code>{p.problem}</code></td>
        <td><strong>{p.ids.length}</strong></td>
        <td class="muted">{channels(p.channels)}</td>
        <td>{p.tenants.length}</td>
        <td>{p.firstSeen} → {p.lastSeen}</td>
        <td>{#if issues[p.problem]}<a href={issues[p.problem]}>{issues[p.problem]?.replace(/^.*\/issues\//, 'issue #')}</a>{:else}—{/if}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td><strong>{total}</strong></td><td colspan="4" class:bad={total !== split.merged}>{total === split.merged ? `every report placed once` : `${split.merged - total} reports unaccounted for`}</td></tr>
  </tfoot>
</table>

{#each split.problems.filter((p) => p.problem === 'one-day') as p (p.problem)}
  <p class="muted">one-day moves (desk-notes): {p.ids.join(', ')}</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .bad { color: var(--warn); font-weight: 600; }
  tfoot td { border-bottom: none; }
</style>
