<script setup lang="ts">
import type { IPlayer, IPlayerForm } from '~/types/player'

definePageMeta({ middleware: 'admin' })

const auth = useAuthStore()
const toast = useToast()

const { data: players, refresh, status } = await useFetch<IPlayer[]>('/api/players')

const search = ref('')
const filteredPlayers = computed(() => {
  if (!players.value) return []
  const q = search.value.toLowerCase()
  if (!q) return players.value
  return players.value.filter(
    (p) => p.name.toLowerCase().includes(q) || String(p.rank).includes(q)
  )
})

const isModalOpen = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const form = reactive<IPlayerForm>({ name: '', rank: 0 })

function openCreate() {
  isEditing.value = false
  editingId.value = null
  form.name = ''
  form.rank = 0
  isModalOpen.value = true
}

function openEdit(player: IPlayer) {
  isEditing.value = true
  editingId.value = player._id
  form.name = player.name
  form.rank = player.rank
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
        body: { name: form.name, rank: form.rank },
      })
      toast.add({ title: 'Mis à jour', description: `${form.name} modifié.`, color: 'success' })
    } else {
      await $fetch('/api/players', {
        method: 'POST',
        body: { name: form.name, rank: form.rank },
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

function openDelete(player: IPlayer) {
  playerToDelete.value = player
  deleteModalOpen.value = true
}

async function confirmDelete() {
  if (!playerToDelete.value) return
  const player = playerToDelete.value
  deletingId.value = player._id
  try {
    await $fetch(`/api/players/${player._id}`, { method: 'DELETE' })
    toast.add({ title: 'Joueur supprimé', description: `${player.name} a été retiré de la liste.`, color: 'success' })
    deleteModalOpen.value = false
    playerToDelete.value = null
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
</script>

<template>
  <div class="page-root">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <NuxtLink to="/" class="logo-link">
          <div class="logo-icon">
            <UIcon name="i-lucide-volleyball" style="width:20px;height:20px;color:#fff" />
          </div>
          <span class="logo-text">SJL <span style="color:#ef4444">LOISIRS</span></span>
        </NuxtLink>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink to="/players" class="nav-item" active-class="nav-item--active">
          <UIcon name="i-lucide-users" style="width:16px;height:16px" />
          Joueurs
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <div class="admin-badge">
          <div class="admin-avatar">{{ auth.username?.[0]?.toUpperCase() }}</div>
          <div class="admin-info">
            <span class="admin-name">{{ auth.username }}</span>
            <span class="admin-role">Administrateur</span>
          </div>
        </div>
        <button class="btn-logout" title="Se déconnecter"
          @click="async () => { await auth.logout(); await navigateTo('/login') }">
          <UIcon name="i-lucide-log-out" style="width:14px;height:14px" />
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="main-content">
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

      <!-- Spreadsheet table -->
      <div class="sheet-wrapper">
        <div class="sheet-head">
          <div class="sheet-corner">#</div>
          <div class="sheet-th">Nom du joueur</div>
          <div class="sheet-th sheet-th--num">Classement</div>
          <div class="sheet-th">Ajouté le</div>
          <div class="sheet-th sheet-th--actions">Actions</div>
        </div>

        <div v-if="status === 'pending'" class="sheet-body">
          <div v-for="n in 5" :key="n" class="sheet-row">
            <div class="sheet-row-num" />
            <div class="sheet-cell">
              <div class="skeleton" style="width:130px;height:14px" />
            </div>
            <div class="sheet-cell">
              <div class="skeleton" style="width:44px;height:14px" />
            </div>
            <div class="sheet-cell">
              <div class="skeleton" style="width:80px;height:14px" />
            </div>
            <div class="sheet-cell" />
          </div>
        </div>

        <div v-else-if="!filteredPlayers.length" class="sheet-empty">
          <UIcon name="i-lucide-table-2" style="width:40px;height:40px;color:#374151;margin-bottom:12px" />
          <p style="color:#6b7280;font-weight:600;font-size:14px">
            {{ search ? 'Aucun résultat pour cette recherche' : 'Aucun joueur enregistré' }}
          </p>
          <button v-if="!search" class="btn-add" style="margin-top:16px" @click="openCreate">
            <UIcon name="i-lucide-plus" style="width:16px;height:16px" />
            Ajouter le premier joueur
          </button>
        </div>

        <div v-else class="sheet-body">
          <div v-for="(player, idx) in filteredPlayers" :key="player._id" class="sheet-row">
            <div class="sheet-row-num">{{ idx + 1 }}</div>
            <div class="sheet-cell sheet-cell--name">
              <div class="player-dot" />
              {{ player.name }}
            </div>
            <div class="sheet-cell sheet-cell--rank">
              <span class="rank-badge">#{{ player.rank }}</span>
            </div>
            <div class="sheet-cell sheet-cell--date">{{ formatDate(player.createdAt) }}</div>
            <div class="sheet-cell sheet-cell--actions">
              <div class="row-actions">
                <button class="btn-action btn-action--edit" title="Modifier" @click="openEdit(player)">
                  <UIcon name="i-lucide-pencil" class="size-3.5" />
                </button>
                <button class="btn-action btn-action--delete" title="Supprimer" @click="openDelete(player)">
                  <UIcon name="i-lucide-trash-2" class="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredPlayers.length" class="sheet-foot">
          {{ filteredPlayers.length }} ligne{{ filteredPlayers.length !== 1 ? 's' : '' }}
          <span v-if="search"> — filtrée{{ filteredPlayers.length !== 1 ? 's' : '' }} sur {{ players?.length }}</span>
        </div>
      </div>
    </main>

    <!-- Add / Edit modal -->
    <UModal v-model:open="isModalOpen" :title="isEditing ? 'Modifier le joueur' : 'Nouveau joueur'"
      :description="isEditing ? 'Modifiez les informations du joueur.' : 'Renseignez les informations du nouveau joueur.'">
      <template #body>
        <div class="modal-form-body">
          <div class="modal-field">
            <label class="modal-label">Nom du joueur <span class="text-red-500">*</span></label>
            <UInput v-model="form.name" placeholder="ex: Jean Dupont" autofocus class="w-full" size="lg"
              @keyup.enter="savePlayer" />
          </div>
          <div class="modal-field">
            <label class="modal-label">Classement</label>
            <UInput v-model.number="form.rank" type="number" placeholder="0" class="w-full" size="lg"
              @keyup.enter="savePlayer" />
            <p class="modal-hint">Classement national FFVolley (laisser 0 si inconnu)</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="modal-footer">
          <UButton color="neutral" variant="ghost" size="md" @click="isModalOpen = false">Annuler</UButton>
          <button class="btn-add" :disabled="isSaving" @click="savePlayer">
            <UIcon v-if="isSaving" name="i-lucide-loader-circle" class="size-4 animate-spin" />
            <UIcon v-else :name="isEditing ? 'i-lucide-check' : 'i-lucide-plus'" class="size-4" />
            {{ isEditing ? 'Enregistrer les modifications' : 'Créer le joueur' }}
          </button>
        </div>
      </template>
    </UModal>

    <!-- Delete confirmation modal -->
    <UModal v-model:open="deleteModalOpen" title="Supprimer le joueur">
      <template #body>
        <div class="delete-danger-zone">
          <div class="delete-icon-wrap">
            <UIcon name="i-lucide-trash-2" class="size-6 text-red-400" />
          </div>
          <div>
            <p class="delete-warning-text">Vous êtes sur le point de supprimer définitivement</p>
            <p class="delete-player-name">{{ playerToDelete?.name }}</p>
            <p class="delete-warning-text mt-1">Cette action est irréversible.</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="modal-footer">
          <UButton color="neutral" variant="ghost" size="md" @click="deleteModalOpen = false">Annuler</UButton>
          <button class="btn-danger" :disabled="!!deletingId" @click="confirmDelete">
            <UIcon v-if="deletingId" name="i-lucide-loader-circle" class="size-4 animate-spin" />
            <UIcon v-else name="i-lucide-trash-2" class="size-4" />
            Supprimer définitivement
          </button>
        </div>
      </template>
    </UModal>
  </div>
</template>
