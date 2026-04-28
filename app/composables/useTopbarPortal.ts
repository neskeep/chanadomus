export function useTopbarPortal() {
  const target = '#topbar-actions'
  const isMounted = ref(false)

  onMounted(() => {
    isMounted.value = true
  })

  onBeforeUnmount(() => {
    isMounted.value = false
  })

  return { target, isMounted }
}
