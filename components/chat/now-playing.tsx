export function NowPlaying() {
  return (
    <footer
      style={{
        background: "rgb(var(--bureau-bg))",
        padding: "var(--space-section) 0 var(--space-group)",
        borderTop: "1px solid rgb(var(--bureau-border))",
      }}
    >
      <div
        className="mx-auto max-w-7xl px-6"
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-group)",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-within)",
              marginBottom: "var(--space-between)",
            }}
          >
            <span
              style={{
                width: "var(--space-8)",
                height: "var(--space-8)",
                background: "rgb(var(--bureau-text-secondary))",
              }}
            />
            <span
              className="type-label"
              style={{ color: "rgb(var(--bureau-text-secondary))" }}
            >
              Currently
            </span>
          </div>
          <p
            className="type-title"
            style={{
              color: "rgb(var(--bureau-text-primary))",
              maxWidth: 420,
              margin: 0,
            }}
          >
            Designing the AI coach experience at FutureFit AI
          </p>
          <p
            className="type-caption"
            style={{
              color: "rgb(var(--bureau-text-muted))",
              margin: "var(--space-within) 0 0",
            }}
          >
            Toronto, Canada
          </p>
        </div>
        <div
          className="type-label"
          style={{
            display: "flex",
            gap: "var(--space-group)",
            alignItems: "center",
            color: "rgb(var(--bureau-text-secondary))",
          }}
        >
          <a
            href="mailto:edwinsocrateslara@gmail.com"
            style={{
              textDecoration: "none",
              textTransform: "uppercase",
              color: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgb(var(--bureau-text-primary))"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgb(var(--bureau-text-secondary))"
            }}
          >
            Email
          </a>
          <a
            href="https://www.edwinsocrates.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              textTransform: "uppercase",
              color: "inherit",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgb(var(--bureau-text-primary))"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgb(var(--bureau-text-secondary))"
            }}
          >
            Portfolio
          </a>
        </div>
      </div>
    </footer>
  )
}
