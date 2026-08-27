import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  FileText,
  ChevronRight,
  Loader2,
  Download,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  X,
  LockKeyhole,
  Zap,
  Stethoscope,
  Info,
  CircleCheck,
} from "lucide-react";
import { api } from "../../services/api";
import jsPDF from "jspdf";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function ReportSimplifier({ language = "English" }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError("");

    if (rejectedFiles?.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection?.errors?.some((item) => item.code === "file-too-large")) {
        setError("This file is larger than 10 MB. Please choose a smaller file.");
      } else {
        setError("Please upload a PDF, PNG, JPG, or JPEG file.");
      }
      return;
    }

    if (!acceptedFiles?.length) return;

    const selectedFile = acceptedFiles[0];
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("This file is larger than 10 MB. Please choose a smaller file.");
      return;
    }

    setFile(selectedFile);
    setResult("");
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    noClick: true, // we handle click on browse link
  });

  const handleUpload = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError("");

    try {
      const simplifiedText = await api.simplifyReport(file, language);
      if (!simplifiedText || !String(simplifiedText).trim()) {
        throw new Error("We couldn't generate a summary from this document. Please try a clearer report.");
      }
      setResult(String(simplifiedText).trim());
    } catch (err) {
      setError(err?.message || "Failed to process the document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (event) => {
    event?.stopPropagation();
    if (loading) return;
    setFile(null);
    setError("");
  };

  const handleReset = () => {
    setResult("");
    setFile(null);
    setError("");
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const contentWidth = pageWidth - marginX * 2;
    let cursorY = 20;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(20, 35, 40);
    doc.text("SANJEEVANI - Medical Report Summary", marginX, cursorY);
    cursorY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Language: ${language}`, marginX, cursorY);
    cursorY += 6;

    doc.setDrawColor(225, 230, 230);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
    cursorY += 10;

    // Clean markdown
    const cleanText = result
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/###\s?/g, "")
      .replace(/\r/g, "");

    const rawLines = cleanText.split("\n");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(65, 65, 65);
    const lineHeight = 5.5;

    const addPageIfNeeded = (requiredHeight = lineHeight) => {
      if (cursorY + requiredHeight > pageHeight - 20) {
        doc.addPage();
        cursorY = 20;
      }
    };

    rawLines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        cursorY += 3;
        return;
      }

      const isHeader = line.startsWith("📌") || line.startsWith("⚠️") || line.startsWith("💡") || line.startsWith("🩺");
      if (isHeader) {
        addPageIfNeeded(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11.5);
        if (line.startsWith("⚠️")) {
          doc.setTextColor(146, 64, 14);
        } else if (line.startsWith("🩺")) {
          doc.setTextColor(15, 118, 110);
        } else if (line.startsWith("💡")) {
          doc.setTextColor(67, 56, 202);
        } else {
          doc.setTextColor(20, 35, 40);
        }

        const headerLines = doc.splitTextToSize(line, contentWidth);
        doc.text(headerLines, marginX, cursorY);
        cursorY += headerLines.length * 6 + 3;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        doc.setTextColor(65, 65, 65);
        return;
      }

      const wrappedLines = doc.splitTextToSize(line, contentWidth);
      addPageIfNeeded(wrappedLines.length * lineHeight);
      doc.text(wrappedLines, marginX, cursorY);
      cursorY += wrappedLines.length * lineHeight + 1;
    });

    // Disclaimer
    cursorY += 4;
    addPageIfNeeded(18);
    doc.setFillColor(248, 250, 250);
    doc.setDrawColor(220, 225, 225);
    const disclaimer = "Disclaimer: This AI-generated summary is for informational and educational purposes only and does not replace professional medical evaluation, diagnosis, or treatment. Always consult your healthcare provider.";
    const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 8);
    const boxHeight = disclaimerLines.length * 4.5 + 8;
    doc.roundedRect(marginX, cursorY, contentWidth, boxHeight, 2, 2, "FD");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 110, 110);
    doc.text(disclaimerLines, marginX + 4, cursorY + 6);

    // Footer on every page
    const totalPages = doc.internal.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
      doc.setPage(page);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(165, 165, 165);
      doc.text(`Sanjeevani • Medical Report Summary • ${page}/${totalPages}`, marginX, pageHeight - 10);
    }
    doc.save("Sanjeevani_Medical_Report_Summary.pdf");
  };

  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    return rawText.split("\n").map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) return null; // Using padding/margin instead of <div h-2> for styling

      const isWarning = trimmed.startsWith("⚠️");
      const isDoctor = trimmed.startsWith("🩺");
      const isInsight = trimmed.startsWith("💡");
      const isPinned = trimmed.startsWith("📌");
      const isHeader = isWarning || isDoctor || isInsight || isPinned || trimmed.startsWith("###");
      const isListItem = trimmed.startsWith("•") || trimmed.startsWith("-") || /^\d+\.\s/.test(trimmed);

      const parts = line.split(/(\*\*.*?\*\*)/g);
      const parsedContent = parts.map((part, partIdx) => {
        const isBold = part.startsWith("**") && part.endsWith("**") && part.length >= 4;
        if (isBold) {
          return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
        }
        return <span key={partIdx}>{part}</span>;
      });

      if (isHeader) {
        let iconClass = "neutral";
        let IconComponent = Info;
        if (isWarning) {
          iconClass = "red";
          IconComponent = AlertTriangle;
        } else if (isDoctor) {
          iconClass = "green";
          IconComponent = Stethoscope;
        } else if (isInsight) {
          iconClass = "indigo";
          IconComponent = Sparkles;
        }
        
        return (
          <div key={lineIdx} className="report-section-heading">
            <div className={`section-icon ${iconClass}`}>
              <IconComponent size={18} />
            </div>
            <h3>{parsedContent}</h3>
          </div>
        );
      }

      if (isListItem) {
        return (
          <div key={lineIdx} className="report-list-item">
            <span className="list-bullet" />
            <div>{parsedContent}</div>
          </div>
        );
      }

      return (
        <p key={lineIdx} className="report-paragraph">
          {parsedContent}
        </p>
      );
    });
  };

  return (
    <section className="report-reader">
      {!result && (
        <header className="page-heading report-reader-header">
          <span className="section-kicker">AI MEDICAL REPORT READER</span>
          <h1>Understand your medical reports with clarity.</h1>
          <p>
            Upload a lab report, prescription, or medical scan. Sanjeevani uses AI to turn
            complex medical information into a clear and easy-to-understand explanation.
          </p>
        </header>
      )}

      {!result && (
        <div className="report-reader-upload-card">
          <div 
            {...getRootProps()} 
            className={`report-reader-dropzone ${isDragActive ? 'active' : ''}`}
            onClick={(e) => {
               // Only trigger open on click if it's the main dropzone, so button inside works
               if(e.target.tagName !== 'BUTTON' && e.target.tagName !== 'A') {
                   open();
               }
            }}
          >
            <input {...getInputProps()} />
            <div className="dropzone-icon">
              <UploadCloud size={32} />
            </div>
            <h2>
              {isDragActive ? "Drop your report here" : "Upload your medical report"}
            </h2>
            <p>
              Drag & drop your file here, or{" "}
              <button type="button" className="browse-link" onClick={(e) => { e.stopPropagation(); open(); }}>
                browse from your device
              </button>
            </p>
            <div className="report-reader-formats">
              <FileText size={14} /> PDF, PNG, JPG • Max 10 MB
            </div>
          </div>

          <div className="report-reader-trust">
            <div className="trust-item">
              <div className="trust-icon green"><LockKeyhole size={16} /></div>
              <div className="trust-text">
                <b>Private & secure</b>
                <small>Your report stays protected</small>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon blue"><Zap size={16} /></div>
              <div className="trust-text">
                <b>AI powered</b>
                <small>Fast & easy explanations</small>
              </div>
            </div>
            <div className="trust-item">
              <div className="trust-icon amber"><ShieldCheck size={16} /></div>
              <div className="trust-text">
                <b>Simple language</b>
                <small>Made for everyone</small>
              </div>
            </div>
          </div>

          {file && (
            <div className="report-reader-file">
              <div className="file-info">
                <div className="file-icon">
                  <FileText size={20} />
                </div>
                <div className="file-details">
                  <b>{file.name}</b>
                  <small>{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis</small>
                </div>
                {!loading && (
                  <button type="button" className="remove-btn" onClick={handleRemoveFile}>
                    <X size={18} />
                  </button>
                )}
              </div>
              <button 
                type="button" 
                className="button primary" 
                style={{ width: "100%" }} 
                onClick={handleUpload} 
                disabled={loading}
              >
                {loading ? <Loader2 size={16} /> : <ChevronRight size={16} />}
                {loading ? "Analyzing your report..." : "Analyze Report"}
              </button>

              {loading && (
                <div className="report-reader-loading">
                  <Loader2 size={16} />
                  Reading your document and preparing a simplified explanation...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="report-reader-error">
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div className="error-content">
            <b>Something went wrong</b>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {result && (
        <div className="report-reader-result">
          <div className="report-reader-result-header">
            <div className="result-title">
              <div className="result-meta" style={{ marginBottom: "12px", display: "inline-flex", background: "transparent", border: 0, padding: 0, color: "#2f7cc0" }}>
                <CircleCheck size={14} /> Analysis complete
              </div>
              <h1>Your simplified report</h1>
              <p>A clearer explanation of the information found in your uploaded document.</p>
            </div>
            <div className="result-meta">
              <Sparkles size={14} style={{ color: "#2f7cc0" }} />
              AI Analysis • {language}
            </div>
          </div>
          
          <div className="report-reader-result-content">
            {renderFormattedText(result)}
          </div>
          
          <div className="report-reader-actions" style={{ display: "flex", gap: "12px", padding: "0 32px 32px", justifyContent: "flex-start" }}>
            <button 
              onClick={handleDownloadPDF}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
            >
              <Download size={16} style={{ color: "#047857" }} /> Download PDF
            </button>
            <button 
              onClick={handleReset}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f5f5f4", color: "#44403c", border: "1px solid #d6d3d1", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s" }}
            >
              <RotateCcw size={16} style={{ color: "#57534e" }} /> Analyze Another Document
            </button>
          </div>
          
          <div className="disclaimer" style={{ margin: "0 32px 32px", borderTop: "1px solid #eee9e1", paddingTop: "20px", fontSize: "11px", color: "#817b72" }}>
            Disclaimer: This AI-generated summary is for informational and educational purposes only and does not replace professional medical evaluation, diagnosis, or treatment. Always consult your healthcare provider.
          </div>
        </div>
      )}
    </section>
  );
}