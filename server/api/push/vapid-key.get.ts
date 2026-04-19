import { getVapidPublicKey } from '~~/server/utils/web-push'

export default defineEventHandler(() => {
  return { data: { publicKey: getVapidPublicKey() } }
})
