// Minimal robots.txt parser — enough to respect Disallow rules for an
// anonymous crawler (User-agent: *). Not a full spec implementation
// (no wildcard/$ matching, no crawl-delay), which is proportionate to
// scraping a handful of public admissions pages.

type Block = { agents: string[]; disallows: string[] }

function parseBlocks(robotsTxt: string): Block[] {
  const blocks: Block[] = []
  let currentAgents: string[] = []
  let pendingDisallows: string[] = []

  const flush = () => {
    if (currentAgents.length > 0) blocks.push({ agents: currentAgents, disallows: pendingDisallows })
    currentAgents = []
    pendingDisallows = []
  }

  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const line = rawLine.split('#')[0].trim()
    if (!line) continue
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim().toLowerCase()
    const value = line.slice(colonIndex + 1).trim()

    if (key === 'user-agent') {
      if (pendingDisallows.length > 0) flush() // a new agent after rules starts a new block
      currentAgents.push(value.toLowerCase())
    } else if (key === 'disallow') {
      pendingDisallows.push(value)
    }
  }
  flush()
  return blocks
}

export function parseDisallowedPaths(robotsTxt: string, userAgent = '*'): string[] {
  const wanted = userAgent.toLowerCase()
  const disallowed: string[] = []
  for (const block of parseBlocks(robotsTxt)) {
    if (block.agents.includes(wanted) || block.agents.includes('*')) {
      disallowed.push(...block.disallows)
    }
  }
  return disallowed.filter(d => d !== '')
}

export function isPathAllowed(robotsTxt: string, path: string, userAgent = '*'): boolean {
  const disallowed = parseDisallowedPaths(robotsTxt, userAgent)
  return !disallowed.some(prefix => path.startsWith(prefix))
}
