export interface InputLink {
  id: string
  source: string
  url: string
  metadata?: Record<string, any>
  createdAt?: number
  updatedAt?: number
}

export interface InputLinkResult {
  success: boolean
  link?: InputLink
  error?: string
}

export class InputLinkHandler {
  private links = new Map<string, InputLink>()

  register(link: InputLink): InputLinkResult {
    if (this.links.has(link.id)) {
      return { success: false, error: `Link with id "${link.id}" already exists.` }
    }
    const newLink: InputLink = { ...link, createdAt: Date.now(), updatedAt: Date.now() }
    this.links.set(link.id, newLink)
    return { success: true, link: newLink }
  }

  update(id: string, data: Partial<Omit<InputLink, "id">>): InputLinkResult {
    const existing = this.links.get(id)
    if (!existing) {
      return { success: false, error: `No link found for id "${id}".` }
    }
    const updated: InputLink = { ...existing, ...data, updatedAt: Date.now() }
    this.links.set(id, updated)
    return { success: true, link: updated }
  }

  get(id: string): InputLinkResult {
    const link = this.links.get(id)
    if (!link) {
      return { success: false, error: `No link found for id "${id}".` }
    }
    return { success: true, link }
  }

  list(): InputLink[] {
    return Array.from(this.links.values())
  }

  unregister(id: string): boolean {
    return this.links.delete(id)
  }

  clear(): void {
    this.links.clear()
  }

  has(id: string): boolean {
    return this.links.has(id)
  }

  /** Get all links created after a given timestamp */
  recent(since: number): InputLink[] {
    return this.list().filter(link => (link.createdAt ?? 0) > since)
  }

  /** Convert current links to a plain object map */
  toObject(): Record<string, InputLink> {
    const obj: Record<string, InputLink> = {}
    for (const [id, link] of this.links.entries()) {
      obj[id] = link
    }
    return obj
  }

  /** Bulk import links with optional overwrite */
  import(links: InputLink[], overwrite = false): void {
    for (const link of links) {
      if (overwrite || !this.links.has(link.id)) {
        this.links.set(link.id, { ...link, updatedAt: Date.now() })
      }
    }
  }
}
