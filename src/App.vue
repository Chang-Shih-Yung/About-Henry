<template>
  <div class="h-screen flex flex-col bg-background overflow-hidden">
    <!-- Sticky Nav -->
    <nav v-if="isLoggedIn && !isLoginPage" class="shrink-0 bg-card border-b border-border z-10">
      <div class="max-w-6xl mx-auto px-4 flex items-center gap-1 h-14">
        <span class="text-xs font-bold text-muted-foreground mr-4 tracking-widest uppercase select-none">
          Fubon
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
          <Badge variant="outline" class="text-xs font-normal hidden sm:inline-flex">
            {{ currentUser?.username }}
          </Badge>
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
            <SheetContent side="right" class="w-64 pt-10">
              <SheetHeader class="mb-4">
                <SheetTitle class="text-left text-sm text-muted-foreground tracking-widest uppercase">Fubon</SheetTitle>
              </SheetHeader>
              <nav class="flex flex-col gap-1">
                <RouterLink
                  v-for="item in navItems"
                  :key="item.to"
                  :to="item.to"
                  @click="sheetOpen = false"
                  class="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  :class="$route.path === item.to
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
                >
                  {{ item.label }}
                </RouterLink>
              </nav>
              <div class="mt-6 pt-4 border-t flex items-center justify-between">
                <span class="text-xs text-muted-foreground">{{ currentUser?.username }}</span>
                <Button variant="ghost" size="sm" @click="handleLogout" class="text-muted-foreground h-7 px-2 text-xs">
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { token, currentUser, logout } from '@/service/keep.js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-vue-next'

const sheetOpen = ref(false)

const route = useRoute()
const router = useRouter()

const isLoggedIn = computed(() => !!token.value)
const isLoginPage = computed(() => route.path === '/login')

const navItems = [
  { to: '/intro', label: '自我介紹' },
  { to: '/qa', label: 'Q&A' },
  { to: '/about', label: '關於 Henry' },
]

function handleLogout() {
  logout()
  router.push('/login')
}
</script>
