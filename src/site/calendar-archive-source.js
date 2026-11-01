import { createDemoArchives } from "./data.js"

// Desktop imports all history on open; mobile requests it in batches. Replace this demo
// source with a paginated API query when calendar dates move to the database.
const archives = createDemoArchives()
const key = event => `${event.date} ${event.time} ${event.id}`

export function readArchivePage({ cursor, matches = () => true, ascending = false, limit = 30 } = {}) {
  const rows = archives.filter(matches).sort((a,b) => (ascending ? 1 : -1) * key(a).localeCompare(key(b)))
    .filter(event => !cursor || (ascending ? key(event) > key(cursor) : key(event) < key(cursor)))
  const page = rows.slice(0, limit)
  return { rows:page, cursor:page.at(-1) ?? cursor, hasMore:rows.length > limit }
}

export const findArchiveEvent = id => archives.find(event => event.id === id)
