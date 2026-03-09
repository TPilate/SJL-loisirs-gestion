<script setup lang="ts">
import type { ITournament, ITeam, IPool, IMatch } from '~/types/tournament'
import type { IPlayer } from '~/types/player'

definePageMeta({ middleware: 'admin' })

const route = useRoute()
const toast = useToast()
const id = route.params.id as string

const { data: tournament, refresh } = await useFetch<ITournament>(`/api/tournaments/${id}`)
const { data: allPlayers } = await useFetch<IPlayer[]>('/api/players')

if (!tournament.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tournoi introuvable' })
}

// ─── State ────────────────────────────────────────────────────────────────────

const activeTab = ref<'teams' | 'pools'>('teams')
const isSaving = ref(false)

// Helper: save partial tournament update to API
async function save(patch: Partial<ITournament>) {
  isSaving.value = true
  try {
    const updated = await $fetch<ITournament>(`/api/tournaments/${id}`, {
      method: 'PUT',
      body: patch,
    })
    if (tournament.value) Object.assign(tournament.value, updated)
    return true
  } catch {
    toast.add({ title: 'Erreur', description: 'Sauvegarde impossible.', color: 'error' })
    return false
  } finally {
    isSaving.value = false
  }
}

// ─── Helpers: Teams ───────────────────────────────────────────────────────────

const teams = computed(() => tournament.value?.teams ?? [])
const pools = computed(() => tournament.value?.pools ?? [])
const tournamentStatus = computed(() => tournament.value?.status ?? 'draft')

function teamById(id: string) {
  return teams.value.find(t => t._id === id)
}

function playerById(pid: string) {
  return allPlayers.value?.find(p => p._id === pid)
}

function playerDisplayName(pid: string) {
  const p = playerById(pid)
  if (!p) return '?'
  return `${p.firstName ? p.firstName + ' ' : ''}${p.name}`
}

// ─── Team modal ───────────────────────────────────────────────────────────────

const teamModalOpen = ref(false)
const editingTeamId = ref<string | null>(null)
const teamForm = reactive({ name: '', playerIds: [] as string[] })
const playerSearch = ref('')

const teamModalTitle = computed(() => editingTeamId.value ? 'Modifier l\'équipe' : 'Nouvelle équipe')

const availablePlayers = computed(() => {
  if (!allPlayers.value) return []
  const q = playerSearch.value.toLowerCase()
  if (!q) return allPlayers.value
  return allPlayers.value.filter(p => {
    const name = `${p.firstName} ${p.name}`.toLowerCase()
    return name.includes(q)
  })
})

function openCreateTeam() {
  editingTeamId.value = null
  teamForm.name = ''
  teamForm.playerIds = []
  playerSearch.value = ''
  teamModalOpen.value = true
}

function openEditTeam(team: ITeam) {
  editingTeamId.value = team._id
  teamForm.name = team.name
  teamForm.playerIds = [...team.playerIds]
  playerSearch.value = ''
  teamModalOpen.value = true
}

function togglePlayer(pid: string) {
  const idx = teamForm.playerIds.indexOf(pid)
  if (idx >= 0) {
    teamForm.playerIds.splice(idx, 1)
  } else {
    if (teamForm.playerIds.length >= 6) {
      toast.add({ title: 'Limite atteinte', description: 'Maximum 6 joueurs par équipe.', color: 'warning' })
      return
    }
    teamForm.playerIds.push(pid)
  }
}

async function saveTeam() {
  if (!teamForm.name.trim()) {
    toast.add({ title: 'Validation', description: 'Le nom de l\'équipe est requis.', color: 'error' })
    return
  }
  const updatedTeams = [...teams.value.map(t => ({ ...t, playerIds: [...t.playerIds] }))]
  if (editingTeamId.value) {
    const idx = updatedTeams.findIndex(t => t._id === editingTeamId.value)
    if (idx >= 0) {
      const existing = updatedTeams[idx]!
      updatedTeams[idx] = { ...existing, name: teamForm.name, playerIds: [...teamForm.playerIds] }
    }
  } else {
    updatedTeams.push({ name: teamForm.name, playerIds: [...teamForm.playerIds] } as unknown as ITeam)
  }
  const ok = await save({ teams: updatedTeams as ITournament['teams'] })
  if (ok) {
    teamModalOpen.value = false
    toast.add({
      title: editingTeamId.value ? 'Équipe modifiée' : 'Équipe créée',
      description: `${teamForm.name} ${editingTeamId.value ? 'mise à jour' : 'ajoutée au tournoi'}.`,
      color: 'success',
    })
    await refresh()
  }
}

const deletingTeamId = ref<string | null>(null)

async function deleteTeam(team: ITeam) {
  deletingTeamId.value = team._id
  const updatedTeams = teams.value.filter(t => t._id !== team._id)
  // also remove from pools
  const updatedPools = pools.value.map(p => ({
    ...p,
    teamIds: p.teamIds.filter(tid => tid !== team._id),
    matches: p.matches.filter(m => m.teamAId !== team._id && m.teamBId !== team._id),
  }))
  const ok = await save({ teams: updatedTeams as ITournament['teams'], pools: updatedPools as ITournament['pools'] })
  if (ok) {
    toast.add({ title: 'Équipe supprimée', description: `${team.name} retirée.`, color: 'warning' })
    await refresh()
  }
  deletingTeamId.value = null
}

// ─── Pool generation ──────────────────────────────────────────────────────────

function generatePools() {
  if (!tournament.value) return
  const teamsPerPool = tournament.value.teamsPerPool
  const shuffled = [...teams.value].sort(() => Math.random() - 0.5)
  const newPools: Partial<IPool>[] = []
  let poolIdx = 0
  let currentPool: Partial<IPool> | null = null

  for (const team of shuffled) {
    if (!currentPool || (currentPool.teamIds?.length ?? 0) >= teamsPerPool) {
      poolIdx++
      currentPool = { name: `Poule ${poolIdx}`, teamIds: [], matches: [] }
      newPools.push(currentPool)
    }
    currentPool.teamIds!.push(team._id)
  }

  return newPools
}

async function applyGeneratePools() {
  if (!teams.value.length) {
    toast.add({ title: 'Impossible', description: 'Ajoutez des équipes avant de générer les poules.', color: 'warning' })
    return
  }
  const newPools = generatePools()
  const ok = await save({ pools: newPools as ITournament['pools'] })
  if (ok) {
    toast.add({ title: 'Poules générées', description: 'Les équipes ont été réparties aléatoirement.', color: 'success' })
    await refresh()
  }
}

// ─── Move team between pools ──────────────────────────────────────────────────

async function moveTeamToPool(teamId: string, fromPoolId: string, toPoolId: string) {
  const updatedPools = pools.value.map(p => ({ ...p, teamIds: [...p.teamIds] }))
  const from = updatedPools.find(p => p._id === fromPoolId)
  const to = updatedPools.find(p => p._id === toPoolId)
  if (!from || !to) return
  from.teamIds = from.teamIds.filter(tid => tid !== teamId)
  if (!to.teamIds.includes(teamId)) to.teamIds.push(teamId)
  // Remove matches involving this team from 'from' pool
  if ((from as IPool).matches) {
    (from as IPool).matches = (from as IPool).matches.filter(m => m.teamAId !== teamId && m.teamBId !== teamId)
  }
  await save({ pools: updatedPools as ITournament['pools'] })
  await refresh()
}

// ─── Launch tournament ────────────────────────────────────────────────────────

async function launchTournament() {
  if (!tournament.value) return
  if (!teams.value.length) {
    toast.add({ title: 'Impossible', description: 'Ajoutez des équipes avant de lancer le tournoi.', color: 'warning' })
    return
  }

  let currentPools = pools.value.map(p => ({ ...p, teamIds: [...p.teamIds], matches: [...(p.matches ?? [])] }))

  // Auto-generate pools if none yet
  if (!currentPools.length) {
    currentPools = generatePools()! as IPool[]
  }

  // Generate match schedule for each pool (round-robin)
  const setsToWin = tournament.value.matchFormat.setsToWin
  const poolsWithMatches = currentPools.map(pool => {
    const tids = [...pool.teamIds]
    const matches: Partial<IMatch>[] = []
    for (let i = 0; i < tids.length; i++) {
      for (let j = i + 1; j < tids.length; j++) {
        matches.push({
          _id: '',
          teamAId: tids[i],
          teamBId: tids[j],
          sets: Array.from({ length: setsToWin * 2 - 1 }, () => ({ scoreA: 0, scoreB: 0 })),
          status: 'pending',
        })
      }
    }
    return { ...pool, matches }
  }) as IPool[]

  const ok = await save({ status: 'active', pools: poolsWithMatches as ITournament['pools'] })
  if (ok) {
    toast.add({ title: 'Tournoi lancé !', description: 'Les poules et les matchs sont générés.', color: 'success' })
    activeTab.value = 'pools'
    await refresh()
  }
}

// ─── Match scoring ────────────────────────────────────────────────────────────

const matchModalOpen = ref(false)
const editingPoolId = ref('')
const editingMatch = ref<IMatch | null>(null)
const matchSets = ref<{ scoreA: number; scoreB: number }[]>([])

function openMatchScore(poolId: string, match: IMatch) {
  editingPoolId.value = poolId
  editingMatch.value = match
  matchSets.value = match.sets.length
    ? match.sets.map(s => ({ ...s }))
    : [{ scoreA: 0, scoreB: 0 }]
  matchModalOpen.value = true
}

function addSet() {
  if (!tournament.value) return
  const max = tournament.value.matchFormat.setsToWin * 2 - 1
  if (matchSets.value.length < max) matchSets.value.push({ scoreA: 0, scoreB: 0 })
}

function removeLastSet() {
  if (matchSets.value.length > 1) matchSets.value.pop()
}

function matchWinner(sets: { scoreA: number; scoreB: number }[]) {
  const sA = sets.filter(s => s.scoreA > s.scoreB).length
  const sB = sets.filter(s => s.scoreB > s.scoreA).length
  if (sA > sB) return 'A'
  if (sB > sA) return 'B'
  return null
}

async function saveMatchScore() {
  if (!tournament.value || !editingMatch.value) return
  const updatedPools = pools.value.map(p => {
    if (p._id !== editingPoolId.value) return { ...p }
    return {
      ...p,
      matches: p.matches.map(m => {
        if (m._id !== editingMatch.value!._id) return { ...m }
        return { ...m, sets: matchSets.value.map(s => ({ ...s })), status: 'played' as const }
      }),
    }
  })
  const ok = await save({ pools: updatedPools as ITournament['pools'] })
  if (ok) {
    matchModalOpen.value = false
    toast.add({ title: 'Score enregistré', color: 'success' })
    await refresh()
  }
}

// ─── Pool standings ───────────────────────────────────────────────────────────

function poolStandings(pool: IPool) {
  const stats: Record<string, { wins: number; losses: number; setsFor: number; setsAgainst: number }> = {}
  for (const tid of pool.teamIds) stats[tid] = { wins: 0, losses: 0, setsFor: 0, setsAgainst: 0 }

  for (const match of pool.matches.filter(m => m.status === 'played')) {
    const sA = match.sets.filter(s => s.scoreA > s.scoreB).length
    const sB = match.sets.filter(s => s.scoreB > s.scoreA).length
    if (!stats[match.teamAId]) stats[match.teamAId] = { wins: 0, losses: 0, setsFor: 0, setsAgainst: 0 }
    if (!stats[match.teamBId]) stats[match.teamBId] = { wins: 0, losses: 0, setsFor: 0, setsAgainst: 0 }
    stats[match.teamAId]!.setsFor += sA
    stats[match.teamAId]!.setsAgainst += sB
    stats[match.teamBId]!.setsFor += sB
    stats[match.teamBId]!.setsAgainst += sA
    if (sA > sB) { stats[match.teamAId]!.wins++; stats[match.teamBId]!.losses++ }
    else if (sB > sA) { stats[match.teamBId]!.wins++; stats[match.teamAId]!.losses++ }
  }

  return pool.teamIds
    .map(tid => ({ teamId: tid, ...stats[tid]! }))
    .sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0) || ((b.setsFor ?? 0) - (b.setsAgainst ?? 0)) - ((a.setsFor ?? 0) - (a.setsAgainst ?? 0)))
}

// ─── Helpers: display ─────────────────────────────────────────────────────────

function statusLabel(s: string) {
  return { draft: 'Brouillon', active: 'En cours', finished: 'Terminé' }[s] ?? s
}
function statusClass(s: string) {
  return { draft: 'ts-draft', active: 'ts-active', finished: 'ts-finished' }[s] ?? 'ts-draft'
}
function rankClass(rank: string) {
  const m: Record<string, string> = { 'Bronze': 'rank-bronze', 'Bronze+': 'rank-bronze-plus', 'Argent': 'rank-argent', 'Argent+': 'rank-argent-plus', 'Or': 'rank-or', 'Or+': 'rank-or-plus' }
  return m[rank] ?? 'rank-bronze'
}
function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function playerInitials(pid: string) {
  const p = playerById(pid)
  if (!p) return '?'
  return ((p.firstName?.[0] ?? '') + (p.name?.[0] ?? '')).toUpperCase() || '?'
}
function matchSetsSummary(match: IMatch) {
  return match.sets.map(s => `${s.scoreA}–${s.scoreB}`).join(', ')
}
function teamDisplayName(tid: string) {
  return teamById(tid)?.name ?? '?'
}
</script>

<template>
  <AppShell>
    <!-- Header -->
    <div class="trn-detail-header">
      <div class="trn-detail-header-left">
        <NuxtLink to="/tournaments" class="back-link">
          <UIcon name="i-lucide-arrow-left" style="width:14px;height:14px" />
          Tournois
        </NuxtLink>
        <div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <h1 class="topbar-title font-condensed">{{ tournament?.name }}</h1>
            <span class="tournament-status" :class="statusClass(tournamentStatus)">
              {{ statusLabel(tournamentStatus) }}
            </span>
          </div>
          <p class="topbar-sub">
            <span v-if="tournament?.date">
              <UIcon name="i-lucide-calendar" style="width:12px;height:12px;margin-right:4px" />
              {{ formatDate(tournament?.date) }}
              &nbsp;·&nbsp;
            </span>
            <span style="color:#f87171;font-weight:700">{{ teams.length }}</span>
            équipe{{ teams.length !== 1 ? 's' : '' }}
            &nbsp;·&nbsp;
            {{ tournament?.teamsPerPool }} éq/poule
            &nbsp;·&nbsp;
            Best of {{ (tournament?.matchFormat.setsToWin ?? 2) * 2 - 1 }}
          </p>
        </div>
      </div>
      <div class="trn-detail-header-actions">
        <button v-if="tournamentStatus === 'draft'" class="btn-launch" :disabled="isSaving" @click="launchTournament">
          <UIcon name="i-lucide-play" style="width:15px;height:15px" />
          Lancer le tournoi
        </button>
        <span v-else-if="tournamentStatus === 'active'" class="trn-live-badge">
          <span class="live-dot" />
          En direct
        </span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="trn-tabs">
      <button class="trn-tab" :class="{ 'trn-tab--active': activeTab === 'teams' }" @click="activeTab = 'teams'">
        <UIcon name="i-lucide-users" style="width:14px;height:14px" />
        Équipes
        <span class="trn-tab-count">{{ teams.length }}</span>
      </button>
      <button class="trn-tab" :class="{ 'trn-tab--active': activeTab === 'pools' }" @click="activeTab = 'pools'">
        <UIcon name="i-lucide-layout-grid" style="width:14px;height:14px" />
        Poules
        <span class="trn-tab-count">{{ pools.length }}</span>
      </button>
    </div>

    <!-- ── Teams Tab ────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'teams'" class="trn-tab-content">
      <div class="trn-section-toolbar">
        <p class="trn-section-desc">
          {{ teams.length ? `${teams.length} équipe${teams.length !== 1 ? 's' : ''} · max 6 joueurs par équipe` :
            'Aucune équipe pour l\'instant.' }}
        </p>
        <button class="btn-add" @click="openCreateTeam">
          <UIcon name="i-lucide-plus" style="width:15px;height:15px" />
          Nouvelle équipe
        </button>
      </div>

      <div v-if="!teams.length" class="table-empty" style="margin-top:32px">
        <div class="table-empty-icon">
          <UIcon name="i-lucide-users" style="width:28px;height:28px;color:#374151" />
        </div>
        <p class="table-empty-text">Aucune équipe créée</p>
        <button class="btn-add" style="margin-top:14px" @click="openCreateTeam">
          <UIcon name="i-lucide-plus" style="width:15px;height:15px" />
          Créer la première équipe
        </button>
      </div>

      <div v-else class="team-grid">
        <div v-for="team in teams" :key="team._id" class="team-card">
          <div class="team-card-header">
            <div class="team-card-icon">
              <UIcon name="i-lucide-shield" style="width:14px;height:14px;color:#ef4444" />
            </div>
            <h3 class="team-card-name">{{ team.name }}</h3>
            <span class="team-player-count">{{ team.playerIds.length }}/6</span>
          </div>

          <div class="team-players">
            <div v-if="!team.playerIds.length" class="team-no-players">Aucun joueur assigné</div>
            <div v-else class="team-player-list">
              <div v-for="pid in team.playerIds" :key="pid" class="team-player-chip">
                <span class="team-player-avatar">{{ playerInitials(pid) }}</span>
                <span class="team-player-name">{{ playerDisplayName(pid) }}</span>
                <span v-if="playerById(pid)" class="rank-pill rank-pill--sm" :class="rankClass(playerById(pid)!.rank)">
                  {{ playerById(pid)!.rank }}
                </span>
              </div>
            </div>
          </div>

          <div class="team-card-footer">
            <button class="btn-action btn-action--edit" title="Modifier" @click="openEditTeam(team)">
              <UIcon name="i-lucide-pencil" style="width:13px;height:13px" />
            </button>
            <button class="btn-action btn-action--delete" title="Supprimer" :disabled="deletingTeamId === team._id"
              @click="deleteTeam(team)">
              <UIcon v-if="deletingTeamId === team._id" name="i-lucide-loader-circle" class="spin"
                style="width:13px;height:13px" />
              <UIcon v-else name="i-lucide-trash-2" style="width:13px;height:13px" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Pools Tab ────────────────────────────────────────────────────────── -->
    <div v-else class="trn-tab-content">
      <div class="trn-section-toolbar">
        <p class="trn-section-desc">
          {{
            pools.length
              ? `${pools.length} poule${pools.length !== 1 ? 's' : ''} générée${pools.length !== 1 ? 's' : ''}`
              : 'Aucune poule générée.'
          }}
        </p>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary" :disabled="isSaving || !teams.length" @click="applyGeneratePools">
            <UIcon name="i-lucide-shuffle" style="width:14px;height:14px" />
            {{ pools.length ? 'Redistribuer' : 'Générer les poules' }}
          </button>
        </div>
      </div>

      <div v-if="!pools.length" class="table-empty" style="margin-top:32px">
        <div class="table-empty-icon">
          <UIcon name="i-lucide-layout-grid" style="width:28px;height:28px;color:#374151" />
        </div>
        <p class="table-empty-text">Aucune poule générée</p>
        <button class="btn-add" style="margin-top:14px" :disabled="!teams.length" @click="applyGeneratePools">
          <UIcon name="i-lucide-shuffle" style="width:15px;height:15px" />
          Générer les poules
        </button>
      </div>

      <div v-else class="pools-grid">
        <div v-for="pool in pools" :key="pool._id" class="pool-card">
          <div class="pool-card-header">
            <h3 class="pool-card-title">{{ pool.name }}</h3>
            <span class="pool-team-count">{{ pool.teamIds.length }} équipe{{ pool.teamIds.length !== 1 ? 's' : ''
            }}</span>
          </div>

          <!-- Pool teams list -->
          <div class="pool-teams">
            <div v-for="tid in pool.teamIds" :key="tid" class="pool-team-row">
              <div class="pool-team-dot" />
              <span class="pool-team-name">{{ teamDisplayName(tid) }}</span>
              <span class="pool-team-players">{{ teamById(tid)?.playerIds?.length ?? 0 }} j.</span>
              <!-- Move to another pool -->
              <select v-if="pools.length > 1" class="pool-move-select" :value="pool._id"
                @change="(e) => moveTeamToPool(tid, pool._id, (e.target as HTMLSelectElement).value)">
                <option v-for="p in pools" :key="p._id" :value="p._id">{{ p.name }}</option>
              </select>
            </div>
          </div>

          <!-- Standings (if matches played) -->
          <div v-if="pool.matches.some(m => m.status === 'played')" class="pool-standings">
            <div class="pool-standings-title">Classement</div>
            <div v-for="(row, i) in poolStandings(pool)" :key="row.teamId" class="pool-standing-row">
              <span class="standing-pos">{{ i + 1 }}</span>
              <span class="standing-name">{{ teamDisplayName(row.teamId) }}</span>
              <span class="standing-stat">{{ row.wins }}V</span>
              <span class="standing-stat standing-stat--muted">{{ row.losses }}D</span>
              <span class="standing-stat">{{ row.setsFor }}/{{ row.setsAgainst }}</span>
            </div>
          </div>

          <!-- Matches -->
          <div v-if="pool.matches.length" class="pool-matches">
            <div class="pool-matches-title">Matchs</div>
            <div v-for="match in pool.matches" :key="match._id" class="pool-match-row"
              :class="{ 'pool-match-row--played': match.status === 'played' }">
              <span class="match-team">{{ teamDisplayName(match.teamAId) }}</span>
              <div class="match-score-cell">
                <span v-if="match.status === 'played'" class="match-score-display">
                  {{ matchSetsSummary(match) }}
                </span>
                <span v-else class="match-score-display match-score-display--pending">vs</span>
              </div>
              <span class="match-team match-team--right">{{ teamDisplayName(match.teamBId) }}</span>
              <button v-if="tournamentStatus === 'active'" class="btn-score" @click="openMatchScore(pool._id, match)">
                <UIcon :name="match.status === 'played' ? 'i-lucide-pencil' : 'i-lucide-clipboard-pen'"
                  style="width:12px;height:12px" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>

  <!-- ── Team modal ─────────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="teamModalOpen" class="custom-overlay" @mousedown.self="teamModalOpen = false">
      <div class="custom-modal custom-modal--wide" role="dialog" aria-modal="true">
        <div class="custom-modal-header">
          <div>
            <p class="custom-modal-title">{{ teamModalTitle }}</p>
            <p class="custom-modal-desc">Nommez l'équipe et ajoutez jusqu'à 6 joueurs.</p>
          </div>
          <button class="custom-modal-close" @click="teamModalOpen = false">
            <UIcon name="i-lucide-x" style="width:14px;height:14px" />
          </button>
        </div>
        <div class="custom-modal-body">
          <div class="modal-form-body">
            <div class="modal-field">
              <label class="modal-label">Nom de l'équipe <span style="color:#ef4444">*</span></label>
              <input v-model="teamForm.name" class="modal-input" placeholder="ex: Les Requins" autofocus
                autocomplete="off" />
            </div>

            <div class="team-picker">
              <div class="team-picker-left">
                <div class="team-picker-header">
                  <span class="modal-label">Joueurs sélectionnés</span>
                  <span class="team-player-count"
                    :class="{ 'team-player-count--full': teamForm.playerIds.length >= 6 }">
                    {{ teamForm.playerIds.length }}/6
                  </span>
                </div>
                <div class="team-selected-list">
                  <div v-if="!teamForm.playerIds.length" class="team-picker-empty">Aucun joueur sélectionné</div>
                  <div v-else class="team-player-list">
                    <div v-for="pid in teamForm.playerIds" :key="pid"
                      class="team-player-chip team-player-chip--selected">
                      <span class="team-player-avatar">{{ playerInitials(pid) }}</span>
                      <span class="team-player-name">{{ playerDisplayName(pid) }}</span>
                      <button class="team-player-remove" @click="togglePlayer(pid)">
                        <UIcon name="i-lucide-x" style="width:11px;height:11px" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="team-picker-right">
                <div class="team-picker-header">
                  <span class="modal-label">Ajouter des joueurs</span>
                </div>
                <div class="search-wrapper" style="margin-bottom:10px">
                  <UIcon name="i-lucide-search" class="search-icon" />
                  <input v-model="playerSearch" class="search-input" placeholder="Rechercher…" />
                  <button v-if="playerSearch" class="search-clear" @click="playerSearch = ''">
                    <UIcon name="i-lucide-x" class="size-3" />
                  </button>
                </div>
                <div class="player-picker-list">
                  <div v-if="!availablePlayers.length" class="team-picker-empty">Aucun résultat</div>
                  <div v-for="p in availablePlayers" :key="p._id" class="picker-player-row"
                    :class="{ 'picker-player-row--selected': teamForm.playerIds.includes(p._id), 'picker-player-row--blocked': p.blocked }"
                    @click="togglePlayer(p._id)">
                    <div class="player-avatar" style="width:28px;height:28px;font-size:11px;flex-shrink:0">
                      {{ (p.firstName?.[0] ?? '') + (p.name?.[0] ?? '') }}
                    </div>
                    <div style="flex:1;min-width:0">
                      <span class="player-lastname" style="font-size:13px">{{ p.name }}</span>
                      <span class="player-firstname" style="font-size:11px;display:block">{{ p.firstName || '—'
                      }}</span>
                    </div>
                    <span v-if="p.blocked" class="status-pill status-blocked"
                      style="font-size:10px;padding:2px 6px">Bloqué</span>
                    <span class="rank-pill rank-pill--sm" :class="rankClass(p.rank)">{{ p.rank }}</span>
                    <span class="pts-circle pts-circle--sm"
                      :class="p.points >= 9 ? 'pts-max' : p.points >= 7 ? 'pts-high' : p.points >= 4 ? 'pts-mid' : 'pts-low'">
                      {{ p.points ?? 5 }}
                    </span>
                    <UIcon v-if="teamForm.playerIds.includes(p._id)" name="i-lucide-check-circle-2"
                      style="width:16px;height:16px;color:#4ade80;flex-shrink:0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn-cancel" @click="teamModalOpen = false">Annuler</button>
          <button class="btn-add" :disabled="isSaving" @click="saveTeam">
            <UIcon v-if="isSaving" name="i-lucide-loader-circle" style="width:16px;height:16px" class="spin" />
            <UIcon v-else name="i-lucide-check" style="width:16px;height:16px" />
            {{ editingTeamId ? 'Enregistrer' : 'Créer l\'équipe' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Match score modal ──────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="matchModalOpen" class="custom-overlay" @mousedown.self="matchModalOpen = false">
      <div class="custom-modal" role="dialog" aria-modal="true">
        <div class="custom-modal-header">
          <div>
            <p class="custom-modal-title">Saisir les scores</p>
            <p v-if="editingMatch" class="custom-modal-desc">
              {{ teamDisplayName(editingMatch.teamAId) }} vs {{ teamDisplayName(editingMatch.teamBId) }}
            </p>
          </div>
          <button class="custom-modal-close" @click="matchModalOpen = false">
            <UIcon name="i-lucide-x" style="width:14px;height:14px" />
          </button>
        </div>
        <div class="custom-modal-body">
          <div class="modal-form-body">
            <div v-for="(set, idx) in matchSets" :key="idx" class="set-score-row">
              <span class="set-label">Set {{ idx + 1 }}</span>
              <span class="set-team-name">{{ editingMatch ? teamDisplayName(editingMatch.teamAId) : '' }}</span>
              <input v-model.number="set.scoreA" class="modal-input set-score-input" type="number" min="0" max="99" />
              <span class="set-separator">—</span>
              <input v-model.number="set.scoreB" class="modal-input set-score-input" type="number" min="0" max="99" />
              <span class="set-team-name set-team-name--right">{{ editingMatch ? teamDisplayName(editingMatch.teamBId) :
                '' }}</span>
            </div>
            <div class="set-actions">
              <button class="btn-secondary" type="button" :disabled="matchSets.length <= 1" @click="removeLastSet">
                <UIcon name="i-lucide-minus" style="width:13px;height:13px" /> Retirer set
              </button>
              <button class="btn-secondary" type="button"
                :disabled="matchSets.length >= (tournament?.matchFormat.setsToWin ?? 2) * 2 - 1" @click="addSet">
                <UIcon name="i-lucide-plus" style="width:13px;height:13px" /> Ajouter set
              </button>
            </div>
            <div v-if="matchWinner(matchSets)" class="match-winner-preview">
              <UIcon name="i-lucide-trophy" style="width:14px;height:14px;color:#fbbf24" />
              Victoire :
              <strong>
                {{ matchWinner(matchSets) === 'A' && editingMatch ? teamDisplayName(editingMatch.teamAId) : editingMatch
                  ? teamDisplayName(editingMatch.teamBId) : '' }}
              </strong>
              ({{matchSets.filter(s => s.scoreA > s.scoreB).length}}–{{matchSets.filter(s => s.scoreB >
                s.scoreA).length}})
            </div>
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn-cancel" @click="matchModalOpen = false">Annuler</button>
          <button class="btn-add" :disabled="isSaving" @click="saveMatchScore">
            <UIcon v-if="isSaving" name="i-lucide-loader-circle" style="width:16px;height:16px" class="spin" />
            <UIcon v-else name="i-lucide-check" style="width:16px;height:16px" />
            Enregistrer le score
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
