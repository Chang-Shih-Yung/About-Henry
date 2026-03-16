<template>
  <div class="h-dvh flex flex-col bg-background overflow-hidden">
    <!-- Sticky Nav -->
    <nav v-if="isLoggedIn && !isLoginPage" class="shrink-0 bg-card border-b border-border z-10">
      <div class="max-w-6xl mx-auto px-4 flex items-center gap-1 h-14">
        <span class="text-xs font-bold text-muted-foreground mr-4 tracking-widest uppercase select-none">
          Henry
        </span>

        <!-- Desktop nav -->
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="hidden sm:block px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          :class="$route.path === item.to
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
        >
          {{ item.label }}
        </RouterLink>

        <div class="ml-auto flex items-center gap-2">
          <!-- 桌面：完整文字 badge -->
          <Badge variant="secondary" class="text-xs font-normal hidden sm:inline-flex gap-1.5 items-center" :class="isOnline ? 'text-emerald-500' : 'text-muted-foreground'">
            <span class="size-1.5 rounded-full" :class="isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'"></span>
            {{ isOnline ? '連線中' : '離線中' }}
          </Badge>
          <!-- 手機：只顯示圓點 -->
          <span class="sm:hidden size-2 rounded-full" :class="isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'"></span>
          <Badge variant="outline" class="text-xs font-normal hidden sm:inline-flex">
            {{ currentUser?.username }}
          </Badge>
          <Button variant="ghost" size="icon" @click="toggleDark()" class="h-8 w-8 text-muted-foreground">
            <Sun v-if="isDark" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" @click="handleLogout" class="hidden sm:inline-flex text-muted-foreground h-7 px-2 text-xs">
            登出
          </Button>

          <!-- Mobile hamburger -->
          <Sheet v-model:open="sheetOpen">
            <SheetTrigger as-child>
              <Button variant="ghost" size="icon" class="sm:hidden h-8 w-8">
                <Menu class="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" class="w-full flex flex-col p-0 bg-background/60 backdrop-blur-xl border-l-0" :aria-describedby="undefined">
              <!-- Header -->
              <div class="flex items-center justify-between px-6 py-5 border-b">
                <SheetTitle class="text-sm font-semibold tracking-widest uppercase text-foreground">Henry</SheetTitle>
              </div>

              <!-- Nav links -->
              <nav class="flex flex-col px-4 py-4 gap-0.5 flex-1">
                <p class="text-xs text-muted-foreground px-2 mb-2 tracking-wide">選單</p>
                <RouterLink
                  v-for="item in navItems"
                  :key="item.to"
                  :to="item.to"
                  @click="sheetOpen = false"
                  class="px-2 py-2.5 text-base font-medium transition-colors rounded-md"
                  :class="$route.path === item.to
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'"
                >
                  {{ item.label }}
                </RouterLink>
              </nav>

              <!-- Footer -->
              <div class="px-6 py-5 border-t flex items-center justify-between">
                <span class="text-xs text-muted-foreground truncate max-w-[140px]">{{ currentUser?.username }}</span>
                <Button variant="ghost" size="sm" @click="handleLogout" class="text-muted-foreground h-7 px-2 text-xs shrink-0">
                  登出
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>

    <!-- Main：flex-1 讓它佔滿剩餘高度 -->
    <main class="flex-1 overflow-hidden" :class="isLoggedIn && !isLoginPage ? 'max-w-6xl w-full mx-auto px-4 py-5' : ''">
      <RouterView />
    </main>

    <!-- 未儲存警告 -->
    <AlertDialog v-model:open="showLogoutDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確定要登出？</AlertDialogTitle>
          <AlertDialogDescription>
            目前有尚未儲存的內容，登出後將會遺失。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction @click="doLogout">仍要登出</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'
import { token, currentUser, logout } from '@/service/keep.js'
import { fileStatuses } from '@/service/saveStore.js'
import { isOnline } from '@/composables/useOnline.js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Menu, Sun, Moon } from 'lucide-vue-next'

const sheetOpen = ref(false)
const showLogoutDialog = ref(false)
const isDark = useDark()
const toggleDark = useToggle(isDark)

const route = useRoute()
const router = useRouter()

const isLoggedIn = computed(() => !!token.value)
const isLoginPage = computed(() => route.path === '/login')

const navItems = [
  { to: '/intro', label: 'Intro' },
  { to: '/qa', label: 'Q&A' },
  { to: '/about', label: 'About' },
]

const hasDirty = computed(() =>
  Object.values(fileStatuses).some(s => s === 'dirty')
)

function handleLogout() {
  if (hasDirty.value) {
    showLogoutDialog.value = true
  } else {
    doLogout()
  }
}

function doLogout() {
  sheetOpen.value = false
  logout()
  router.push('/login')
}
</script>
