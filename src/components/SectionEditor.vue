<template>
  <div class="flex-1 flex flex-col min-h-0 gap-2">
    <Separator class="shrink-0" />

    <div class="flex-1 overflow-y-auto min-h-0">
      <Accordion type="multiple" v-model="openItems" class="flex flex-col gap-2 mb-4">
        <AccordionItem
          v-for="(section, i) in sections"
          :key="i"
          :value="`item-${i}`"
          class="border border-border rounded-xl overflow-hidden bg-card"
        >
          <AccordionTrigger class="px-4 py-3 hover:no-underline hover:bg-muted/50 [&>svg]:text-muted-foreground">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <button
                v-if="mode === 'edit'"
                @click.stop="openDeleteDialog(i)"
                class="shrink-0 text-destructive hover:text-destructive/80 transition-colors bg-destructive/10 hover:bg-destructive/20 rounded-full p-1"
              >
                <X class="size-4" />
              </button>
              <Badge variant="secondary" class="text-xs shrink-0">{{ i + 1 }} / {{ sections.length }}</Badge>
              <span class="text-sm font-medium text-foreground">
                {{ getSectionTitle(section.content) || `區塊 ${i + 1}` }}
              </span>
            </div>
          </AccordionTrigger>

          <AccordionContent class="p-0">
            <div class="border-t border-border" style="min-height:200px; max-height:400px;">
              <textarea
                v-if="mode === 'edit'"
                v-model="section.content"
                @input="markDirty"
                style="min-height:200px; width:100%; max-height:400px;"
                class="block font-mono text-sm bg-background p-4 resize-none focus:outline-none leading-relaxed"
                spellcheck="false"
              />
              <div
                v-else
                class="overflow-y-auto p-4 md-preview text-sm"
                style="min-height:200px; max-height:400px;"
                v-html="renderMd(section.content)"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <!-- 新增區塊按鈕 -->
      <div v-if="mode === 'edit'" class="flex justify-center pb-4">
        <button
          @click="addSection"
          class="size-10 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors"
        >
          <Plus class="size-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  </div>

  <!-- 刪除確認 -->
  <AlertDialog :open="deleteDialogOpen" @update:open="deleteDialogOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>確定刪除此區塊？</AlertDialogTitle>
        <AlertDialogDescription>
          刪除後無法復原，確定要移除這個區塊嗎？
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="deleteDialogOpen = false">取消</AlertDialogCancel>
        <AlertDialogAction @click="confirmDelete" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          刪除
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'
import { X, Plus } from 'lucide-vue-next'
import { authFetch } from '@/service/keep.js'
import { fileStatuses, setStatus } from '@/service/saveStore.js'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel
} from '@/components/ui/alert-dialog'

const props = defineProps({
  filename: { type: String, required: true },
  initialContent: { type: String, default: '' },
  mode: { type: String, default: 'preview' },  // controlled by parent
})

const DIVIDER = '\n\n---\n\n'
const draftKey = `fubon_draft_${props.filename}`

const sections = ref([])
const openItems = ref([])
let initialized = false

function parseContent(raw) {
  return raw
    .split(/\n\n---\n\n|\n---\n/)
    .map(s => ({ content: s.trim() }))
    .filter(s => s.content)
}

function joinSections() {
  return sections.value.map(s => s.content).join(DIVIDER)
}

function initSections(raw) {
  sections.value = parseContent(raw)
  openItems.value = sections.value.map((_, i) => `item-${i}`)
}

// 優先載入草稿，否則等 initialContent 傳入
onMounted(() => {
  const draft = sessionStorage.getItem(draftKey)
  if (draft) {
    initSections(draft)
    setStatus(props.filename, 'dirty')
    initialized = true
  }
})

watch(() => props.initialContent, (val) => {
  if (!initialized && val) {
    initialized = true
    initSections(val)
  }
}, { immediate: true })

function markDirty() {
  const current = joinSections()
  const original = parseContent(props.initialContent).map(s => s.content).join(DIVIDER)
  if (current === original) {
    sessionStorage.removeItem(draftKey)
    setStatus(props.filename, 'idle')
  } else {
    sessionStorage.setItem(draftKey, current)
    setStatus(props.filename, 'dirty')
  }
}

const deleteDialogOpen = ref(false)
const sectionToDelete = ref(null)

function openDeleteDialog(index) {
  sectionToDelete.value = index
  deleteDialogOpen.value = true
}

function confirmDelete() {
  if (sectionToDelete.value !== null) {
    sections.value.splice(sectionToDelete.value, 1)
    openItems.value = sections.value.map((_, i) => `item-${i}`)
    markDirty()
  }
  deleteDialogOpen.value = false
  sectionToDelete.value = null
}

function addSection() {
  sections.value.push({ content: '## 新區塊\n\n在這裡輸入內容…' })
  const newIndex = sections.value.length - 1
  openItems.value = [...openItems.value, `item-${newIndex}`]
  markDirty()
}

function getSectionTitle(content) {
  const match = content.match(/^##?\s+(.+)/m)
  return match ? match[1].trim() : ''
}

function renderMd(content) {
  return marked.parse(content || '')
}

async function doSave() {
  setStatus(props.filename, 'saving')
  try {
    const res = await authFetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: props.filename, content: joinSections() }),
    })
    const data = await res.json()
    if (data.ok) {
      sessionStorage.removeItem(draftKey)
      setStatus(props.filename, 'saved')
      setTimeout(() => setStatus(props.filename, 'idle'), 3000)
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
.md-preview :deep(h1) { font-size: 1.3rem; font-weight: 700; margin: 0.5rem 0; }
.md-preview :deep(h2) { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
.md-preview :deep(h3) { font-size: 1rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
.md-preview :deep(p) { margin: 0.4rem 0; }
.md-preview :deep(ul) { list-style: disc; padding-left: 1.25rem; margin: 0.4rem 0; }
.md-preview :deep(ol) { list-style: decimal; padding-left: 1.25rem; margin: 0.4rem 0; }
.md-preview :deep(li) { margin: 0.2rem 0; }
.md-preview :deep(strong) { font-weight: 600; }
.md-preview :deep(code) { background: hsl(var(--muted)); padding: 0.1em 0.3em; border-radius: 4px; font-size: 0.85em; font-family: monospace; }
.md-preview :deep(blockquote) { border-left: 3px solid hsl(var(--border)); padding-left: 0.75rem; color: hsl(var(--muted-foreground)); font-style: italic; margin: 0.5rem 0; }
.md-preview :deep(hr) { display: none; }
</style>
