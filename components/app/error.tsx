'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>页面渲染出错了</h2>
      <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c', marginBottom: 12 }}>
        {error?.message ?? 'Unknown error'}
      </pre>
      <button
        onClick={() => reset()}
        style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer' }}
      >
        重试
      </button>
    </div>
  )
}
