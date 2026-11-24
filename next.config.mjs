/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // NO GENERATED AGENT RULES. From 16.x, `next dev` writes an AGENTS.md into
  // the repo root whenever it detects an AI coding agent, and the file asks
  // to be committed. That is a decision made for this repo by a dependency,
  // and nothing lands here without a stated reason. It appeared on 24
  // November, the first time an agent ran `next dev` on 16.4.6, and was
  // deleted rather than committed. If agent rules are ever wanted, they get
  // written by hand, for this repo, like everything else in it.
  agentRules: false,
}

export default nextConfig
