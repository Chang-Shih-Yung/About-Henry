<template>
  <div class="h-full flex flex-col">
    <div class="mb-2 shrink-0 flex items-center gap-3">
      <h1 class="text-xl font-bold text-foreground shrink-0">Intro</h1>
      <p class="text-sm text-muted-foreground hidden sm:block">
        編輯 <code class="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">Intro.md</code>
      </p>
      <div class="ml-auto flex items-center gap-2">
        <!-- Mode toggle -->
        <div class="flex gap-1 bg-muted p-1 rounded-lg">
          <button
            v-for="m in modes" :key="m.key" @click="!isOnline && m.key === 'edit' ? null : mode = m.key"
            class="px-3 py-1 text-xs rounded-md font-medium transition-colors"
            :class="[mode === m.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground', !isOnline && m.key === 'edit' ? 'opacity-30 cursor-not-allowed' : '']"
          >{{ m.label }}</button>
        </div>
        <span v-if="!isOnline" class="text-xs text-muted-foreground">離線中</span>
        <span v-else-if="status === 'dirty'" class="text-xs text-amber-500">未儲存</span>
        <span v-else-if="status === 'saved'" class="text-xs text-emerald-600">已儲存</span>
        <span v-else-if="status === 'error'" class="text-xs text-destructive">失敗</span>
        <Button size="sm" class="h-7 px-3 text-xs" :disabled="!isOnline || (status !== 'dirty' && status !== 'error')" @click="editorRef?.doSave()">
          <svg v-if="status === 'saving'" class="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          儲存
        </Button>
      </div>
    </div>
    <MarkdownEditor v-if="loaded" ref="editorRef" class="flex-1 min-h-0" filename="Intro.md" :initial-content="content" :mode="mode" />
    <div v-else class="flex items-center justify-center py-20 text-muted-foreground text-sm">載入中…</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import { authFetch } from '@/service/keep.js'
import { fileStatuses } from '@/service/saveStore.js'
import { isOnline } from '@/composables/useOnline.js'
import { Button } from '@/components/ui/button'

const content = ref('')
const loaded = ref(false)
const mode = ref('preview')
const editorRef = ref(null)
const modes = [{ key: 'edit', label: '編輯' }, { key: 'preview', label: '預覽' }]
const status = computed(() => fileStatuses['Intro.md'] || 'idle')

watch(isOnline, (online) => { if (!online) mode.value = 'preview' })

onMounted(async () => {
  try {
    const res = await authFetch('/api/load?filename=Intro.md')
    const data = await res.json()
    content.value = data.content || ''
  } catch { content.value = '' }
  loaded.value = true
})
</script>
