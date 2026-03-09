<script setup lang="ts">
import type { IPlayer, IPlayerForm } from '~/types/player'
import { PLAYER_RANKS } from '~/types/player'

definePageMeta({ middleware: 'admin' })

const auth = useAuthStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()

onMounted(() => {
  if (route.query.welcome === '1') {
    toast.add({ title: 'Connecté', description: `Bienvenue, ${auth.username} !`, color: 'success' })
    router.replace({ query: {} })
  }
})

const { data: players, refresh, status } = await useFetch<IPlayer[]>('/api/players')

const search = ref('')
const filteredPlayers = computed(() => {
  if (!players.value) return []
  const q = search.value.toLowerCase()
  if (!q) return players.value
  return players.value.filter(
    (p) => p.name.toLowerCase().includes(q) || p.firstName.toLowerCase().includes(q) || p.rank.toLowerCase().includes(q)
  )
})

const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive<IPlayerForm>({ name: '', firstName: '', rank: 'Bronze', blocked: false, points: 5 })

const modalTitle = computed(() => (isEditing.value ? 'Modifier le joueur' : 'Nouveau joueur'))
const modalDesc = computed(() =>
  isEditing.value ? 'Modifiez les informations du joueur.' : 'Renseignez les informations du nouveau joueur.'
)

function openCreate() {
  isEditing.value = false
  editingId.value = null
  form.name = ''
  form.firstName = ''
  form.rank = 'Bronze'
  form.blocked = false
  form.points = 5
  isModalOpen.value = true
}

function openEdit(player: IPlayer) {
  isEditing.value = true
  editingId.value = player._id
  form.name = player.name
  form.firstName = player.firstName
  form.rank = player.rank
  form.blocked = player.blocked
  form.points = player.points ?? 5
  isModalOpen.value = true
}

const isSaving = ref(false)

async function savePlayer() {
  if (!form.name.trim()) {
    toast.add({ title: 'Validation', description: 'Le nom est requis.', color: 'error' })
    return
  }
  isSaving.value = true
  try {
    if (isEditing.value && editingId.value) {
      await $fetch(`/api/players/${editingId.value}`, {
        method: 'PUT',
        body: { name: form.name, firstName: form.firstName, rank: form.rank, blocked: form.blocked, points: form.points },
      })
      toast.add({ title: 'Mis à jour', description: `${form.name} modifié.`, color: 'warning' })
    } else {
      await $fetch('/api/players', {
        method: 'POST',
        body: { name: form.name, firstName: form.firstName, rank: form.rank, blocked: form.blocked, points: form.points },
      })
      toast.add({ title: 'Créé', description: `${form.name} ajouté.`, color: 'success' })
    }
    isModalOpen.value = false
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', description: 'Une erreur est survenue.', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

const deletingId = ref<string | null>(null)
const deleteModalOpen = ref(false)
const playerToDelete = ref<IPlayer | null>(null)
const deleteConfirmText = ref('')

function openDelete(player: IPlayer) {
  playerToDelete.value = player
  deleteConfirmText.value = ''
  deleteModalOpen.value = true
}

async function confirmDelete() {
  if (!playerToDelete.value) return
  if (deleteConfirmText.value !== playerToDelete.value.name) return
  const player = playerToDelete.value
  deletingId.value = player._id
  try {
    await $fetch(`/api/players/${player._id}`, { method: 'DELETE' })
    toast.add({ title: 'Joueur supprimé', description: `${player.name} a été retiré de la liste.`, color: 'error' })
    deleteModalOpen.value = false
    playerToDelete.value = null
    deleteConfirmText.value = ''
    await refresh()
  } catch {
    toast.add({ title: 'Erreur', description: 'Impossible de supprimer ce joueur.', color: 'error' })
  } finally {
    deletingId.value = null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function rankClass(rank: string) {
  const map: Record<string, string> = {
    'Bronze': 'rank-bronze', 'Bronze+': 'rank-bronze-plus',
    'Argent': 'rank-argent', 'Argent+': 'rank-argent-plus',
    'Or': 'rank-or', 'Or+': 'rank-or-plus',
  }
  return map[rank] ?? 'rank-bronze'
}

function pointsClass(pts: number) {
  if (pts >= 9) return 'pts-max'
  if (pts >= 7) return 'pts-high'
  if (pts >= 4) return 'pts-mid'
  return 'pts-low'
}

function initials(player: IPlayer) {
  const f = player.firstName?.[0] ?? ''
  const n = player.name?.[0] ?? ''
  return (f + n).toUpperCase() || '?'
}
</script>

<template>
  <AppShell>
    <!-- Topbar -->
    <div class="topbar">
      <div>
        <h1 class="topbar-title font-condensed">JOUEURS</h1>
        <p class="topbar-sub">
          <span style="color:#f87171;font-weight:700">{{ players?.length ?? 0 }}</span>
          joueur{{ (players?.length ?? 0) !== 1 ? 's' : '' }}
        </p>
      </div>
      <div class="topbar-actions">
        <div class="search-wrapper">
          <UIcon name="i-lucide-search" class="search-icon" />
          <input v-model="search" class="search-input" placeholder="Rechercher un joueur…" />
          <button v-if="search" class="search-clear" @click="search = ''">
            <UIcon name="i-lucide-x" class="size-3" />
          </button>
        </div>
        <button class="btn-add" @click="openCreate">
          <UIcon name="i-lucide-plus" class="size-4" />
          Nouveau joueur
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="players-table-wrap">
      <table class="players-table">
        <thead>
          <tr>
            <th class="col-idx">#</th>
            <th class="col-player">Joueur</th>
            <th class="col-rank">Classement</th>
            <th class="col-pts">Points</th>
            <th class="col-status">Statut</th>
            <th class="col-date">Ajouté le</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>

        <tbody v-if="status === 'pending'">
          <tr v-for="n in 6" :key="n" class="table-row-skeleton">
            <td>
              <div class="skeleton" style="width:18px;height:12px" />
            </td>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="skeleton" style="width:32px;height:32px;border-radius:50%;flex-shrink:0" />
                <div>
                  <div class="skeleton" style="width:90px;height:12px;margin-bottom:5px" />
                  <div class="skeleton" style="width:60px;height:10px" />
                </div>
              </div>
            </td>
            <td>
              <div class="skeleton" style="width:70px;height:22px;border-radius:6px" />
            </td>
            <td>
              <div class="skeleton" style="width:30px;height:30px;border-radius:50%" />
            </td>
            <td>
              <div class="skeleton" style="width:55px;height:20px;border-radius:20px" />
            </td>
            <td>
              <div class="skeleton" style="width:80px;height:12px" />
            </td>
            <td>
              <div class="skeleton" style="width:56px;height:28px;border-radius:6px" />
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="!filteredPlayers.length">
          <tr>
            <td colspan="7">
              <div class="table-empty">
                <div class="table-empty-icon">
                  <UIcon name="i-lucide-users" style="width:28px;height:28px;color:#374151" />
                </div>
                <p class="table-empty-text">
                  {{ search ? 'Aucun résultat pour cette recherche' : 'Aucun joueur enregistré' }}
                </p>
                <button v-if="!search" class="btn-add" style="margin-top:14px" @click="openCreate">
                  <UIcon name="i-lucide-plus" style="width:15px;height:15px" />
                  Ajouter le premier joueur
                </button>
              </div>
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr v-for="(player, idx) in filteredPlayers" :key="player._id" class="players-row">
            <td class="cell-idx">{{ idx + 1 }}</td>
            <td class="cell-player">
              <div class="player-cell">
                <div class="player-avatar">{{ initials(player) }}</div>
                <div class="player-names">
                  <span class="player-lastname">{{ player.name }}</span>
                  <span class="player-firstname">{{ player.firstName || '—' }}</span>
                </div>
              </div>
            </td>
            <td class="cell-rank">
              <span class="rank-pill" :class="rankClass(player.rank)">{{ player.rank }}</span>
            </td>
            <td class="cell-pts">
              <span class="pts-circle" :class="pointsClass(player.points ?? 5)">{{ player.points ?? 5 }}</span>
            </td>
            <td class="cell-status">
              <span v-if="player.blocked" class="status-pill status-blocked">
                <UIcon name="i-lucide-ban" style="width:11px;height:11px" /> Bloqué
              </span>
              <span v-else class="status-pill status-active">
                <UIcon name="i-lucide-check" style="width:11px;height:11px" /> Actif
              </span>
            </td>
            <td class="cell-date">{{ formatDate(player.createdAt) }}</td>
            <td class="cell-actions">
              <div class="row-actions">
                <button class="btn-action btn-action--edit" title="Modifier" @click="openEdit(player)">
                  <UIcon name="i-lucide-pencil" style="width:13px;height:13px" />
                </button>
                <button class="btn-action btn-action--delete" title="Supprimer" @click="openDelete(player)">
                  <UIcon name="i-lucide-trash-2" style="width:13px;height:13px" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredPlayers.length" class="table-foot">
        {{ filteredPlayers.length }} joueur{{ filteredPlayers.length !== 1 ? 's' : '' }}
        <span v-if="search" style="color:#6b7280"> — filtré{{ filteredPlayers.length !== 1 ? 's' : '' }} sur {{
          players?.length }}</span>
      </div>
    </div>
  </AppShell>

  <!-- Add / Edit modal -->
  <Teleport to="body">
    <div v-if="isModalOpen" class="custom-overlay" @mousedown.self="isModalOpen = false">
      <div class="custom-modal" role="dialog" aria-modal="true">
        <div class="custom-modal-header">
          <div>
            <p class="custom-modal-title">{{ modalTitle }}</p>
            <p class="custom-modal-desc">{{ modalDesc }}</p>
          </div>
          <button class="custom-modal-close" @click="isModalOpen = false">
            <UIcon name="i-lucide-x" style="width:14px;height:14px" />
          </button>
        </div>
        <div class="custom-modal-body">
          <div class="modal-form-body">
            <div class="modal-row-2">
              <div class="modal-field">
                <label class="modal-label">Nom <span style="color:#ef4444">*</span></label>
                <input v-model="form.name" class="modal-input" placeholder="ex: Dupont" autofocus autocomplete="off"
                  @keyup.enter="savePlayer" />
              </div>
              <div class="modal-field">
                <label class="modal-label">Prénom</label>
                <input v-model="form.firstName" class="modal-input" placeholder="ex: Jean" autocomplete="off"
                  @keyup.enter="savePlayer" />
              </div>
            </div>
            <div class="modal-row-2">
              <div class="modal-field">
                <label class="modal-label">Classement</label>
                <select v-model="form.rank" class="modal-input modal-select">
                  <option v-for="r in PLAYER_RANKS" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
              <div class="modal-field">
                <label class="modal-label">
                  Points <span class="modal-label-sub">(niveau 1–10)</span>
                </label>
                <div class="points-slider-wrap">
                  <input v-model.number="form.points" type="range" min="1" max="10" step="1" class="points-slider" />
                  <span class="points-slider-val" :class="pointsClass(form.points)">{{ form.points }}</span>
                </div>
              </div>
            </div>
            <div class="modal-field">
              <label class="modal-toggle">
                <input v-model="form.blocked" type="checkbox" class="toggle-input" />
                <div class="toggle-track">
                  <div class="toggle-thumb" />
                </div>
                <span class="toggle-label">bloque ?</span>
              </label>
            </div>
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn-cancel" @click="isModalOpen = false">Annuler</button>
          <button class="btn-add" :disabled="isSaving" @click="savePlayer">
            <UIcon v-if="isSaving" name="i-lucide-loader-circle" style="width:16px;height:16px" class="spin" />
            <UIcon v-else :name="isEditing ? 'i-lucide-check' : 'i-lucide-plus'" style="width:16px;height:16px" />
            {{ isEditing ? 'Enregistrer' : 'Créer le joueur' }}
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
            <p class="custom-modal-title">Supprimer le joueur</p>
            <p class="custom-modal-desc">Cette action est irréversible.</p>
          </div>
          <button class="custom-modal-close" @click="deleteModalOpen = false">
            <UIcon name="i-lucide-x" style="width:14px;height:14px" />
          </button>
        </div>
        <div class="custom-modal-body">
          <div class="delete-danger-zone">
            <div class="delete-icon-wrap">
              <UIcon name="i-lucide-trash-2" style="width:24px;height:24px;color:#f87171" />
            </div>
            <div style="text-align:center">
              <p class="delete-warning-text">Vous êtes sur le point de supprimer définitivement</p>
              <p class="delete-player-name" style="margin:8px 0 4px">{{ playerToDelete?.name }}</p>
            </div>
            <div class="confirm-input-wrap">
              <label class="confirm-input-label">Tapez le nom du joueur pour confirmer</label>
              <input v-model="deleteConfirmText" class="confirm-input"
                :class="{ 'confirm-input--valid': deleteConfirmText === playerToDelete?.name }"
                :placeholder="playerToDelete?.name ?? ''" autocomplete="off" @keyup.enter="confirmDelete" />
            </div>
          </div>
        </div>
        <div class="custom-modal-footer">
          <button class="btn-cancel" @click="deleteModalOpen = false">Annuler</button>
          <button class="btn-danger" :disabled="!!deletingId || deleteConfirmText !== playerToDelete?.name"
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
