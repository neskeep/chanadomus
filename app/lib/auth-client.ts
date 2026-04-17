import { createAuthClient } from 'better-auth/vue'
import { adminClient } from 'better-auth/client/plugins'
import { ac } from '~~/shared/lib/permissions'

export const authClient = createAuthClient({
  plugins: [
    adminClient({ ac }),
  ],
})
