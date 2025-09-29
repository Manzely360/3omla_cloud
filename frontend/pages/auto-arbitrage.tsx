import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'

interface BookLevel {
  p: number
  q: number
}

interface OpportunitySeed {
  id: string
  symbol: string
  buy_venue: string
  sell_venue: string
  vol_bps_per_min: number
  expected_transfer_min: number
  safety_buffer_bps: number
  buy_fee: number
  sell_fee: number
  asks_buy: BookLevel[]
  bids_sell: BookLevel[]
}

interface EvalResponse {
  exec_spread_bps: number
  slippage_bps: number
  latency_bps: number
  break_even_bps: number
  net_pnl_quote: number
  net_margin_pct: number
  decision: string
  notes?: string
}

interface ExecuteResponse {
  status: string
  buy_order_id: string
  sell_order_id: string
  requested_quote: number
}

interface RiskConfigResponse {
  max_notional_per_trade: number
  min_notional_per_trade: number
  per_minute_notional_cap: number
  dry_run: boolean
}

interface InventoryResponse {
  venues: Record<string, { base: number; quote: number }>
}

interface ExecutionLogEntry {
  symbol: string
  buy_venue: string
  sell_venue: string
  request_quote: number
  buy_order_id: string
  sell_order_id: string
  dry_run: boolean
  decision: string
  created_at: string
}

const ORDER_SIZES = [200, 500, 1000]

type EvalState = {
  loading: boolean
  result?: EvalResponse
  error?: string
  executeLoading?: boolean
  executeResult?: ExecuteResponse
}

export default function AutoArbitragePage() {
  const [opportunities, setOpportunities] = useState<OpportunitySeed[]>([])
  const [evaluations, setEvaluations] = useState<Record<string, EvalState>>({})
  const [loadingOpps, setLoadingOpps] = useState(false)
  const [errorOpps, setErrorOpps] = useState<string | undefined>()
  const [riskConfig, setRiskConfig] = useState<RiskConfigResponse | null>(null)
  const [inventory, setInventory] = useState<InventoryResponse | null>(null)
  const [executions, setExecutions] = useState<ExecutionLogEntry[]>([])

  useEffect(() => {
    let active = true

    async function fetchOpps() {
      setLoadingOpps(true)
      try {
        const res = await fetch('/api/v1/auto_arb/opportunities')
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.detail || 'Unable to load opportunities')
        }
        const data = await res.json()
        if (!active) return
        const mapped: OpportunitySeed[] = data.map((item: any, idx: number) => ({
          id: item.id ?? `${item.symbol}-${idx}`,
          ...item,
        }))
        setOpportunities(mapped)
        setErrorOpps(undefined)
      } catch (error: any) {
        if (!active) return
        setErrorOpps(error?.message || 'Failed to fetch opportunities')
      } finally {
        if (active) setLoadingOpps(false)
      }
    }

    fetchOpps()
    const interval = setInterval(fetchOpps, 15000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let active = true
    async function fetchMeta() {
      try {
        const [cfgRes, invRes, execRes] = await Promise.all([
          fetch('/api/v1/auto_arb/risk_config'),
          fetch('/api/v1/auto_arb/inventory'),
          fetch('/api/v1/auto_arb/executions'),
        ])
        if (!active) return
        if (cfgRes.ok) {
          setRiskConfig(await cfgRes.json())
        }
        if (invRes.ok) {
          setInventory(await invRes.json())
        }
        if (execRes.ok) {
          setExecutions(await execRes.json())
        }
      } catch (error) {
        // Silent; UI already shows opportunities
      }
    }
    fetchMeta()
    const interval = setInterval(fetchMeta, 20000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const sortedOpps = useMemo(() => opportunities, [opportunities])

  const evaluate = async (opp: OpportunitySeed, size: number) => {
    const key = `${opp.id}-${size}`
    setEvaluations((prev) => ({
      ...prev,
      [key]: { loading: true },
    }))

    try {
      const payload = {
        symbol: opp.symbol,
        buy_venue: opp.buy_venue,
        sell_venue: opp.sell_venue,
        order_size_quote: size,
        assume_maker: false,
        use_transfer_mode: false,
        vol_bps_per_min: opp.vol_bps_per_min,
        expected_transfer_min: opp.expected_transfer_min,
        safety_buffer_bps: opp.safety_buffer_bps,
        max_slippage_bps: 5,
        buy_fee: opp.buy_fee,
        sell_fee: opp.sell_fee,
        withdraw_fee_quote: 0,
        asks_buy: opp.asks_buy,
        bids_sell: opp.bids_sell,
      }

      const res = await fetch('/api/v1/auto_arb/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail || 'Evaluation failed')
      }

      const data: EvalResponse = await res.json()
      setEvaluations((prev) => ({
        ...prev,
        [key]: { loading: false, result: data },
      }))
    } catch (error: any) {
      setEvaluations((prev) => ({
        ...prev,
        [key]: { loading: false, error: error?.message || 'Unknown error' },
      }))
    }
  }

  const execute = async (opp: OpportunitySeed, size: number) => {
    const key = `${opp.id}-${size}`
    const state = evaluations[key]
    if (!state?.result || state.result.decision !== 'EXECUTE') return

    setEvaluations((prev) => ({
      ...prev,
      [key]: { ...state, executeLoading: true, executeResult: undefined, error: undefined },
    }))

    try {
      const payload = {
        symbol: opp.symbol,
        buy_venue: opp.buy_venue,
        sell_venue: opp.sell_venue,
        order_size_quote: size,
        size_mode: 'quote',
        assume_maker: false,
        use_transfer_mode: false,
        vol_bps_per_min: opp.vol_bps_per_min,
        expected_transfer_min: opp.expected_transfer_min,
        safety_buffer_bps: opp.safety_buffer_bps,
        max_slippage_bps: 5,
        buy_fee: opp.buy_fee,
        sell_fee: opp.sell_fee,
        withdraw_fee_quote: 0,
        asks_buy: opp.asks_buy,
        bids_sell: opp.bids_sell,
      }

      const res = await fetch('/api/v1/auto_arb/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.detail || 'Execution failed')
      }

      const data: ExecuteResponse = await res.json()
      setEvaluations((prev) => ({
        ...prev,
        [key]: { ...prev[key], executeLoading: false, executeResult: data },
      }))
    } catch (error: any) {
      setEvaluations((prev) => ({
        ...prev,
        [key]: { ...prev[key], executeLoading: false, error: error?.message || 'Execution error' },
      }))
    }
  }

  return (
    <>
      <Head>
        <title>AUTO-ARBITRAGE • 3omla</title>
      </Head>
      <Layout>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-16">
          <section className="rounded-3xl border border-indigo-200/70 bg-white/90 p-8 shadow-2xl shadow-indigo-200/60">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-indigo-500">Auto-Arbitrage</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Executable spreads with risk buffers included.</h1>
            <p className="mt-4 max-w-3xl text-sm text-slate-600">
              These previews use live-style order book depth and the deterministic profitability calculator. Run an evaluation on the
              sizes below to see net PnL after fees, slippage, and safety buffers. Execution is gated until API keys are connected.
            </p>
            {riskConfig && (
              <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-xs text-slate-600 sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-slate-800">Trade caps:</span>
                  <div>Min {riskConfig.min_notional_per_trade.toFixed(2)} USDT</div>
                  <div>Max {riskConfig.max_notional_per_trade.toFixed(2)} USDT</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Per-minute ceiling:</span>
                  <div>{riskConfig.per_minute_notional_cap.toFixed(2)} USDT</div>
                  <div>Mode: {riskConfig.dry_run ? 'Paper (dry run)' : 'Live'}</div>
                </div>
              </div>
            )}
            {inventory && Object.keys(inventory.venues).length > 0 && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/70">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-100/70 text-slate-600">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-[0.3em]">Venue</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-[0.3em]">Base</th>
                      <th className="px-4 py-2 text-left font-semibold uppercase tracking-[0.3em]">Quote</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white/80">
                    {Object.entries(inventory.venues).map(([venue, balances]) => (
                      <tr key={venue}>
                        <td className="px-4 py-2 font-semibold text-slate-700">{venue.toUpperCase()}</td>
                        <td className="px-4 py-2 text-slate-600">{balances.base.toFixed(4)}</td>
                        <td className="px-4 py-2 text-slate-600">{balances.quote.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {executions.length > 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200/70 bg-white/90 p-4">
                <h2 className="text-sm font-semibold text-slate-700">Recent executions (mock)</h2>
                <ul className="mt-3 space-y-2 text-xs text-slate-600">
                  {executions.map((entry) => (
                    <li key={`${entry.buy_order_id}-${entry.sell_order_id}`} className="rounded-xl border border-slate-200/70 bg-slate-50/70 px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">{entry.symbol}</span>
                        <span className="text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3">
                        <span>Buy {entry.buy_venue.toUpperCase()}</span>
                        <span>Sell {entry.sell_venue.toUpperCase()}</span>
                        <span>{entry.request_quote.toFixed(2)} USDT</span>
                        <span>{entry.dry_run ? 'Dry run' : 'Live'}</span>
                        <span className={entry.decision === 'EXECUTE' ? 'text-emerald-600 font-semibold' : 'text-amber-500 font-semibold'}>
                          {entry.decision}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="space-y-6">
            {loadingOpps && (
              <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/80 p-4 text-sm text-indigo-700">
                Loading opportunities…
              </div>
            )}
            {errorOpps && (
              <div className="rounded-2xl border border-rose-300/70 bg-rose-50/80 p-4 text-sm text-rose-600">
                {errorOpps}
              </div>
            )}
            {sortedOpps.map((opp) => (
              <div key={opp.id} className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/60">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{opp.symbol}</div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Buy on {opp.buy_venue.toUpperCase()} → Sell on {opp.sell_venue.toUpperCase()}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Fees: {Math.round(opp.buy_fee * 1e4) / 100} bps buy | {Math.round(opp.sell_fee * 1e4) / 100} bps sell · Safety buffer {opp.safety_buffer_bps} bps
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ORDER_SIZES.map((size) => {
                      const key = `${opp.id}-${size}`
                      const state = evaluations[key]
                      return (
                        <button
                          key={size}
                          onClick={() => evaluate(opp, size)}
                          className="rounded-full border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={state?.loading}
                        >
                          {state?.loading ? 'Evaluating…' : `Evaluate ${size} USDT`}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {ORDER_SIZES.map((size) => {
                    const key = `${opp.id}-${size}`
                    const state = evaluations[key]

                    return (
                      <div key={key} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{size} USDT</div>
                        {!state ? (
                          <p className="mt-2 text-xs text-slate-500">Run evaluation to view edge.</p>
                        ) : state.error ? (
                          <p className="mt-2 text-xs text-rose-500">{state.error}</p>
                        ) : state.result ? (
                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                            <div>
                              Net spread: <span className="font-semibold text-slate-800">{state.result.exec_spread_bps.toFixed(2)} bps</span>
                            </div>
                            <div>
                              Break-even: {state.result.break_even_bps.toFixed(2)} bps
                            </div>
                            <div>
                              Net PnL: <span className={state.result.net_pnl_quote > 0 ? 'text-emerald-600 font-semibold' : 'text-rose-500 font-semibold'}>
                                {state.result.net_pnl_quote.toFixed(2)} USDT
                              </span>
                            </div>
                            <div>
                              Margin: {state.result.net_margin_pct.toFixed(3)}%
                            </div>
                            <div>
                              Decision: <span className={state.result.decision === 'EXECUTE' ? 'text-emerald-600 font-semibold' : 'text-amber-500 font-semibold'}>
                                {state.result.decision}
                              </span>
                            </div>
                            <button
                              onClick={() => execute(opp, size)}
                              className="mt-2 w-full rounded-full border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={state.executeLoading || state.result.decision !== 'EXECUTE'}
                            >
                              {state.executeLoading ? 'Submitting…' : 'Execute (mock)'}
                            </button>
                            {state.executeResult && (
                              <div className="mt-2 rounded-lg border border-emerald-300/60 bg-emerald-50/80 p-2 text-[10px] text-emerald-700">
                                Submitted {state.executeResult.buy_order_id.slice(0, 8)} / {state.executeResult.sell_order_id.slice(0, 8)}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                <p className="mt-4 text-xs text-slate-400">
                  Note: Depth, volatility inputs, and inventory caps are approximations for the preview environment. Connect exchange APIs to trade.
                </p>
              </div>
            ))}
            {!loadingOpps && sortedOpps.length === 0 && !errorOpps && (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-500">
                No opportunities are available right now.
              </div>
            )}
          </section>
        </div>
      </Layout>
    </>
  )
}
