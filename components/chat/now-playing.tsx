export function NowPlaying() {
  return (
    <footer
      style={{
        background: "rgb(var(--bureau-bg))",
        padding: "80px 0 48px",
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
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: "rgb(var(--bureau-text-secondary))",
              }}
            />
            <span
              style={{
                font: "600 10px/1 var(--ff-plex-mono)",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "rgb(var(--bureau-text-secondary))",
              }}
            >
              Currently
            </span>
          </div>
          <p
            style={{
              font: "600 19px/1.3 var(--ff-archivo)",
              color: "rgb(var(--bureau-text-primary))",
              maxWidth: 420,
              margin: 0,
            }}
          >
            Designing the AI coach experience at FutureFit AI
          </p>
          <p
            style={{
              font: "400 13px/1 var(--ff-archivo)",
              color: "rgb(var(--bureau-text-muted))",
              marginTop: 12,
              margin: "12px 0 0",
            }}
          >
            Toronto, Canada
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 26,
            alignItems: "center",
            font: "600 11px/1 var(--ff-plex-mono)",
            letterSpacing: "1.4px",
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
