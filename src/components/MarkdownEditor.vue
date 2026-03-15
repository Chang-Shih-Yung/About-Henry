<template>
  <div class="flex-1 flex flex-col min-h-0 gap-2">
    <Separator class="shrink-0" />

    <textarea
      v-if="mode === 'edit'"
      v-model="localContent"
      @input="markDirty"
      class="flex-1 min-h-0 w-full font-mono text-sm bg-background border border-input rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed"
      placeholder="在這裡輸入 Markdown 內容…"
      spellcheck="false"
    />
    <div
      v-else
      class="flex-1 min-h-0 overflow-y-auto bg-card border border-border rounded-xl p-6 md-preview"
      v-html="renderedHtml"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'
import { authFetch } from '@/service/keep.js'
import { setStatus } from '@/service/saveStore.js'
import { Separator } from '@/components/ui/separator'

const props = defineProps({
  filename: { type: String, required: true },
  initialContent: { type: String, default: '' },
  mode: { type: String, default: 'preview' },
})

const draftKey = `fubon_draft_${props.filename}`
const localContent = ref('')
let initialized = false

onMounted(() => {
  const draft = sessionStorage.getItem(draftKey)
  if (draft) {
    localContent.value = draft
    setStatus(props.filename, 'dirty')
    initialized = true
  }
})

watch(() => props.initialContent, (val) => {
  if (!initialized && val) {
    initialized = true
    localContent.value = val
  }
}, { immediate: true })

function markDirty() {
  setStatus(props.filename, 'dirty')
  sessionStorage.setItem(draftKey, localContent.value)
}

const renderedHtml = computed(() => marked.parse(localContent.value || ''))

async function doSave() {
  setStatus(props.filename, 'saving')
  try {
    const res = await authFetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: props.filename, content: localContent.value }),
    })
    const data = await res.json()
    if (data.ok) {
      sessionStorage.removeItem(draftKey)
      setStatus(props.filename, 'saved')
    } else {
      setStatus(props.filename, 'error')
    }
  } catch {
    setStatus(props.filename, 'error')
  }
}

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    doSave()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

defineExpose({ doSave })
</script>

<style scoped>
.md-preview { color: hsl(var(--foreground)); line-height: 1.75; }
.md-preview :deep(h1) { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
.md-preview :deep(h2) { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; border-bottom: 1px solid hsl(var(--border)); padding-bottom: 0.25rem; }
.md-preview :deep(h3) { font-size: 1.05rem; font-weight: 600; margin: 0.75rem 0 0.25rem; }
.md-preview :deep(p) { margin: 0.5rem 0; }
.md-preview :deep(ul) { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
.md-preview :deep(ol) { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
.md-preview :deep(li) { margin: 0.25rem 0; }
.md-preview :deep(strong) { font-weight: 600; }
.md-preview :deep(code) { background: hsl(var(--muted)); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.875em; font-family: monospace; }
.md-preview :deep(pre) { background: hsl(var(--muted)); padding: 1rem; border-radius: 8px; overflow-x: auto; }
.md-preview :deep(blockquote) { border-left: 3px solid hsl(var(--border)); padding-left: 1rem; color: hsl(var(--muted-foreground)); font-style: italic; margin: 0.75rem 0; }
.md-preview :deep(hr) { border: none; border-top: 1px solid hsl(var(--border)); margin: 1rem 0; }
.md-preview :deep(a) { color: hsl(var(--primary)); text-decoration: underline; }
</style>
