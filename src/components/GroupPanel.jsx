import { useState, useRef, useEffect } from 'react'
import { fetchGroup, sendGroupMessage } from '../lib/group'
import { showToast } from '../lib/toast'

export default function GroupPanel({ group, sess, totalPlaces, onClose, onUpdate }) {
  const [tab, setTab] = useState('members')
  const [members, setMembers] = useState(group.members || [])
  const [messages, setMessages] = useState(group.messages || [])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    if (tab === 'chat') endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, tab])

  async function refresh() {
    try {
      const data = await fetchGroup(group.group_token, sess?.session_token)
      setMembers(data.members || [])
      setMessages(data.messages || [])
      onUpdate(data)
    } catch {}
  }

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await sendGroupMessage(group.group_token, sess?.session_token, text.trim())
      setText('')
      await refresh()
    } catch {
      showToast('Kunde inte skicka meddelande', 'wrong')
    } finally {
      setSending(false)
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(group.group_code)
      .then(() => showToast('Gruppkod kopierad!', 'info'))
  }

  const totalVisited = new Set(members.flatMap(m => m.visited_places || [])).size

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet" style={{ maxHeight: '88vh' }}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <button className="sh-action" onClick={onClose}>Stäng</button>
          <div className="sheet-title">Grupp</div>
          <button className="sh-action" onClick={copyCode}>{group.group_code}</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {[['members', `Spelare (${members.length})`], ['chat', 'Chatt']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '11px', background: 'none', border: 'none',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                color: tab === key ? 'var(--accent)' : 'var(--text2)',
                borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
              }}
            >{label}</button>
          ))}
        </div>

        {tab === 'members' && (
          <div className="sheet-body">
            <div style={{ display: 'flex', padding: '12px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', gap: 0 }}>
              {[
                [members.length, 'Spelare'],
                [totalVisited, 'Unika besökta'],
                [totalPlaces, 'Totalt'],
              ].map(([val, lbl]) => (
                <div key={lbl} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>

            {members.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text2)', fontSize: 14 }}>
                Inga spelare ännu.<br />Dela gruppkoden <strong>{group.group_code}</strong> med dina medspelare.
              </div>
            )}

            {members.map(m => {
              const visited = (m.visited_places || []).length
              const isActive = m.last_seen && (Date.now() - new Date(m.last_seen).getTime()) < 120000
              const pct = totalPlaces ? visited / totalPlaces * 100 : 0
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'rgba(249,115,22,.15)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 17,
                    }}>
                      {(m.name || '?')[0].toUpperCase()}
                    </div>
                    {isActive && (
                      <div style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--sheet-bg)' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{m.name || 'Anonym'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>{visited} av {totalPlaces} platser</div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width .4s' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14, marginTop: 24 }}>
                  Ingen har skrivit något än.
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 3 }}>{msg.sender_name}</div>
                  <div style={{ background: 'var(--bg3)', borderRadius: 12, borderTopLeftRadius: 4, padding: '9px 13px', fontSize: 14, maxWidth: '85%', lineHeight: 1.5 }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 3 }}>
                    {new Date(msg.sent_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, paddingBottom: 'calc(10px + var(--safe-bottom))' }}>
              <input
                className="form-input"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Skriv ett meddelande…"
                style={{ flex: 1, fontSize: 14, padding: '10px 14px' }}
              />
              <button
                className="btn btn-primary"
                style={{ padding: '10px 16px', fontSize: 18 }}
                onClick={send}
                disabled={!text.trim() || sending}
              >↑</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
