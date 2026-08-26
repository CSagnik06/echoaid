import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText as FileIcon, ChevronRight, Download, Loader2 } from "lucide-react";
import { api } from "../../services/api";
import jsPDF from "jspdf";

export function ReportSimplifier({ language }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError("");
      setResult("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    
    try {
      const simplifiedText = await api.simplifyReport(file, language);
      setResult(simplifiedText);
    } catch (err) {
      setError(err.message || "Failed to process the document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Medical Report Summary", 20, 20);
    doc.setFontSize(12);
    
    const lines = doc.splitTextToSize(result, 170);
    doc.text(lines, 20, 35);
    
    doc.save("Simplified_Report.pdf");
  };

  return (
    <section className="report-view">
      <header className="page-heading">
        <span className="section-kicker">MEDICAL JARGON TRANSLATOR</span>
        <h1>Understand your medical reports</h1>
        <p>Upload a PDF or image of your prescription, blood test, or scan report, and our AI will explain it simply.</p>
      </header>
      
      <div className="report-layout" style={{display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', margin: '0 auto'}}>
        {!result && (
          <div 
            {...getRootProps()} 
            style={{
              border: `2px dashed ${isDragActive ? '#4f46e5' : '#374151'}`,
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            <input {...getInputProps()} />
            <UploadCloud size={40} style={{margin: '0 auto', opacity: 0.7, marginBottom: '10px'}} />
            {isDragActive ? (
              <p>Drop the file here ...</p>
            ) : (
              <p>Drag 'n' drop a report here, or click to select a file</p>
            )}
            <small style={{opacity: 0.5}}>Supports PDF, PNG, JPG</small>
          </div>
        )}

        {file && !result && (
          <div className="file-info" style={{background: '#1f2937', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <FileIcon size={20} />
              <span>{file.name}</span>
            </div>
            <button 
              className="button primary" 
              onClick={handleUpload} 
              disabled={loading}
              style={{padding: '8px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                  Analyzing diagnostic report with Gemini AI...
                </>
              ) : (
                <>Simplify Report <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        )}

        {error && <div className="error" style={{color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', padding: '10px', borderRadius: '8px'}}>{error}</div>}

        {result && (
          <div className="result-panel panel" style={{padding: '20px', background: '#1f2937', borderRadius: '12px', color: '#F8FAFC'}}>
            <div className="panel-head" style={{marginBottom: '15px', borderBottom: '1px solid #374151', paddingBottom: '10px'}}>
              <span>SIMPLIFIED EXPLANATION</span>
              <small>AI-generated in {language}</small>
            </div>
            <div className="markdown-content" style={{lineHeight: 1.65, fontSize: '0.95rem', whiteSpace: 'pre-line', color: '#E2E8F0'}}>
              {result}
            </div>
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button className="button primary" onClick={handleDownload}>
                <Download size={16} /> Download Simplified Report (PDF)
              </button>
              <button className="button secondary" onClick={() => {setResult(""); setFile(null);}}>
                Upload another report
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
