'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_username: string;
}

interface Conversation {
  other_user_id: string;
  other_name: string;
  other_username: string;
  last_message: string;
  last_message_time: string;
  last_sender_id: string;
  unread_count: number;
}

interface UserResult {
  id: string;
  name: string;
  username: string;
  phone: string;
  email: string;
}

function ChatContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUserId = searchParams.get('with');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(withUserId);
  const [activeChatName, setActiveChatName] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getToken = () => localStorage.getItem('dp_token');

  const fetchConversations = useCallback(async () => {
    const token = getToken();
    try {
      const res = await axios.get('/api/messages', { headers: { Authorization: `Bearer ${token}` } });
      setConversations(res.data.conversations || []);
    } catch { /* silent */ }
  }, []);

  const fetchMessages = useCallback(async (uid: string) => {
    const token = getToken();
    try {
      const res = await axios.get(`/api/messages?with=${uid}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data.messages || []);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      if (activeChat) fetchMessages(activeChat);
    }
  }, [user, fetchConversations, fetchMessages, activeChat]);

  // Auto-poll for new messages every 5s
  useEffect(() => {
    if (activeChat && user) {
      pollRef.current = setInterval(() => fetchMessages(activeChat), 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChat, user, fetchMessages]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const token = getToken();
        const res = await axios.get(`/api/user/search?q=${searchQuery}`, { headers: { Authorization: `Bearer ${token}` } });
        setSearchResults(res.data.users.filter((u: UserResult) => u.id !== user?.id));
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const openChat = (uid: string, name: string) => {
    setActiveChat(uid);
    setActiveChatName(name);
    setSearchQuery('');
    setSearchResults([]);
    fetchMessages(uid);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChat) return;
    setSending(true);
    try {
      const token = getToken();
      await axios.post('/api/messages', { recipientId: activeChat, content: input.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setInput('');
      fetchMessages(activeChat);
      fetchConversations();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) toast.error(err.response.data.error);
    } finally { setSending(false); }
  };

  return (
    <AppLayout>
      <div style={{ paddingBottom: 0 }}>
        <div className="page-header">
          <h1>💬 Messages</h1>
          <p>Chat with other Dena-Paona users</p>
        </div>

        <div style={{ display: 'flex', height: 'calc(100vh - 130px)', overflow: 'hidden' }}>
          {/* Sidebar - Conversations */}
          <div style={{ width: 280, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--bg-secondary)' }}>
            {/* Search */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              <div className="search-bar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="form-input input-with-icon"
                  placeholder="Search users to chat..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>

              {/* Search results dropdown */}
              {(searchResults.length > 0 || searching) && (
                <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-card)' }}>
                  {searching && <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>Searching...</div>}
                  {searchResults.map(u => (
                    <div
                      key={u.id}
                      onClick={() => openChat(u.id, u.name)}
                      style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <div className="avatar avatar-sm">{u.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversations list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.length === 0 ? (
                <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No conversations yet.<br />Search for a user to start chatting.
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.other_user_id}
                    onClick={() => openChat(conv.other_user_id, conv.other_name)}
                    style={{
                      display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px',
                      cursor: 'pointer', transition: 'background 0.15s',
                      background: activeChat === conv.other_user_id ? 'rgba(99,102,241,0.1)' : '',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => { if (activeChat !== conv.other_user_id) e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                    onMouseLeave={e => { if (activeChat !== conv.other_user_id) e.currentTarget.style.background = ''; }}
                  >
                    <div style={{ position: 'relative' }}>
                      <div className="avatar avatar-sm">{conv.other_name.charAt(0)}</div>
                      {conv.unread_count > 0 && (
                        <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--accent-red)', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{conv.other_name}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{format(new Date(conv.last_message_time), 'hh:mm a')}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.last_sender_id === user?.id ? 'You: ' : ''}{conv.last_message}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!activeChat ? (
              <div className="empty-state" style={{ flex: 1 }}>
                <div className="empty-state-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Search for a user to start a new chat</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar avatar-sm">{activeChatName.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{activeChatName}</div>
                    <div style={{ fontSize: 11, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
                      Active
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 40 }}>
                      No messages yet. Say hello! 👋
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMine = msg.sender_id === user?.id;
                    const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime() > 5 * 60 * 1000;
                    return (
                      <div key={msg.id}>
                        {showTime && (
                          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', margin: '8px 0' }}>
                            {format(new Date(msg.created_at), 'dd MMM, hh:mm a')}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: isMine ? 'linear-gradient(135deg, var(--accent-purple), #7c3aed)' : 'var(--bg-card)',
                            color: isMine ? 'white' : 'var(--text-primary)',
                            border: isMine ? 'none' : '1px solid var(--border)',
                            fontSize: 14, lineHeight: 1.5,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', gap: 10 }}>
                  <input
                    className="form-input"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    style={{ flex: 1, borderRadius: 24 }}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()} style={{ borderRadius: 24, padding: '10px 20px' }}>
                    {sending ? '⟳' : '📨 Send'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<AppLayout><div style={{ padding: 32 }}><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></div></AppLayout>}>
      <ChatContent />
    </Suspense>
  );
}
