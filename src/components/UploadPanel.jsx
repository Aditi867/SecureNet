import {
  Upload,
  LoaderCircle,
  Activity,
  CircleHelp
} from 'lucide-react'

export default function UploadPanel({
  onFile,
  onAnalyze,
  file,
  busy
}) {
  return (
    <section className="panel upload-panel">

      <div className="section-heading">
        <div>
          <h2>Upload network data</h2>
          <p>
            Analyze network traffic records using your intrusion detection model.
          </p>
        </div>

        <div className="upload-symbol">
          <Upload size={23} />
        </div>
      </div>

      <label className="dropzone">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />

        <div className="upload-circle">
          <Upload size={24} />
        </div>

        <strong>
          {file ? file.name : 'Drop your CSV file here'}
        </strong>

        <span>
          {file
            ? `${(file.size / 1024).toFixed(1)} KB · Ready to analyze`
            : 'or click to browse · CSV files only'}
        </span>

        <span className="select-file">
          Select CSV file
        </span>
      </label>

      <div className="upload-footer">
        <span>
          <CircleHelp size={14} />
          Use the dataset feature columns expected by the trained model.
        </span>

        <button
          className="primary-btn"
          disabled={!file || busy}
          onClick={onAnalyze}
        >
          {busy ? (
            <>
              <LoaderCircle className="spin" size={16} />
              Analyzing
            </>
          ) : (
            <>
              <Activity size={16} />
              Analyze traffic
            </>
          )}
        </button>
      </div>

    </section>
  )
}