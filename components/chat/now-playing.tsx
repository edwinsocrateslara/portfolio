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
                fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "10px", lineHeight: "1",
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
              fontFamily: "var(--ff-archivo)", fontWeight: 600, fontSize: "19px", lineHeight: "1.3",
              color: "rgb(var(--bureau-text-primary))",
              maxWidth: 420,
              margin: 0,
            }}
          >
            Designing the AI coach experience at FutureFit AI
          </p>
          <p
            style={{
              fontFamily: "var(--ff-archivo)", fontWeight: 400, fontSize: "13px", lineHeight: "1",
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
            fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "11px", lineHeight: "1",
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
