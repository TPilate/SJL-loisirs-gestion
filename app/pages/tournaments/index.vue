<script setup lang="ts">
import type { ITournament, ITournamentForm } from '~/types/tournament'

definePageMeta({ middleware: 'admin' })

const toast = useToast()

const { data: tournaments, refresh, status } = await useFetch<ITournament[]>('/api/tournaments')

// ─── Create modal ────────────────────────────────────────────────────────────

const isModalOpen = ref(false)
const isSaving = ref(false)
const form = reactive<ITournamentForm>({
  name: '',
  date: '',
  matchFormat: { setsToWin: 2, pointsPerSet: 25, goldenSetPoints: 15 },
  teamsPerPool: 4,
})

function openCreate() {
  form.name = ''
  form.date = ''
  form.matchFormat = { setsToWin: 2, pointsPerSet: 25, goldenSetPoints: 15 }
  form.teamsPerPool = 4
  isModalOpen.value = true
}

async function createTournament() {
  if (!form.name.trim()) {
    toast.add({ title: 'Validation', description: 'Le nom du tournoi est requis.', color: 'error' })
    return
  }
  isSaving.value = true
  try {
    const created = await $fetch<ITournament>('/api/tournaments', {
      method: 'POST',
      body: {
        name: form.name,
        date: form.date || undefined,
        matchFormat: form.matchFormat,
        teamsPerPool: form.teamsPerPool,
      },
    })
    isModalOpen.value = false
    toast.add({ title: 'Tournoi créé', description: `${form.name} prêt à être configuré.`, color: 'success' })
    await navigateTo(`/tournaments/${created._id}`)
  } catch {
    toast.add({ title: 'Erreur', description: 'Impossible de créer le tournoi.', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteModalOpen = ref(false)
const tournamentToDelete = ref<ITournament | null>(null)
const deleteConfirmText = ref('')
const deletingId = ref<string | null>(null)

function openDelete(t: ITournament) {
  tournamentToDelete.value = t
  deleteConfirmText.value = ''
  deleteModalOpen.value = true
}

async function confirmDelete() {
  if (!tournamentToDelete.value) return
  if (deleteConfirmText.value !== tournamentToDelete.value.name) return
  const t = tournamentToDelete.value
  deletingId.value = t._id
  try {
    await $fetch(`/api/tournaments/${t._id}`, { method: 'DELETE' })
    toast.add({ title: 'Supprimé', description: `${t.name} supprimé.`, color: 'error' })
    deleteModalOpen.value = false
    tournamentToDelete.value = null
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', description: 'Impossible de supprimer ce tournoi.', color: 'error' })
  } finally {
    deletingId.value = null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(s: string) {
  return { draft: 'Brouillon', active: 'En cours', finished: 'Terminé' }[s] ?? s
}
function statusClass(s: string) {
  return { draft: 'ts-draft', active: 'ts-active', finished: 'ts-finished' }[s] ?? 'ts-draft'
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function matchFormatLabel(f: ITournament['matchFormat']) {
  return `Best of ${f.setsToWin * 2 - 1} — ${f.pointsPerSet} pts (tie: ${f.goldenSetPoints})`
}
</script>

<template>
  <AppShell>
    <!-- Topbar -->
    <div class="topbar">
      <div>
        <h1 class="topbar-title font-condensed">TOURNOIS</h1>
        <p class="topbar-sub">
          <span style="color:#f87171;font-weight:700">{{ tournaments?.length ?? 0 }}</span>
          tournoi{{ (tournaments?.length ?? 0) !== 1 ? 's' : '' }}
        </p>
      </div>
      <div class="topbar-actions">
        <button class="btn-add" @click="openCreate">
          <UIcon name="i-lucide-plus" class="size-4" />
          Nouveau tournoi
        </button>
      </div>
    </div>

    <!-- Tournament cards -->
    <div class="trn-grid">
      <!-- Skeleton -->
      <template v-if="status === 'pending'">
        <div v-for="n in 3" :key="n" class="trn-card trn-card--skeleton">
          <div class="skeleton" style="width:60%;height:18px;margin-bottom:10px" />
          <div class="skeleton" style="width:40%;height:13px;margin-bottom:8px" />
          <div class="skeleton" style="width:30%;height:22px;border-radius:20px" />
        </div>
      </template>

      <!-- Empty -->
      <div v-else-if="!tournaments?.length" class="trn-empty">
        <div class="table-empty-icon">
          <UIcon name="i-lucide-trophy" style="width:28px;height:28px;color:#374151" />
        </div>
        <p class="table-empty-text">Aucun tournoi enregistré</p>
        <button class="btn-add" style="margin-top:14px" @click="openCreate">
          <UIcon name="i-lucide-plus" style="width:15px;height:15px" />
          Créer le premier tournoi
        </button>
      </div>

      <!-- Cards -->
      <template v-else>
        <div v-for="t in tournaments" :key="t._id" class="trn-card">
          <div class="trn-card-top">
            <div class="trn-card-header">
              <h3 class="trn-card-title">{{ t.name }}</h3>
              <span class="tournament-status" :class="statusClass(t.status)">{{ statusLabel(t.status) }}</span>
            </div>
            <div class="trn-card-meta">
              <span class="trn-meta-item">
                <UIcon name="i-lucide-calendar" style="width:13px;height:13px" />
                {{ formatDate(t.date) }}
              </span>
              <span class="trn-meta-item">
                <UIcon name="i-lucide-users" style="width:13px;height:13px" />
                {{ t.teams?.length ?? 0 }} équipe{{ (t.teams?.length ?? 0) !== 1 ? 's' : '' }}
              </span>
              <span class="trn-meta-item">
                <UIcon name="i-lucide-layout-grid" style="width:13px;height:13px" />
                {{ t.teamsPerPool }} éq/poule
              </span>
            </div>
            <p class="trn-format-label">{{ matchFormatLabel(t.matchFormat) }}</p>
          </div>
          <div class="trn-card-footer">
            <NuxtLink :to="`/tournaments/${t._id}`" class="btn-trn-view">
              <UIcon name="i-lucide-arrow-right" style="width:14px;height:14px" />
              Gérer
            </NuxtLink>
            <button class="btn-action btn-action--delete" title="Supprimer" @click="openDelete(t)">
              <UIcon name="i-lucide-trash-2" style="width:13px;height:13px" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </AppShell>

  <!-- Create tournament modal -->
  <Teleport to="body">
    <div v-if="isModalOpen" class="custom-overlay" @mousedown.self="isModalOpen = false">
      <div class="custom-modal" role="dialog" aria-modal="true">
        <div class="custom-modal-header">
          <div>
            <p class="custom-modal-title">Nouveau tournoi</p>
            <p class="custom-modal-desc">Définissez les paramètres du tournoi.</p>
          </div>
          <button class="custom-modal-close" @click="isModalOpen = false">
            <UIcon name="i-lucide-x" style="width:14px;height:14px" />
          </button>
        </div>
        <div class="custom-modal-body">
          <div class="modal-form-body">
            <div class="modal-row-2">
              <div class="modal-field" style="flex:2">
                <label class="modal-label">Nom du tournoi <span style="color:#ef4444">*</span></label>
                <input v-model="form.name" class="modal-input" placeholder="ex: Tournoi Printemps 2026" autofocus
                  autocomplete="off" @keyup.enter="createTournament" />
              </div>
              <div class="modal-field">
                <label class="modal-label">Date</label>
                <input v-model="form.date" class="modal-input" type="date" />
              </div>
            </div>

            <div class="modal-section-title">Format des matchs</div>
            <div class="modal-row-3">
              <div class="modal-field">
                <label class="modal-label">Sets gagnants</label>
                <select v-model.number="form.matchFormat.setsToWin" class="modal-input modal-select">
                  <option :value="1">1 set</option>
                  <option :value="2">2 sets (Best of 3)</option>
                  <option :value="3">3 sets (Best of 5)</option>
                </select>
              </div>
              <div class="modal-field">
                <label class="modal-label">Points/set</label>
                <input v-model.number="form.matchFormat.pointsPerSet" class="modal-input" type="number" min="10"
                  max="50" />
              </div>
              <div class="modal-field">
                <label class="modal-label">Tie-break</label>
                <input v-model.number="form.matchFormat.goldenSetPoints" class="modal-input" type="number" min="10"
                  max="25" />
              </div>
            </div>

            <div class="modal-field">
              <label class="modal-label">Équipes par poule</label>
              <div class="teamsperpoule-selector">
                <button v-for="n in [2, 3, 4, 5, 6]" :key="n" class="tpp-btn"
                  :class="{ 'tpp-btn--active': form.teamsPerPool === n }" type="button" @click="form.teamsPerPool = n">
                  {{ n }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn-cancel" @click="isModalOpen = false">Annuler</button>
          <button class="btn-add" :disabled="isSaving" @click="createTournament">
            <UIcon v-if="isSaving" name="i-lucide-loader-circle" style="width:16px;height:16px" class="spin" />
            <UIcon v-else name="i-lucide-trophy" style="width:16px;height:16px" />
            Créer le tournoi
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete modal -->
  <Teleport to="body">
    <div v-if="deleteModalOpen" class="custom-overlay" @mousedown.self="deleteModalOpen = false">
      <div class="custom-modal custom-modal--danger" role="dialog" aria-modal="true">
        <div class="custom-modal-header">
          <div>
            <p class="custom-modal-title">Supprimer le tournoi</p>
            <p class="custom-modal-desc">Cette action est irréversible.</p>
          </div>
          <button class="custom-modal-close" @click="deleteModalOpen = false">
            <UIcon name="i-lucide-x" style="width:14px;height:14px" />
          </button>
        </div>
        <div class="custom-modal-body">
          <div class="delete-danger-zone">
            <div class="delete-icon-wrap">
              <UIcon name="i-lucide-trophy" style="width:24px;height:24px;color:#f87171" />
            </div>
            <div style="text-align:center">
              <p class="delete-warning-text">Vous êtes sur le point de supprimer définitivement</p>
              <p class="delete-player-name" style="margin:8px 0 4px">{{ tournamentToDelete?.name }}</p>
            </div>
            <div class="confirm-input-wrap">
              <label class="confirm-input-label">Tapez le nom du tournoi pour confirmer</label>
              <input v-model="deleteConfirmText" class="confirm-input"
                :class="{ 'confirm-input--valid': deleteConfirmText === tournamentToDelete?.name }"
                :placeholder="tournamentToDelete?.name ?? ''" autocomplete="off" @keyup.enter="confirmDelete" />
            </div>
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn-cancel" @click="deleteModalOpen = false">Annuler</button>
          <button class="btn-danger" :disabled="!!deletingId || deleteConfirmText !== tournamentToDelete?.name"
            @click="confirmDelete">
            <UIcon v-if="deletingId" name="i-lucide-loader-circle" style="width:16px;height:16px" class="spin" />
            <UIcon v-else name="i-lucide-trash-2" style="width:16px;height:16px" />
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
