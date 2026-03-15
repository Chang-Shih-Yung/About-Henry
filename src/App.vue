<template>
  <div class="h-screen flex flex-col bg-background overflow-hidden">
    <!-- Sticky Nav -->
    <nav v-if="isLoggedIn && !isLoginPage" class="shrink-0 bg-card border-b border-border z-10">
      <div class="max-w-6xl mx-auto px-4 flex items-center gap-1 h-14">
        <span class="text-xs font-bold text-muted-foreground mr-4 tracking-widest uppercase select-none">
          Fubon
        </span>

        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          :class="$route.path === item.to
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'"
        >
          {{ item.label }}
        </RouterLink>

        <div class="ml-auto flex items-center gap-2">
          <Badge variant="outline" class="text-xs font-normal">
            {{ currentUser?.username }}
          </Badge>
          <Button variant="ghost" size="sm" @click="handleLogout" class="text-muted-foreground h-7 px-2 text-xs">
            登出
          </Button>
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { token, currentUser, logout } from '@/service/keep.js'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
