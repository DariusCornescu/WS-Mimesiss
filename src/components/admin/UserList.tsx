'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  FaClipboardCheck,
  FaCrown,
  FaEdit,
  FaEllipsisV,
  FaQrcode,
  FaSave,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUser
} from 'react-icons/fa'
import { deleteUser, updateUserRole } from '@/app/admin/users/actions'
import type { User, UserType } from '@/types/models'
import SimpleUserQRCode from '@/components/SimpleUserQRCode'

interface UserListProps {
  users: User[]
  currentUserId: string
  onRefresh?: () => Promise<void>
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
    />
  )
}

export default function UserList({ users, currentUserId, onRefresh }: UserListProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const [qrPopupUserId, setQrPopupUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editData, setEditData] = useState<{
    role: 'user' | 'admin' | 'moderator',
    userType: UserType | '',
  }>({ role: 'user', userType: '' })
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const router = useRouter()

  useEffect(() => {
    const hasModal = Boolean(editingUserId || deletingUserId || qrPopupUserId)
    const hasDismissibleLayer = hasModal || Boolean(dropdownOpen)

    if (!hasDismissibleLayer) return

    const previousOverflow = document.body.style.overflow
    if (hasModal) document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isPending) return

      if (dropdownOpen) {
        setDropdownOpen(null)
      } else if (editingUserId) {
        setEditingUserId(null)
        setMessage('')
        setError('')
      } else if (deletingUserId) {
        setDeletingUserId(null)
        setMessage('')
        setError('')
      } else if (qrPopupUserId) {
        setQrPopupUserId(null)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      if (hasModal) document.body.style.overflow = previousOverflow
    }
  }, [deletingUserId, dropdownOpen, editingUserId, isPending, qrPopupUserId])

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users
    }

    const query = searchQuery.toLowerCase()
    return users.filter(user => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
      const email = user.email.toLowerCase()
      const role = user.role.toLowerCase()
      const userType = (user.userType || '').toLowerCase()

      return name.includes(query) ||
        email.includes(query) ||
        role.includes(query) ||
        userType.includes(query)
    })
  }, [users, searchQuery])

  const handleEdit = (user: User) => {
    setEditingUserId(user.clerkId)
    setEditData({
      role: user.role,
      userType: user.userType || '',
    })
    setMessage('')
    setError('')
  }

  const handleSave = async (userId: string) => {
    startTransition(async () => {
      try {
        setError('')
        const formData = new FormData()
        formData.append('userId', userId)
        formData.append('role', editData.role)
        formData.append('userType', editData.userType)

        const result = await updateUserRole(formData)
        setMessage(result.message)
        setEditingUserId(null)

        // Refresh the component data
        if (onRefresh) {
          await onRefresh()
        }

      } catch (err) {
        console.error('Error updating user:', err)
        setError(err instanceof Error ? err.message : 'A apărut o eroare.')
      }
    })
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setMessage('')
    setError('')
  }

  const handleDeleteUser = (userId: string) => {
    setDeletingUserId(userId)
    setMessage('')
    setError('')
  }

  const confirmDeleteUser = async (userId: string) => {
    startTransition(async () => {
      try {
        setError('')
        const formData = new FormData()
        formData.append('userId', userId)

        const result = await deleteUser(formData)
        setMessage(result.message)
        setDeletingUserId(null)

        // Refresh the component data
        if (onRefresh) {
          await onRefresh()
        }
      } catch (err) {
        console.error('Error deleting user:', err)
        setError(err instanceof Error ? err.message : 'A apărut o eroare.')
      }
    })
  }

  const cancelDeleteUser = () => {
    setDeletingUserId(null)
    setMessage('')
    setError('')
  }

  const handleAttendancePage = (userId: string) => {
    setDropdownOpen(null)
    router.push(`/admin/attendance/${userId}`)
  }

  const handleShowQR = (userId: string) => {
    setDropdownOpen(null)
    setQrPopupUserId(userId)
  }

  const closeQRPopup = () => {
    setQrPopupUserId(null)
  }

  const toggleDropdown = (userId: string) => {
    setDropdownOpen(dropdownOpen === userId ? null : userId)
  }

  const closeDropdown = () => {
    setDropdownOpen(null)
  }

  const formatDate = (date: Date | number | null) => {
    if (!date) return 'Niciodată'
    return new Date(date).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName} ${user.lastName}`.trim()
    }
    return user.email.split('@')[0]
  }

  const editingUser = editingUserId
    ? users.find(user => user.clerkId === editingUserId)
    : undefined
  const deletingUser = deletingUserId
    ? users.find(user => user.clerkId === deletingUserId)
    : undefined
  const qrUser = qrPopupUserId
    ? users.find(user => user.clerkId === qrPopupUserId)
    : undefined

  const getRoleLabel = (role: User['role']) => {
    if (role === 'admin') return 'Administrator'
    if (role === 'moderator') return 'Moderator'
    return 'Utilizator'
  }

  const renderRoleBadge = (user: User) => {
    const roleStyles = user.role === 'admin'
      ? 'border-secondary/30 bg-secondary/10 text-secondary'
      : user.role === 'moderator'
        ? 'border-accent/30 bg-accent/10 text-accent'
        : 'border-border bg-muted text-foreground'

    return (
      <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${roleStyles}`}>
        {user.role === 'admin' && <FaCrown aria-hidden="true" className="mr-1.5 h-3 w-3" />}
        {getRoleLabel(user.role)}
      </span>
    )
  }

  const renderSyncBadge = (user: User) => (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
      user._id
        ? 'border-secondary/30 bg-secondary/10 text-secondary'
        : 'border-accent/30 bg-accent/10 text-accent'
    }`}>
      {user._id ? 'Sincronizat' : 'Doar în Clerk'}
    </span>
  )

  const renderActionMenu = (user: User, instance: 'mobile' | 'desktop') => {
    const isCurrentUser = user.clerkId === currentUserId
    const isOpen = dropdownOpen === user.clerkId
    const menuId = `${instance}-user-actions-${user.clerkId}`
    const triggerId = `${menuId}-trigger`

    const focusMenuItem = (position: 'first' | 'last') => {
      setDropdownOpen(user.clerkId)
      window.requestAnimationFrame(() => {
        const menu = document.getElementById(menuId)
        const items = menu?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
        const item = position === 'first' ? items?.[0] : items?.[items.length - 1]
        item?.focus()
      })
    }

    return (
      <div className="relative flex-shrink-0">
        <button
          id={triggerId}
          type="button"
          onClick={() => toggleDropdown(user.clerkId)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              focusMenuItem(event.key === 'ArrowDown' ? 'first' : 'last')
            }
          }}
          disabled={isPending || editingUserId !== null || deletingUserId !== null}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Acțiuni pentru ${getDisplayName(user)}`}
          aria-controls={menuId}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <FaEllipsisV aria-hidden="true" className="h-4 w-4" />
        </button>

        {isOpen && (
          <>
            <button
              type="button"
              tabIndex={-1}
              className="fixed inset-0 z-30 cursor-default bg-transparent"
              onClick={closeDropdown}
              aria-label="Închide meniul de acțiuni"
            />
            <div
              id={menuId}
              role="menu"
              aria-label={`Acțiuni pentru ${getDisplayName(user)}`}
              className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-56 overflow-hidden rounded-xl border border-border bg-card p-1.5 shadow-2xl"
              onKeyDown={(event) => {
                const items = Array.from(
                  event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')
                )
                const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement)

                if (event.key === 'Escape') {
                  event.preventDefault()
                  event.stopPropagation()
                  closeDropdown()
                  document.getElementById(triggerId)?.focus()
                } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  const direction = event.key === 'ArrowDown' ? 1 : -1
                  const nextIndex = currentIndex < 0
                    ? 0
                    : (currentIndex + direction + items.length) % items.length
                  items[nextIndex]?.focus()
                } else if (event.key === 'Home' || event.key === 'End') {
                  event.preventDefault()
                  items[event.key === 'Home' ? 0 : items.length - 1]?.focus()
                }
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  handleEdit(user)
                  closeDropdown()
                }}
                disabled={isCurrentUser}
                className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaEdit aria-hidden="true" className="mr-3 h-4 w-4" />
                Editează
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleAttendancePage(user.clerkId)}
                className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <FaClipboardCheck aria-hidden="true" className="mr-3 h-4 w-4" />
                Prezență
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => handleShowQR(user.clerkId)}
                className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <FaQrcode aria-hidden="true" className="mr-3 h-4 w-4" />
                Cod QR
              </button>

              <div className="my-1 border-t border-border" role="separator" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  handleDeleteUser(user.clerkId)
                  closeDropdown()
                }}
                disabled={isCurrentUser}
                className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaTrash aria-hidden="true" className="mr-3 h-4 w-4" />
                Șterge
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {message && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-secondary/30 bg-secondary/10 p-4"
        >
          <p className="text-sm font-medium text-secondary">{message}</p>
        </div>
      )}

      {error && !editingUser && !deletingUser && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card/80 p-3 shadow-sm sm:p-4">
        <label htmlFor="user-search" className="sr-only">
          Caută utilizatori
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <FaSearch aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            id="user-search"
            type="search"
            placeholder="Caută după nume, email, rol sau tip de cont"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="block min-h-12 w-full rounded-xl border border-input bg-background py-3 pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              aria-label="Șterge căutarea"
            >
              <FaTimes aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-1 text-sm text-muted-foreground" aria-live="polite">
        <p>
          {searchQuery ? (
            <>
              <span className="font-semibold text-foreground">{filteredUsers.length}</span> rezultate din{' '}
              <span className="font-semibold text-foreground">{users.length}</span> utilizatori
            </>
          ) : (
            <>
              <span className="font-semibold text-foreground">{users.length}</span> utilizatori în total
            </>
          )}
        </p>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center text-muted-foreground">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted">
            <FaSearch aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="text-base font-semibold text-foreground">Niciun utilizator găsit</p>
          <p className="mt-1 max-w-sm text-sm">Încearcă să modifici criteriile de căutare.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {filteredUsers.map(user => {
              const isCurrentUser = user.clerkId === currentUserId

              return (
                <article
                  key={user.clerkId}
                  className={`relative rounded-2xl border bg-card p-4 shadow-sm ${
                    isCurrentUser ? 'border-accent/50 ring-1 ring-accent/20' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <FaUser aria-hidden="true" className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {getDisplayName(user)}
                          </h3>
                          {isCurrentUser && (
                            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                              Tu
                            </span>
                          )}
                        </div>
                        <p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {renderActionMenu(user, 'mobile')}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {renderRoleBadge(user)}
                    {renderSyncBadge(user)}
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tip cont</dt>
                      <dd className="mt-1 font-medium text-foreground">{user.userType || 'Nespecificat'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Înregistrat</dt>
                      <dd className="mt-1 text-xs leading-5 text-foreground">{formatDate(user.createdAt)}</dd>
                    </div>
                  </dl>
                </article>
              )
            })}
          </div>

          <div className="hidden rounded-2xl border border-border bg-card shadow-sm lg:block">
            <table className="w-full table-fixed">
              <caption className="sr-only">Lista utilizatorilor și acțiunile administrative disponibile</caption>
              <thead className="border-b border-border bg-primary/10">
                <tr>
                  <th scope="col" className="w-[20%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Utilizator
                  </th>
                  <th scope="col" className="w-[22%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </th>
                  <th scope="col" className="w-[14%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Rol
                  </th>
                  <th scope="col" className="hidden w-[16%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground xl:table-cell">
                    Înregistrat
                  </th>
                  <th scope="col" className="hidden w-[10%] px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground xl:table-cell">
                    Tip cont
                  </th>
                  <th scope="col" className="w-[18%] px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Acțiuni
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map(user => {
                  const isCurrentUser = user.clerkId === currentUserId

                  return (
                    <tr key={user.clerkId} className={`transition-colors hover:bg-muted/50 ${isCurrentUser ? 'bg-accent/10' : ''}`}>
                      <td className={`px-5 py-4 ${isCurrentUser ? 'border-l-4 border-l-accent pl-4' : ''}`}>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                            <FaUser aria-hidden="true" className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-foreground">{getDisplayName(user)}</span>
                              {isCurrentUser && (
                                <span className="flex-shrink-0 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                                  Tu
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.userType || 'Tip nespecificat'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="truncate text-sm text-foreground" title={user.email}>{user.email}</p>
                      </td>
                      <td className="px-5 py-4">{renderRoleBadge(user)}</td>
                      <td className="hidden px-5 py-4 text-xs leading-5 text-muted-foreground xl:table-cell">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="hidden px-5 py-4 text-sm font-medium text-foreground xl:table-cell">
                        {user.userType || 'Nespecificat'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {renderSyncBadge(user)}
                          {renderActionMenu(user, 'desktop')}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Închide formularul de editare"
            className="absolute inset-0 bg-background/85 backdrop-blur-sm"
            onClick={handleCancelEdit}
            disabled={isPending}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
            aria-describedby="edit-user-description"
            aria-busy={isPending}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                <FaEdit aria-hidden="true" className="h-4 w-4" />
              </div>
              <div>
                <h2 id="edit-user-title" className="text-lg font-semibold text-foreground">
                  Editează utilizatorul
                </h2>
                <p id="edit-user-description" className="mt-1 text-sm text-muted-foreground">
                  {getDisplayName(editingUser)} · {editingUser.email}
                </p>
              </div>
            </div>

            {error && (
              <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-user-role" className="mb-1.5 block text-sm font-medium text-foreground">
                  Rol
                </label>
                <select
                  id="edit-user-role"
                  autoFocus
                  value={editData.role}
                  onChange={(event) => setEditData({ ...editData, role: event.target.value as 'user' | 'admin' | 'moderator' })}
                  className="min-h-12 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
                  disabled={isPending}
                >
                  <option value="user">Utilizator</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-user-type" className="mb-1.5 block text-sm font-medium text-foreground">
                  Tip utilizator
                </label>
                <select
                  id="edit-user-type"
                  value={editData.userType}
                  onChange={(event) => setEditData({ ...editData, userType: event.target.value as UserType })}
                  className="min-h-12 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50"
                  disabled={isPending}
                >
                  <option value="">Selectează tip</option>
                  <option value="student">Student</option>
                  <option value="elev">Elev</option>
                  <option value="rezident">Rezident</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-muted px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={() => handleSave(editingUser.clerkId)}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-50"
              >
                {isPending ? <Spinner /> : <FaSave aria-hidden="true" className="h-4 w-4" />}
                <span className="ml-2">{isPending ? 'Se salvează...' : 'Salvează'}</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Închide confirmarea de ștergere"
            className="absolute inset-0 bg-background/85 backdrop-blur-sm"
            onClick={cancelDeleteUser}
            disabled={isPending}
          />
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            aria-describedby="delete-user-description"
            aria-busy={isPending}
            className="relative z-10 w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
                <FaTrash aria-hidden="true" className="h-4 w-4" />
              </div>
              <div>
                <h2 id="delete-user-title" className="text-lg font-semibold text-foreground">
                  Confirmă ștergerea
                </h2>
                <p id="delete-user-description" className="mt-1 text-sm leading-6 text-muted-foreground">
                  Utilizatorul <strong className="text-foreground">{getDisplayName(deletingUser)}</strong> va fi șters definitiv.
                </p>
              </div>
            </div>

            <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              Această acțiune nu poate fi anulată.
            </p>

            {error && (
              <div role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                onClick={cancelDeleteUser}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-muted px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteUser(deletingUser.clerkId)}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-50"
              >
                {isPending ? <Spinner /> : <FaTrash aria-hidden="true" className="h-4 w-4" />}
                <span className="ml-2">{isPending ? 'Se șterge...' : 'Șterge definitiv'}</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {qrPopupUserId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Închide codul QR"
            className="absolute inset-0 bg-background/85 backdrop-blur-sm"
            onClick={closeQRPopup}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-user-title"
            aria-describedby="qr-user-description"
            className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6"
          >
            <button
              type="button"
              autoFocus
              onClick={closeQRPopup}
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Închide codul QR"
            >
              <FaTimes aria-hidden="true" className="h-5 w-5" />
            </button>

            <div className="pr-12 text-center">
              <h2 id="qr-user-title" className="text-xl font-semibold text-foreground">
                Cod QR pentru {qrUser ? getDisplayName(qrUser) : 'utilizator'}
              </h2>
              <p id="qr-user-description" className="mt-1 text-sm text-muted-foreground">
                Scanează codul pentru a confirma prezența.
              </p>
            </div>

            <div className="mt-5">
              <SimpleUserQRCode
                userId={qrPopupUserId}
                userName={qrUser ? getDisplayName(qrUser) : undefined}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
