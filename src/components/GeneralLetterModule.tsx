import React, { useState, useEffect, useRef } from "react";
import { Save, Printer, Download, FileText, Undo, Check, Loader, Sparkles } from "lucide-react";
import { User, GeneralLetterData } from "../types";
import { getUsers, addAuditLog, getGeneralLetter, saveGeneralLetter } from "../utils/storage";
import { exportToWord, renderSharedLetterLayout } from "../utils/exportUtils";
import { NOTO_SANS_GUJARATI_BASE64 } from "../utils/notoSansGujaratiBase64";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface GeneralLetterModuleProps {
  currentUser: User;
}

export default function GeneralLetterModule({ currentUser }: GeneralLetterModuleProps) {
  const [templateId, setTemplateId] = useState<string>("general_letter");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Default General Letter state
  const [letterData, setLetterData] = useState<GeneralLetterData>({
    id: "general_letter",
    templateName: "General Letter",
    instituteName: "ઔદ્યોગિક તાલીમ સંસ્થા, પોરબંદર",
    siName: "",
    designation: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર",
    date: new Date().toISOString().split("T")[0],
    recipient: "પ્રતિ,\nઆચાર્યશ્રી,\nઔદ્યોગિક તાલીમ સંસ્થા, પોરબંદર.",
    subject: "વિષય : તાલીમાર્થીઓની અનિયમિતતા બાબતે.",
    body: "માનનીય સાહેબશ્રી,\n\n      ઉપરોક્ત વિષય અન્વયે સવિનય સાથ જણાવવાનું કે ટ્રેડના તાલીમાર્થીઓ અનિયમિત છે, તો આ અંગે યોગ્ય કાર્યવાહી કરવા વિનંતી છે.",
    closing: "આપનો વિશ્વાસુ,",
    signature: "",
  });

  // Load saved letter data on mount or templateId change
  useEffect(() => {
    // Determine SI's Gujarati Name as default
    let defaultSiName = currentUser.name;
    try {
      const users = getUsers();
      const matchedUser = users.find(u => u.id === currentUser.id);
      if (matchedUser?.supervisorNameGujarati) {
        defaultSiName = matchedUser.supervisorNameGujarati;
      } else if (matchedUser?.supervisorNameEnglish) {
        defaultSiName = matchedUser.supervisorNameEnglish;
      }
    } catch (err) {
      console.error("Error fetching SI details:", err);
    }

    const saved = getGeneralLetter(templateId);
    if (saved) {
      setLetterData(saved);
    } else {
      // Fallback to default
      setLetterData({
        id: templateId,
        templateName: "General Letter",
        instituteName: "ઔદ્યોગિક તાલીમ સંસ્થા, પોરબંદર",
        siName: defaultSiName,
        designation: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર",
        date: new Date().toISOString().split("T")[0],
        recipient: "પ્રતિ,\nઆચાર્યશ્રી,\nઔદ્યોગિક તાલીમ સંસ્થા, પોરબંદર.",
        subject: "વિષય : તાલીમાર્થીઓની અનિયમિતતા બાબતે.",
        body: "માનનીય સાહેબશ્રી,\n\n      ઉપરોક્ત વિષય અન્વયે સવિનય સાથ જણાવવાનું કે ટ્રેડના તાલીમાર્થીઓ અનિયમિત છે, તો આ અંગે યોગ્ય કાર્યવાહી કરવા વિનંતી છે.",
        closing: "આપનો વિશ્વાસુ,",
        signature: defaultSiName,
      });
    }
  }, [templateId, currentUser]);

  const handleFieldChange = (field: keyof GeneralLetterData, value: string) => {
    setLetterData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      saveGeneralLetter(templateId, letterData);
      
      addAuditLog(
        currentUser.name,
        `Saved General Letter Template ("${letterData.templateName}") details permanently.`
      );

      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }, 400);
    } catch (err: any) {
      setIsSaving(false);
      alert("Failed to save letter template: " + err.message);
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm("Are you sure you want to restore default template values? This will clear your custom edits.")) {
      let defaultSiName = currentUser.name;
      try {
        const users = getUsers();
        const matchedUser = users.find(u => u.id === currentUser.id);
        if (matchedUser?.supervisorNameGujarati) {
          defaultSiName = matchedUser.supervisorNameGujarati;
        }
      } catch (err) {
        console.error("Error reading users:", err);
      }

      const defaults: GeneralLetterData = {
        id: "general_letter",
        templateName: "General Letter",
        instituteName: "ઔદ્યોગિક તાલીમ સંસ્થા, પોરબંદર",
        siName: defaultSiName,
        designation: "સુપરવાઇઝર ઇન્સ્ટ્રક્ટર",
        date: new Date().toISOString().split("T")[0],
        recipient: "પ્રતિ,\nઆચાર્યશ્રી,\nઔદ્યોગિક તાલીમ સંસ્થા, પોરબંદર.",
        subject: "વિષય : તાલીમાર્થીઓની અનિયમિતતા બાબતે.",
        body: "માનનીય સાહેબશ્રી,\n\n      ઉપરોક્ત વિષય અન્વયે સવિનય સાથ જણાવવાનું કે ટ્રેડના તાલીમાર્થીઓ અનિયમિત છે, તો આ અંગે યોગ્ય કાર્યવાહી કરવા વિનંતી છે.",
        closing: "આપનો વિશ્વાસુ,",
        signature: defaultSiName,
      };

      setLetterData(defaults);
      saveGeneralLetter(templateId, defaults);
      
      addAuditLog(currentUser.name, `Restored default General Letter settings.`);
    }
  };

  const dateFormatted = new Date(letterData.date).toLocaleDateString("gu-IN");

  // Helper to compile letter HTML content for Word / Print / Canvas PDF using shared layout helper
  const getLetterHtml = (isForWord: boolean = false) => {
    return renderSharedLetterLayout({
      resolvedSiName: letterData.siName,
      designation: letterData.designation,
      instituteName: letterData.instituteName,
      dateFormatted,
      recipient: letterData.recipient,
      subject: letterData.subject,
      body: letterData.body,
      closing: letterData.closing,
      signature: letterData.signature,
      isForWord
    });
  };

  const handlePrint = () => {
    const printWindow = document.createElement("iframe");
    printWindow.style.position = "fixed";
    printWindow.style.right = "0";
    printWindow.style.bottom = "0";
    printWindow.style.width = "0";
    printWindow.style.height = "0";
    printWindow.style.border = "0";
    document.body.appendChild(printWindow);

    const doc = printWindow.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${letterData.templateName} - ITI Porbandar</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;700&family=Inter:wght@400;600;700&display=swap');
            
            @page {
              size: A4 portrait;
              margin: 20mm 20mm 20mm 20mm;
            }
            
            body {
              font-family: 'Noto Sans Gujarati', 'Inter', sans-serif;
              color: #000;
              background-color: #fff;
              margin: 0;
              padding: 0;
              font-size: 13.5px;
              line-height: 1.7;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .container {
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${getLetterHtml(false)}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printWindow.contentWindow?.focus();
      printWindow.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printWindow);
      }, 1000);
    }, 500);

    addAuditLog(currentUser.name, `Printed General Letter (${letterData.templateName})`);
  };

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Create passive container for high-fidelity rendering
      const tempContainer = document.createElement("div");
      tempContainer.id = "temp-general-letter-container";
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "0px";
      tempContainer.style.top = "0px";
      tempContainer.style.zIndex = "-9999";
      tempContainer.style.opacity = "1";
      tempContainer.style.pointerEvents = "none";
      tempContainer.style.width = "794px"; // Exact A4 width at 96 DPI
      tempContainer.style.minHeight = "1123px"; // Exact A4 height at 96 DPI
      tempContainer.style.backgroundColor = "#ffffff";
      tempContainer.style.color = "#000000";
      tempContainer.style.padding = "65px";
      tempContainer.style.boxSizing = "border-box";

      tempContainer.innerHTML = `
        <style>
          @font-face {
            font-family: 'Noto Sans Gujarati';
            src: url('data:font/ttf;base64,${NOTO_SANS_GUJARATI_BASE64}') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          .pdf-font {
            font-family: 'Noto Sans Gujarati', 'Inter', sans-serif !important;
          }
        </style>
        <div class="pdf-font">
          ${getLetterHtml(false)}
        </div>
      `;

      document.body.appendChild(tempContainer);

      // Wait for fonts to be ready
      if (typeof document !== "undefined" && (document as any).fonts) {
        await (document as any).fonts.ready;
      }
      await new Promise(resolve => setTimeout(resolve, 350));

      const targetWidth = tempContainer.offsetWidth > 0 ? tempContainer.offsetWidth : 794;
      const targetHeight = tempContainer.offsetHeight > 0 ? tempContainer.offsetHeight : 1123;

      const canvas = await html2canvas(tempContainer, {
        scale: 3, // High quality vector capture
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: targetWidth,
        height: targetHeight,
      });

      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;

      // Add extra pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
      }

      const filename = `${letterData.templateName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(filename);
      
      addAuditLog(currentUser.name, `Downloaded General Letter PDF (${filename})`);
      alert(`Successfully generated and downloaded PDF: ${filename}`);
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      alert("Error generating PDF: " + error.message);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadWord = () => {
    const cleanTemplateName = letterData.templateName.replace(/\s+/g, "_");
    const filename = `${cleanTemplateName}_${new Date().toISOString().split("T")[0]}`;
    const wordHtml = getLetterHtml(true);
    
    exportToWord(filename, wordHtml);
    addAuditLog(currentUser.name, `Exported General Letter to Word (${filename}.doc)`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <FileText size={20} />
            </span>
            Official General Letter Module
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Draft, edit, save, and export customizable government letters and reports in Noto Sans Gujarati.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleRestoreDefaults}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-300"
            title="Restore Defaults"
          >
            <Undo size={14} /> Restore Defaults
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100 border border-indigo-700"
          >
            {isSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Save Template
          </button>
        </div>
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold animate-fadeIn">
          <Check size={16} className="text-emerald-600 shrink-0" />
          General Letter template details saved permanently! Future downloads or prints will use these updated values.
        </div>
      )}

      {/* Extensible Future Ready Selector Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles size={13} className="text-indigo-600 animate-pulse" /> Active Letter Template Configuration
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            The letter module supports extensible future template configurations. Initially configured with General Letter.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Template:</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full md:w-64 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="general_letter">General Letter (ગેરહાજરી / સામાન્ય પત્ર)</option>
          </select>
        </div>
      </div>

      {/* Two Pane Workspace: Editor Left, Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor (Left Pane) - 5 Cols */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-5">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2.5">
            ✍️ Letter Editor Sections (પત્ર સંપાદક વિભાગો)
          </h3>

          {/* Section 1: Header */}
          <div className="space-y-3.5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
              <span>Section 1:</span> Header details (પત્ર શિર્ષક)
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Institute Name (સંસ્થા નામ)</label>
                <input
                  type="text"
                  value={letterData.instituteName}
                  onChange={(e) => handleFieldChange("instituteName", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">SI Name (કર્મચારી નામ)</label>
                  <input
                    type="text"
                    value={letterData.siName}
                    onChange={(e) => handleFieldChange("siName", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Designation (હોદ્દો)</label>
                  <input
                    type="text"
                    value={letterData.designation}
                    onChange={(e) => handleFieldChange("designation", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Date (તારીખ)</label>
                <input
                  type="date"
                  value={letterData.date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Recipient */}
          <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
              <span>Section 2:</span> Recipient (મેળવનાર સરનામું)
            </p>
            <textarea
              rows={3}
              value={letterData.recipient}
              onChange={(e) => handleFieldChange("recipient", e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="પ્રતિ, ..."
            />
          </div>

          {/* Section 3: Subject */}
          <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
              <span>Section 3:</span> Subject (પત્ર વિષય)
            </p>
            <input
              type="text"
              value={letterData.subject}
              onChange={(e) => handleFieldChange("subject", e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="વિષય : ..."
            />
          </div>

          {/* Section 4: Body */}
          <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
              <span>Section 4:</span> Body (પત્ર વિગત)
            </p>
            <textarea
              rows={6}
              value={letterData.body}
              onChange={(e) => handleFieldChange("body", e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="માનનીય સાહેબશ્રી, ..."
            />
          </div>

          {/* Section 5 & 6: Closing & Signature */}
          <div className="grid grid-cols-2 gap-3.5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-1.5">
              <p className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wide">
                <span>Section 5:</span> Closing
              </p>
              <input
                type="text"
                value={letterData.closing}
                onChange={(e) => handleFieldChange("closing", e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wide">
                <span>Section 6:</span> Signature
              </p>
              <input
                type="text"
                value={letterData.signature}
                onChange={(e) => handleFieldChange("signature", e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[9px] text-slate-400 font-bold leading-none">Only SI Name as required</p>
            </div>
          </div>
        </div>

        {/* Live Preview (Right Pane) - 7 Cols */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preview Panel Title Bar */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-3xs">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shrink-0"></span>
              Live A4 Print & Export Preview
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-1 border border-indigo-700"
              >
                <Printer size={12} /> Print (પ્રિન્ટ)
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isExportingPDF}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
              >
                {isExportingPDF ? <Loader size={12} className="animate-spin" /> : <Download size={12} />}
                PDF (ડાઉનલોડ)
              </button>
              <button
                onClick={handleDownloadWord}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-[10px] font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-1 border border-blue-800"
              >
                <FileText size={12} /> Word (વર્ડ ડાઉનલોડ)
              </button>
            </div>
          </div>

          {/* High Fidelity A4 Document Area */}
          <div className="bg-white border-2 border-slate-200 shadow-xl rounded-2xl p-8 md:p-12 min-h-[750px] flex flex-col justify-between select-none relative overflow-hidden text-black text-[13.5px]">
            {/* watermark or styling indicator */}
            <div className="absolute top-0 right-0 bg-indigo-50 border-bl border-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-lg">
              Official Template Preview
            </div>

            <div dangerouslySetInnerHTML={{ __html: getLetterHtml(false) }} />
          </div>
        </div>
      </div>
    </div>
  );
}
