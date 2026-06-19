import { apiFetch } from './api'

export async function createGroup(sessionToken) {
  return apiFetch('/groups', {
    method: 'POST',
    body: { session_token: sessionToken },
  })
}

export async function joinGroup(groupCode, sessionToken) {
  return apiFetch(`/groups/${groupCode}/join`, {
    method: 'POST',
    body: { session_token: sessionToken },
  })
}

export async function fetchGroup(groupToken, sessionToken) {
  const q = sessionToken ? `?session_token=${encodeURIComponent(sessionToken)}` : ''
  return apiFetch(`/groups/${groupToken}${q}`)
}

export async function sendGroupMessage(groupToken, sessionToken, text) {
  return apiFetch(`/groups/${groupToken}/messages`, {
    method: 'POST',
    body: { session_token: sessionToken, text },
  })
}
