export function useTopbarPortal() {
  const target = '#topbar-actions'
  const mobileTarget = '#topbar-actions-mobile'
  const isMounted = ref(false)

  onMounted(() => {
    isMounted.value = true
  })

  onBeforeUnmount(() => {
    isMounted.value = false
  })

  return { target, mobileTarget, isMounted }
}
