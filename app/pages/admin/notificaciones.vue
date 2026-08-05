<script setup lang="ts">
import { Send, Loader2, Megaphone, Clock } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

useHead({ title: 'Notificaciones Masivas' })

const title = ref('')
const body = ref('')
const isSending = ref(false)

const canSend = computed(() =>
  title.value.trim().length > 0
  && body.value.trim().length > 0
  && !isSending.value,
)

const { data: historyData, refresh } = await useFetch('/api/push/broadcast', {
  default: () => ({ data: [] }),
})

const history = computed(() => historyData.value?.data ?? [])

async function handleSend() {
  if (!canSend.value) return

  isSending.value = true
  try {
    const result = await $fetch('/api/push/broadcast', {
      method: 'POST',
      body: {
        title: title.value.trim(),
        body: body.value.trim(),
      },
    })

    const push = (result as { data?: { push?: { sent?: number } } }).data?.push
    toast.success(`Notificación enviada a ${push?.sent ?? 0} usuario(s)`)
    title.value = ''
    body.value = ''
    await refresh()
  }
  catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'Error al enviar notificación')
  }
  finally {
    isSending.value = false
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('es-VE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Notificaciones Masivas</h1>
      <p class="text-muted-foreground">Envía un mensaje push a todos los usuarios suscritos. El mensaje aparecerá como barra de anuncio durante 24 horas.</p>
    </div>

    <!-- Send form -->
    <Card>
      <CardContent class="p-5 md:p-8">
        <form class="space-y-4" @submit.prevent="handleSend">
          <div class="space-y-1.5">
            <Label for="bc-title">Título <span class="text-destructive">*</span></Label>
            <Input
              id="bc-title"
              v-model="title"
              placeholder="Ej: Nueva actualización disponible"
              class="h-12 text-base"
              required
            />
          </div>

          <div class="space-y-1.5">
            <Label for="bc-body">Mensaje <span class="text-destructive">*</span></Label>
            <Textarea
              id="bc-body"
              v-model="body"
              placeholder="Escribe el mensaje que recibirán todos los usuarios..."
              rows="3"
              class="text-base"
              required
            />
          </div>

          <Button
            type="submit"
            class="h-12 w-full text-base font-semibold"
            :disabled="!canSend"
          >
            <Loader2 v-if="isSending" class="mr-2 size-4 animate-spin" />
            <Send v-else class="mr-2 size-4" />
            {{ isSending ? 'Enviando...' : 'Enviar a todos' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <!-- History -->
    <div v-if="history.length > 0" class="space-y-3">
      <h2 class="text-lg font-semibold">Historial de envíos</h2>
      <div class="space-y-2">
        <Card v-for="item in history" :key="item.id">
          <CardContent class="flex items-start gap-3 p-4">
            <Megaphone class="mt-0.5 size-4 shrink-0 text-primary" />
            <div class="min-w-0 flex-1">
              <p class="font-medium">{{ item.title }}</p>
              <p class="text-sm text-muted-foreground">{{ item.body }}</p>
              <div class="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock class="size-3" />
                <span>{{ formatDate(item.createdAt) }}</span>
                <span v-if="item.authorName">· {{ item.authorName }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
