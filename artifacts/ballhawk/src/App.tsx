import { useMemo, useRef, useState } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import sampleData from './sampleData.json';

type Side = 'offense' | 'defense';
type SampleName = keyof typeof sampleData;
type PlayRow = {
  play: string;
  down: string;
  formation: string;
  type: string;
  result: string;
  confidence: number | string;
  confidenceByField: Record<string, number>;
  edited?: string[];
};
type FieldKey = 'play' | 'down' | 'formation' | 'type' | 'result' | 'confidence';
type CellMeta = { key: FieldKey; label: string; confidenceKey?: string };

const sampleNames = Object.keys(sampleData) as SampleName[];
const cellFields: CellMeta[] = [
  { key: 'play', label: 'Play #' },
  { key: 'down', label: 'Down & Distance' },
  { key: 'formation', label: 'Formation', confidenceKey: 'formation' },
  { key: 'type', label: 'Play Type', confidenceKey: 'type' },
  { key: 'result', label: 'Result (yards)', confidenceKey: 'result' },
  { key: 'confidence', label: 'Confidence', confidenceKey: 'confidence' },
];
const allowedTypes = ['.mp4', '.mov', '.webm'];
const corruptMessage = "BallHawk couldn't read this clip. Upload an .mp4, .mov, or .webm file, or try a sample clip.";

function Home() {
  const [side, setSide] = useState<Side | ''>('');
  const [camera, setCamera] = useState('');
  const [sample, setSample] = useState<SampleName | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState({ side: '', camera: '', clip: '' });
  const [clipError, setClipError] = useState(false);
  const [rows, setRows] = useState<PlayRow[]>([]);
  const [sourceName, setSourceName] = useState('');
  const [resultSample, setResultSample] = useState<SampleName | ''>('');
  const [taggedSide, setTaggedSide] = useState<Side | ''>('');
  const [uploadedDemo, setUploadedDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [activePlay, setActivePlay] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const formationHeading = (taggedSide || side) === 'defense' ? 'Defensive Front' : 'Offensive Formation';
  const columns = useMemo(() => cellFields.map((field) =>
    field.key === 'formation' ? { ...field, label: formationHeading } : field
  ), [formationHeading]);

  const needReview = useMemo(() => rows.reduce((count, row) =>
    count + cellFields.slice(1).filter((field) => {
      const value = String(row[field.key] ?? '');
      const confidence = field.confidenceKey === 'confidence'
        ? Number(row.confidence)
        : Number(row.confidenceByField[field.confidenceKey ?? field.key] ?? row.confidence);
      return !value.trim() || confidence < 70;
    }).length, 0), [rows]);
  const totalFields = rows.length * 5;
  const highConfidence = Math.max(0, totalFields - needReview);

  function clearResults() {
    setRows([]);
    setSourceName('');
    setResultSample('');
    setTaggedSide('');
    setUploadedDemo(false);
    setBusy(false);
    setComplete(false);
    setActivePlay(0);
    setClipError(false);
    setErrors({ side: '', camera: '', clip: '' });
  }

  function selectSample(value: string) {
    setSample(value as SampleName | '');
    setClipError(false);
    setErrors((current) => ({ ...current, clip: '' }));
    if (fileRef.current) fileRef.current.value = '';
    setFile(null);
  }

  function chooseFile(chosen: File | null) {
    setFile(chosen);
    setSample('');
    setClipError(false);
    setErrors((current) => ({ ...current, clip: '' }));
    if (chosen && !allowedTypes.some((extension) => chosen.name.toLowerCase().endsWith(extension))) {
      setClipError(true);
    }
  }

  function markEdited(rowIndex: number, key: FieldKey, value: string) {
    setRows((current) => current.map((row, index) => {
      if (index !== rowIndex) return row;
      const next = { ...row, edited: [...new Set([...(row.edited ?? []), key])] };
      if (key === 'confidence') {
        const parsed = Number(value.replace('%', '').trim());
        next.confidence = Number.isFinite(parsed) ? parsed : value;
      } else {
        next[key] = value as never;
      }
      return next;
    }));
  }

  function downloadCsv() {
    if (!rows.length) return;
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const headings = columns.map((column) => column.label);
    const body = rows.map((row) => columns.map(({ key }) =>
      escapeCsv(key === 'confidence' && typeof row.confidence === 'number' ? `${row.confidence}%` : row[key])
    ).join(','));
    const csv = [headings.map(escapeCsv).join(','), ...body].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ballhawk-breakdown.csv';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function focusFirstReview() {
    const target = document.querySelector<HTMLInputElement>('[data-review="true"]');
    target?.focus();
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }

  function resetRun() {
    clearResults();
    setCamera('');
    setSample('');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function tagPlays() {
    const nextErrors = {
      side: side ? '' : 'Choose Offense or Defense',
      camera: camera ? '' : 'Choose a camera angle',
      clip: file || sample ? '' : 'Choose a clip',
    };
    setErrors(nextErrors);
    if (nextErrors.side || nextErrors.camera || nextErrors.clip) return;

    const unsupported = file && !allowedTypes.some((extension) => file.name.toLowerCase().endsWith(extension));
    if (unsupported || (!file && !sampleNames.includes(sample as SampleName))) {
      setClipError(true);
      return;
    }
    const source = file ? sampleNames[0] : sample as SampleName;
    if (source === sampleNames[2]) {
      setClipError(true);
      return;
    }

    // Scripted analysis boundary: replace this sample lookup with a real vision model when one is connected.
    const scriptedPlays = sampleData[source][side as Side] as PlayRow[];
    const resultRows = scriptedPlays.map((play) => ({ ...play, confidenceByField: { ...play.confidenceByField }, edited: [] }));
    setRows([]);
    setClipError(false);
    setBusy(true);
    setComplete(false);
    setUploadedDemo(Boolean(file));
    setSourceName(file ? file.name : source);
    setResultSample(source);
    setTaggedSide(side as Side);
    setActivePlay(1);
    let index = 0;
    const appendNext = () => {
      index += 1;
      setRows(resultRows.slice(0, index));
      if (index < resultRows.length) {
        setActivePlay(index + 1);
        window.setTimeout(appendNext, 1000);
      } else {
        setBusy(false);
        setComplete(true);
        setActivePlay(0);
      }
    };
    window.setTimeout(appendNext, 1000);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="BallHawk">
          <span className="brand-mark" aria-hidden="true">BH</span>
          <span>BallHawk</span>
        </div>
        <span className="top-meta">Coach’s film desk · Demo</span>
      </header>
      <main className="main-wrap">
        <section className="intro">
          <div>
            <p className="eyebrow">Sideline film, made useful</p>
            <h1>BallHawk — Film Breakdown Assistant</h1>
            <p className="instruction">Choose what you're watching, add a clip, and BallHawk fills in the breakdown sheet. Yellow cells need your review.</p>
          </div>
          <div className="session-chip">Local demo · no video is uploaded</div>
        </section>

        <div className="workbench">
          <section className="setup-panel" aria-labelledby="setup-heading">
            <h2 className="panel-heading" id="setup-heading">Set up your clip</h2>
            <div className="form-block">
              <div className="step-label">
                <span className="step-num">Step 1</span>
                <span className="field-label" id="side-label">What are you breaking down?<span className="required">*</span></span>
              </div>
              <div className="radio-grid" role="radiogroup" aria-labelledby="side-label">
                {(['offense', 'defense'] as const).map((option) => (
                  <label className="radio-choice" key={option}>
                    <input
                      type="radio"
                      name="side"
                      value={option}
                      checked={side === option}
                      onChange={() => { setSide(option); setErrors((current) => ({ ...current, side: '' })); }}
                      data-testid={`input-side-${option}`}
                    />
                    <span>{option === 'offense' ? 'Offense' : 'Defense'}</span>
                  </label>
                ))}
              </div>
              <p className="form-error" role="alert" data-testid="error-side">{errors.side}</p>
            </div>
            <div className="form-block">
              <div className="step-label">
                <span className="step-num">Step 2</span>
                <label className="field-label" htmlFor="camera-select">Camera angle<span className="required">*</span></label>
              </div>
              <select
                id="camera-select"
                className="select-control"
                value={camera}
                onChange={(event) => { setCamera(event.target.value); setErrors((current) => ({ ...current, camera: '' })); }}
                data-testid="input-camera"
              >
                <option value="">Choose an angle</option>
                <option value="Sideline">Sideline</option>
                <option value="End zone">End zone</option>
                <option value="Unknown">Unknown</option>
              </select>
              <p className="form-error" role="alert" data-testid="error-camera">{errors.camera}</p>
            </div>
            <div className="form-block">
              <div className="step-label">
                <span className="step-num">Step 3</span>
                <label className="field-label" htmlFor="video-file">Add a clip<span className="required">*</span></label>
              </div>
              <input
                ref={fileRef}
                id="video-file"
                className="file-input"
                type="file"
                accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                data-testid="input-video-file"
              />
              <p className="helper">MP4, MOV, or WebM · Your clip stays in this browser.</p>
            </div>
            <div className="form-block">
              <label className="field-label" htmlFor="sample-select">Or try a sample clip</label>
              <select
                id="sample-select"
                className="select-control clip-select"
                value={sample}
                onChange={(event) => selectSample(event.target.value)}
                data-testid="input-sample"
              >
                <option value="">Choose a sample</option>
                {sampleNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <button className="tag-button" type="button" onClick={tagPlays} disabled={busy} data-testid="button-tag-plays">
              {busy ? 'Tagging plays…' : 'Tag Plays'}
            </button>
            {clipError && (
              <div className="alert-error" role="alert" data-testid="error-clip">
                <div>
                  <div>{corruptMessage}</div>
                  <button className="try-sample" type="button" onClick={() => selectSample(sampleNames[0])} data-testid="button-try-sample">Try a sample clip</button>
                </div>
              </div>
            )}
          </section>

          <section className="results-panel" aria-labelledby="results-heading">
            {rows.length > 0 ? (
              <>
                <div className="results-top">
                  <div className="results-title-row">
                    <div>
                      <h2 className="results-title" id="results-heading">{complete ? 'Breakdown sheet' : 'Building breakdown sheet'}</h2>
                      <p className="source-name" data-testid="text-source">{sourceName}</p>
                    </div>
                    {complete && (
                      <div className="results-actions">
                        <button className="secondary-button" type="button" onClick={focusFirstReview} data-testid="button-review">Review fields</button>
                        <button className="secondary-button" type="button" onClick={downloadCsv} data-testid="button-export">Export CSV</button>
                        <button className="secondary-button" type="button" onClick={resetRun} data-testid="button-another-clip">Tag another clip</button>
                      </div>
                    )}
                  </div>
                  {uploadedDemo && <p className="source-name" data-testid="text-demo-notice">Demo results — live video analysis not yet connected.</p>}
                  <div className="summary" aria-live="polite" data-testid="summary-breakdown">
                    <span className="summary-pill"><strong>{rows.length} plays</strong> tagged</span>
                    <span className="summary-pill"><strong>{totalFields} fields</strong></span>
                    <span className="summary-pill"><strong>{highConfidence}</strong> high confidence</span>
                    <span className="summary-pill"><strong>{needReview}</strong> need review</span>
                  </div>
                </div>
                {resultSample === sampleNames[1] && !uploadedDemo && complete && (
                  <div className="warning" data-testid="warning-low-visibility">
                    <span className="warning-mark" aria-hidden="true">!</span>
                    Low visibility detected (rain/end-zone angle). 5 of 15 fields need review.
                  </div>
                )}
                {busy && (
                  <div className="processing" aria-live="polite">
                    <div className="processing-line"><span data-testid="status-processing">Watching play {activePlay} of 3…</span><span>{rows.length} / 3</span></div>
                    <div className="progress-track" aria-label={`${Math.round(rows.length / 3 * 100)}% processed`}><div className="progress-fill" style={{ width: `${rows.length / 3 * 100}%` }} /></div>
                    <p className="processing-note">Adding each play to the sheet as it is tagged.</p>
                  </div>
                )}
                <div className="table-wrap">
                  <table>
                    <thead><tr>{columns.map((column) => <th scope="col" key={column.key}>{column.label}</th>)}</tr></thead>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr key={`${rowIndex}-${row.play}`} data-testid={`row-play-${rowIndex + 1}`}>
                          {columns.map((column) => {
                            const key = column.key;
                            const raw = key === 'confidence'
                              ? `${row.confidence}${typeof row.confidence === 'number' ? '%' : ''}`
                              : String(row[key] ?? '');
                            const fieldConfidence = key === 'confidence'
                              ? Number(row.confidence)
                              : Number(row.confidenceByField[column.confidenceKey ?? key] ?? row.confidence);
                            const review = key !== 'play' && (!raw.trim() || fieldConfidence < 70);
                            const edited = row.edited?.includes(key) ?? false;
                            const inputValue = raw.trim() ? raw : '— needs review —';
                            return (
                              <td key={key}>
                                <div className="cell-wrap">
                                  <input
                                    className={`cell-input${review ? ' needs-review' : ''}${edited ? ' edited' : ''}`}
                                    value={inputValue}
                                    aria-label={`${column.label}, play ${rowIndex + 1}${review ? ', needs review' : ''}`}
                                    data-review={review ? 'true' : undefined}
                                    data-testid={`input-cell-${key}-${rowIndex + 1}`}
                                    onFocus={(event) => { if (!raw.trim()) event.currentTarget.select(); }}
                                    onChange={(event) => markEdited(rowIndex, key, event.target.value === '— needs review —' ? '' : event.target.value)}
                                  />
                                  {edited && <span className="cell-status">edited</span>}
                                  {review && <span className="review-tag">Review</span>}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : busy ? (
              <div className="processing" aria-live="polite">
                <div className="processing-line"><span data-testid="status-processing">Watching play {activePlay} of 3…</span><span>0 / 3</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: '0%' }} /></div>
                <p className="processing-note">Reading the selected film, one play at a time.</p>
              </div>
            ) : (
              <div className="empty-state">
                <div className="field-art" aria-hidden="true" />
                <h3 id="results-heading">Your breakdown sheet starts here</h3>
                <p>Choose a side, camera angle, and clip. Plays will appear here in sequence, ready for your review.</p>
              </div>
            )}
          </section>
        </div>
        <p className="bottom-note">BUILT FOR THE NEXT HUDDLE · EDIT ANY CELL BEFORE EXPORT</p>
      </main>
    </div>
  );
}

function NotFound() {
  return <main className="main-wrap"><h1>Page not found</h1></main>;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

export default App;
