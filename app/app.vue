<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <ClientOnly>
      <Sonner rich-colors expand position="top-center" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Sonner } from '@/components/ui/sonner'
</script>
