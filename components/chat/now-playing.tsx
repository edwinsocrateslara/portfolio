export function NowPlaying() {
  return (
    <footer
      style={{
        background: "linear-gradient(180deg, rgb(var(--color-accent) / 0.15) 0%, rgb(var(--color-bg)) 100%)",
        padding: "80px 0 48px",
        borderTop: "1px solid #262626",
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
              gap: 12,
              marginBottom: 8,
            }}
          >
            <span
              className="animate-pulse"
              style={{
                width: 8,
                height: 8,
                background: "rgb(var(--color-accent))",
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: "#ffffff",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Currently
            </span>
          </div>
          <p
            style={{
              fontSize: 24,
              fontWeight: 400,
              lineHeight: 1.6,
              color: "#ffffff",
              maxWidth: 500,
            }}
          >
            Designing the AI coach experience at FutureFit AI
          </p>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "#ffffff",
              opacity: 0.6,
              marginTop: 8,
            }}
          >
            Toronto, Canada
          </p>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a
            href="mailto:edwinsocrateslara@gmail.com"
            style={{
              fontSize: 14,
              color: "#ffffff",
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgb(var(--color-accent))"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#ffffff"
            }}
          >
            Email
          </a>
          <a
            href="https://www.edwinsocrates.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 14,
              color: "#ffffff",
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgb(var(--color-accent))"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#ffffff"
            }}
          >
            Portfolio
          </a>
        </div>
      </div>
    </footer>
  )
}
