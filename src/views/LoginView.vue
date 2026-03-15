<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" @mousemove="onMouseMove">
    <!-- 背景圖 -->
    <div
      class="absolute inset-[-6%] bg-cover bg-center transition-transform duration-75 ease-out"
      :style="{ backgroundImage: 'url(/bg-login.jpg)', transform: `translate(${offset.x}px, ${offset.y}px) scale(1.12)` }"
    />
    <!-- 深色遮罩 -->
    <div class="absolute inset-0 bg-black/65" />

    <Card class="w-full max-w-md shadow-lg relative z-10 bg-black/25 backdrop-blur-md border-white/10 text-white px-4 py-2">
      <CardHeader class="text-center pb-2">
        <div class="mx-auto mb-3 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <svg class="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </div>
        <CardTitle class="text-xl text-white">Henry</CardTitle>
        <CardDescription class="text-white/60">歡迎</CardDescription>
      </CardHeader>

      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Username -->
          <div class="space-y-1.5">
            <Label for="username" class="text-white/80">帳號</Label>
            <div class="relative">
              <Input
                id="username"
                v-model="form.username"
                placeholder="輸入帳號"
                autocomplete="username"
                :class="error ? 'border-destructive' : ''"
              />
              <button
                v-if="rememberedUser && form.username !== rememberedUser"
                type="button"
                @click="fillRemembered"
                class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                </svg>
                {{ rememberedUser }}
              </button>
            </div>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <Label for="password" class="text-white/80">密碼</Label>
            <Input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="輸入密碼"
              autocomplete="current-password"
              :class="error ? 'border-destructive' : ''"
            />
            <p v-if="error" class="text-xs text-destructive">{{ error }}</p>
          </div>

          <!-- Remember me -->
          <div class="flex items-center gap-2">
            <Checkbox id="remember" v-model="form.remember" />
            <Label for="remember" class="text-sm font-normal cursor-pointer text-white/60">
              記住帳號
            </Label>
          </div>

          <Button type="submit" class="w-full bg-white text-black hover:bg-white/90" :disabled="loading">
            <svg v-if="loading" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            {{ loading ? '登入中…' : '登入' }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="justify-center pt-0" />
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { login, getRememberedUser, saveRememberedUser, clearRememberedUser } from '@/service/keep.js'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const router = useRouter()

const form = ref({ username: '', password: '', remember: false })
const error = ref('')
const loading = ref(false)
const rememberedUser = ref('')
const offset = ref({ x: 0, y: 0 })

const DEFAULT_USER = 'henry1010921@gmail.com'

onMounted(() => {
  const saved = getRememberedUser()
  const username = saved || DEFAULT_USER
  rememberedUser.value = username
  form.value.username = username
  form.value.remember = !!saved

  // 陀螺儀（手機）
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', onGyro)
  }
})

onUnmounted(() => {
  window.removeEventListener('deviceorientation', onGyro)
})

// 滑鼠視差（桌面）
function onMouseMove(e) {
  if (window.matchMedia('(hover: none)').matches) return
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  offset.value = {
    x: ((e.clientX - cx) / cx) * -12,
    y: ((e.clientY - cy) / cy) * -8,
  }
}

// 陀螺儀視差（手機）
function onGyro(e) {
  if (!window.matchMedia('(hover: none)').matches) return
  const gamma = Math.max(-30, Math.min(30, e.gamma || 0)) // 左右傾斜
  const beta  = Math.max(-30, Math.min(30, (e.beta || 0) - 45)) // 前後傾斜，減 45 為自然握持角度
  offset.value = {
    x: (gamma / 30) * -12,
    y: (beta  / 30) * -8,
  }
}

function fillRemembered() {
  form.value.username = rememberedUser.value
  form.value.remember = true
}

async function handleLogin() {
  error.value = ''
  if (!form.value.username || !form.value.password) {
    error.value = '請輸入帳號與密碼'
    return
  }

  loading.value = true
  await new Promise(r => setTimeout(r, 400))

  const ok = login(form.value.username, form.value.password)
  loading.value = false

  if (!ok) {
    error.value = '帳號或密碼錯誤'
    return
  }

  if (form.value.remember) {
    saveRememberedUser(form.value.username)
  } else {
    clearRememberedUser()
  }

  router.push('/intro')
}
</script>
