import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, ArrowLeft, Download, RefreshCw,
  BookOpen, Briefcase, GraduationCap, ChevronDown, ChevronUp,
  Star, ExternalLink, Sparkles, TrendingUp, AlertTriangle, Info
} from 'lucide-react';

import CircularScore from '../components/CircularScore';
import Navbar from '../components/Navbar';

const IMPORTANCE_COLORS = {
  Critical: { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3', dot: '#E11D48' },
  High: { bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74', dot: '#F97316' },
  Medium: { bg: '#FEFCE8', text: '#A16207', border: '#FDE047', dot: '#CA8A04' },
};

function SkillRow({ item, index }) {
  const [open, setOpen] = useState(false);
  const colors = IMPORTANCE_COLORS[item.importance] || IMPORTANCE_COLORS.Medium;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="border border-red-100 rounded-xl overflow-hidden"
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-red-50/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="font-semibold text-warm-dark">{item.skill}</span>
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
            style={{ color: colors.text, backgroundColor: colors.bg, borderColor: colors.border }}
          >
            {item.importance}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-warm-mid hidden sm:block">Course available</span>
          {open ? <ChevronUp className="w-4 h-4 text-warm-mid" /> : <ChevronDown className="w-4 h-4 text-warm-mid" />}
        </div>
      </div>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-red-100 bg-red-50/30 px-4 py-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-warm-brown font-medium mb-1">Recommended Course</p>
              <p className="text-warm-dark font-semibold">{item.course?.title}</p>
              <p className="text-warm-mid text-sm mt-0.5">{item.course?.provider} · {item.course?.price}</p>
            </div>
            <a
              href={item.course?.url}
              target="_blank"
              rel="noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Enroll <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── PDF Generator ─────────────────────────────────────────────────────────────
async function exportToPDF(result, role, companies) {
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210;   // page width
  const PH = 297;   // page height
  const ML = 18;    // left margin
  const MR = 18;    // right margin
  const CW = PW - ML - MR;  // content width
  const BOTTOM = 278;        // max y before footer
  let y = 0;

  // ── Color palette ──────────────────────────────────────────────────────────
  const C = {
    orange: [249, 115, 22],
    orangeD: [194, 82, 8],
    orangeL: [255, 247, 237],
    dark: [28, 25, 23],
    gray: [75, 65, 55],
    mid: [130, 115, 100],
    light: [200, 185, 170],
    bg: [255, 252, 248],
    white: [255, 255, 255],
    green: [22, 163, 74],
    greenL: [240, 253, 244],
    red: [220, 38, 38],
    redL: [255, 241, 242],
    amber: [180, 110, 0],
    amberL: [255, 251, 235],
    blue: [29, 78, 216],
    blueL: [239, 246, 255],
    purple: [109, 40, 217],
    purpleL: [245, 243, 255],
    border: [220, 205, 190],
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const sf = (c) => doc.setFillColor(...c);
  const sd = (c) => doc.setDrawColor(...c);
  const st = (c) => doc.setTextColor(...c);
  const font = (style, size) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  };
  const lw = (w) => doc.setLineWidth(w);

  const newPage = () => {
    doc.addPage();
    // Subtle page bg
    sf(C.bg); doc.rect(0, 0, PW, PH, 'F');
    // Top thin orange rule
    sf(C.orange); doc.rect(0, 0, PW, 1.5, 'F');
    y = 20;
  };

  const gap = (n = 5) => { y += n; };

  const check = (need = 12) => {
    if (y + need > BOTTOM) newPage();
  };

  // ── Text helpers ───────────────────────────────────────────────────────────
  // Single line label + value on the same row
  const labelValue = (label, value, indent = ML) => {
    check(7);
    font('bold', 8.5);
    st(C.gray);
    doc.text(label, indent, y);
    font('normal', 8.5);
    st(C.dark);
    doc.text(String(value || '—'), indent + doc.getTextWidth(label) + 2, y);
    y += 6;
  };

  // Wrapped paragraph text
  const para = (text, indent = ML, maxW = CW) => {
    font('normal', 8.5);
    st(C.gray);
    const lines = doc.splitTextToSize(String(text || ''), maxW);
    lines.forEach(line => {
      check(6);
      doc.text(line, indent, y);
      y += 5.5;
    });
  };

  // ── Section heading ────────────────────────────────────────────────────────
  const section = (title) => {
    check(16);
    gap(4);
    // Full-width orange left bar + heading background
    sf(C.orangeL);
    doc.roundedRect(ML, y, CW, 9, 1.5, 1.5, 'F');
    sf(C.orange);
    doc.rect(ML, y, 3, 9, 'F');
    font('bold', 9.5);
    st(C.orangeD);
    doc.text(title.toUpperCase(), ML + 7, y + 6);
    y += 13;
  };

  // ── Divider line ───────────────────────────────────────────────────────────
  const divider = () => {
    check(4);
    lw(0.2);
    sd(C.border);
    doc.line(ML, y, ML + CW, y);
    y += 4;
  };

  // ── Stat box (score area) ──────────────────────────────────────────────────
  const statBox = (label, value, color, bgColor, x, w) => {
    sf(bgColor);
    lw(0.2); sd(C.border);
    doc.roundedRect(x, y, w, 22, 2, 2, 'FD');
    font('bold', 16);
    st(color);
    doc.text(String(value), x + w / 2, y + 13, { align: 'center' });
    font('normal', 7);
    st(C.mid);
    doc.text(label, x + w / 2, y + 19, { align: 'center' });
  };

  // ── Skill pill (inline wrapping) ───────────────────────────────────────────
  const skillPills = (skills, bgColor, textColor) => {
    const pillH = 6.5;
    const padX = 4;
    const gap2 = 3;
    let px = ML;

    skills.forEach(skill => {
      font('normal', 7.5);
      const tw = doc.getTextWidth(skill) + padX * 2;
      if (px + tw > ML + CW) {
        px = ML;
        y += pillH + gap2;
        check(pillH + gap2);
      }
      sf(bgColor); lw(0.15); sd(C.border);
      doc.roundedRect(px, y, tw, pillH, 1.5, 1.5, 'FD');
      st(textColor);
      doc.text(skill, px + padX, y + 4.8);
      px += tw + gap2;
    });
    y += pillH + 5;
  };

  // ── Table row ──────────────────────────────────────────────────────────────
  const tableRow = (cells, widths, isHeader = false) => {
    check(8);
    const rowH = isHeader ? 8 : 7;
    let cx = ML;

    if (isHeader) {
      sf(C.dark); doc.rect(ML, y, CW, rowH, 'F');
    } else {
      sf(C.white); lw(0.15); sd(C.border);
      doc.rect(ML, y, CW, rowH, 'FD');
    }

    cells.forEach((cell, i) => {
      font(isHeader ? 'bold' : 'normal', isHeader ? 7.5 : 7.5);
      st(isHeader ? C.white : C.dark);
      const clipped = doc.splitTextToSize(String(cell || '—'), widths[i] - 4)[0];
      doc.text(clipped, cx + 3, y + (isHeader ? 5.5 : 5));
      cx += widths[i];
    });
    y += rowH;
  };

  // Alternating row color
  const tableRowAlt = (cells, widths, rowIndex) => {
    check(8);
    const rowH = 7;
    let cx = ML;
    sf(rowIndex % 2 === 0 ? C.white : C.bg);
    lw(0.1); sd(C.border);
    doc.rect(ML, y, CW, rowH, 'FD');

    cells.forEach((cell, i) => {
      font('normal', 7.5);
      st(C.dark);
      const clipped = doc.splitTextToSize(String(cell || '—'), widths[i] - 4)[0];
      doc.text(clipped, cx + 3, y + 5);
      cx += widths[i];
    });
    y += rowH;
  };

  // ── Importance badge (inline) ──────────────────────────────────────────────
  const impColor = (imp) => {
    if (imp === 'Critical') return [C.red, C.redL];
    if (imp === 'High') return [C.amber, C.amberL];
    return [[100, 150, 50], [240, 253, 230]];
  };

  // ── Bullet list item ───────────────────────────────────────────────────────
  const bullet = (text, color = C.orange, indent = ML) => {
    check(7);
    sf(color);
    doc.circle(indent + 2, y - 1, 1.2, 'F');
    font('normal', 8.5);
    st(C.gray);
    const lines = doc.splitTextToSize(text, CW - 8);
    doc.text(lines[0], indent + 6, y);
    y += 6;
    if (lines.length > 1) {
      lines.slice(1).forEach(l => { check(6); doc.text(l, indent + 6, y); y += 5.5; });
    }
  };

  // ── Footer on every page ───────────────────────────────────────────────────
  const drawFooters = () => {
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      // Footer bar
      sf(C.dark); doc.rect(0, 287, PW, 10, 'F');
      font('normal', 7); st(C.light);
      doc.text('Resume Skill Gap Analyzer', ML, 293);
      st(C.mid);
      doc.text(`Page ${p} of ${total}`, PW - MR, 293, { align: 'right' });
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  PAGE 1 — HEADER + SCORE + SUMMARY
  // ══════════════════════════════════════════════════════════════════
  sf(C.bg); doc.rect(0, 0, PW, PH, 'F');

  // ── Header ──────────────────────────────────────────────────────
  sf(C.dark); doc.rect(0, 0, PW, 42, 'F');

  // Orange accent strip at bottom of header
  sf(C.orange); doc.rect(0, 39, PW, 3, 'F');

  // Title
  font('bold', 20); st(C.white);
  doc.text('Resume Skill Gap Report', ML, 18);

  // Subtitle row
  font('normal', 9); st([200, 190, 180]);
  const roleStr = role || 'General Analysis';
  const compStr = companies?.length > 0 ? `  |  ${companies.join(', ')}` : '';
  doc.text(`${roleStr}${compStr}`, ML, 27);

  // Date right-aligned
  font('normal', 8); st([160, 150, 140]);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(dateStr, PW - MR, 27, { align: 'right' });

  y = 52;

  // ── Score + Stats row ─────────────────────────────────────────────
  const score = result.score;
  const scoreColor = score >= 85 ? C.green : score >= 70 ? C.orange : C.red;
  const scoreLabel = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 55 ? 'Average' : 'Needs Work';

  const ROW_TOP = y;         // top of entire score row
  const CARD_H = 50;        // same height for score card and stat boxes
  const SCORE_CARD_W = 50;   // width of left score card
  const GAP = 4;             // gap between score card and stat boxes
  const STAT_AREA_X = ML + SCORE_CARD_W + GAP;
  const STAT_AREA_W = CW - SCORE_CARD_W - GAP;
  const STAT_W = STAT_AREA_W / 3;

  // ── Left: Score card ──────────────────────────────────────────────
  sf(C.white); lw(0.3); sd(C.border);
  doc.roundedRect(ML, ROW_TOP, SCORE_CARD_W, CARD_H, 3, 3, 'FD');

  // Colored circle — centred in card
  sf(scoreColor);
  doc.circle(ML + SCORE_CARD_W / 2, ROW_TOP + 22, 15, 'F');

  // Score number centred in circle
  font('bold', 17); st(C.white);
  doc.text(String(score), ML + SCORE_CARD_W / 2, ROW_TOP + 20, { align: 'center' });

  // % sign just below number
  font('normal', 7); st(C.white);
  doc.text('%', ML + SCORE_CARD_W / 2, ROW_TOP + 27, { align: 'center' });

  // Label below circle, inside card
  font('bold', 8); st(scoreColor);
  doc.text(scoreLabel, ML + SCORE_CARD_W / 2, ROW_TOP + 43, { align: 'center' });

  // ── Right: Three stat boxes aligned in one row ─────────────────────
  const stats3 = [
    { label: 'Matched Skills', value: String(result.matchedSkills.length), color: C.green, bg: C.greenL },
    { label: 'Skill Gaps', value: String(result.unmatchedSkills.length), color: C.red, bg: C.redL },
    { label: 'Readiness', value: score + '%', color: C.orange, bg: C.orangeL },
  ];

  stats3.forEach((s, i) => {
    const bx = STAT_AREA_X + i * STAT_W;
    const by = ROW_TOP;
    sf(s.bg); lw(0.2); sd(C.border);
    doc.roundedRect(bx + (i === 0 ? 0 : 2), by, STAT_W - 2, CARD_H, 2, 2, 'FD');

    // Big number centred vertically in top 2/3
    font('bold', 18); st(s.color);
    doc.text(s.value, bx + STAT_W / 2, by + 26, { align: 'center' });

    // Label centred in bottom 1/3
    font('normal', 7); st(C.mid);
    const labelLines = doc.splitTextToSize(s.label, STAT_W - 6);
    labelLines.forEach((line, li) => {
      doc.text(line, bx + STAT_W / 2, by + 37 + li * 5, { align: 'center' });
    });
  });

  y = ROW_TOP + CARD_H + 6;
  divider();

  // ── AI Summary ────────────────────────────────────────────────────
  section('AI Summary');
  sf(C.white); lw(0.2); sd(C.border);
  const summaryLines = doc.splitTextToSize(result.summary || '', CW - 8);
  const summaryH = summaryLines.length * 5.5 + 10;
  doc.roundedRect(ML, y, CW, summaryH, 2, 2, 'FD');
  // Orange left accent
  sf(C.orange); doc.rect(ML, y, 2.5, summaryH, 'F');
  font('normal', 8.5); st(C.gray);
  doc.text(summaryLines, ML + 7, y + 7);
  y += summaryH + 6;

  // ══════════════════════════════════════════════════════════════════
  //  SKILLS SECTIONS
  // ══════════════════════════════════════════════════════════════════
  section('Matched Skills');
  skillPills(result.matchedSkills, C.greenL, C.green);
  gap(2);

  section('Skill Gaps (Overview)');
  skillPills(result.unmatchedSkills.map(s => s.skill), C.redL, C.red);
  gap(2);

  // ── Skill Gaps Detail Table ────────────────────────────────────────
  section('Skill Gaps & Recommended Courses');

  // Table header
  const colW = [50, 28, 60, 36];   // Skill | Importance | Course | Price
  tableRow(['Skill', 'Importance', 'Recommended Course', 'Price'], colW, true);

  result.unmatchedSkills.forEach((item, i) => {
    check(8);
    const rowH = 7;
    sf(i % 2 === 0 ? C.white : C.bg);
    lw(0.1); sd(C.border);
    doc.rect(ML, y, CW, rowH, 'FD');

    // Skill name
    font('bold', 7.5); st(C.dark);
    doc.text(doc.splitTextToSize(item.skill, colW[0] - 4)[0], ML + 3, y + 5);

    // Importance badge text only
    const [ic] = impColor(item.importance);
    font('bold', 7); st(ic);
    doc.text(item.importance || '—', ML + colW[0] + 3, y + 5);

    // Course title
    font('normal', 7); st(C.gray);
    const ct = doc.splitTextToSize(item.course?.title || '—', colW[2] - 4)[0];
    doc.text(ct, ML + colW[0] + colW[1] + 3, y + 5);

    // Price
    font('normal', 7); st(C.mid);
    doc.text(item.course?.price || '—', ML + colW[0] + colW[1] + colW[2] + 3, y + 5);

    y += rowH;
  });

  gap(6);

  // ══════════════════════════════════════════════════════════════════
  //  STRENGTHS & IMPROVEMENTS (2 columns)
  // ══════════════════════════════════════════════════════════════════
  section('Strengths & Areas to Improve');

  const halfW = (CW - 6) / 2;

  // Left card — Strengths
  const strLines = result.topStrengths.length;
  const cardH = strLines * 7 + 12;
  check(cardH);
  const cardY = y;

  sf(C.greenL); lw(0.2); sd(C.border);
  doc.roundedRect(ML, cardY, halfW, cardH, 2, 2, 'FD');
  font('bold', 8.5); st(C.green);
  doc.text('Your Strengths', ML + 5, cardY + 8);
  result.topStrengths.forEach((s, i) => {
    font('normal', 8); st(C.gray);
    sf(C.green);
    doc.circle(ML + 6, cardY + 15 + i * 7, 1.2, 'F');
    const txt = doc.splitTextToSize(s, halfW - 14)[0];
    doc.text(txt, ML + 10, cardY + 16 + i * 7);
  });

  // Right card — Improvements
  const impLines = result.improvements.length;
  const cardH2 = impLines * 7 + 12;
  sf(C.amberL); lw(0.2); sd(C.border);
  doc.roundedRect(ML + halfW + 6, cardY, halfW, Math.max(cardH, cardH2), 2, 2, 'FD');
  font('bold', 8.5); st(C.amber);
  doc.text('Areas to Improve', ML + halfW + 11, cardY + 8);
  result.improvements.forEach((s, i) => {
    font('normal', 8); st(C.gray);
    sf(C.amber);
    doc.circle(ML + halfW + 11, cardY + 15 + i * 7, 1.2, 'F');
    const txt = doc.splitTextToSize(s, halfW - 14)[0];
    doc.text(txt, ML + halfW + 15, cardY + 16 + i * 7);
  });

  y = cardY + Math.max(cardH, cardH2) + 8;

  // ══════════════════════════════════════════════════════════════════
  //  EXPERIENCE & EDUCATION
  // ══════════════════════════════════════════════════════════════════
  if (result.experience?.length > 0) {
    section('Work Experience');
    tableRow(['Role / Title', 'Company', 'Duration', 'Year'], [65, 65, 30, 14], true);
    result.experience.forEach((e, i) =>
      tableRowAlt([e.role, e.company, e.duration, e.year], [65, 65, 30, 14], i)
    );
    gap(6);
  }

  if (result.education?.length > 0) {
    section('Education');
    tableRow(['Degree', 'Institution', 'Score / GPA', 'Year'], [60, 70, 34, 10], true);
    result.education.forEach((e, i) =>
      tableRowAlt([e.degree, e.institution, e.score, e.year], [60, 70, 34, 10], i)
    );
    gap(6);
  }

  // ── Footers ───────────────────────────────────────────────────────
  drawFooters();

  const filename = `skill-gap-report-${(role || 'analysis').toLowerCase().replace(/\s+/g, '-')}.pdf`;
  doc.save(filename);
}

// ── Dashboard Component ───────────────────────────────────────────────────────
export default function Dashboard() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPDF(result, state?.role, state?.companies);
    } finally {
      setExporting(false);
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-warm-gradient flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-warm-xl p-10 max-w-md w-full text-center">
          <h2 className="font-display text-2xl font-bold text-warm-dark mb-4">No Analysis Found</h2>
          <p className="text-warm-brown mb-6">Please upload your resume to get started.</p>
          <button onClick={() => navigate('/home')} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-gradient">
      <Navbar onUploadClick={() => navigate('/home')} />

      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => navigate('/home')}
                className="flex items-center gap-1 text-warm-brown hover:text-orange-600 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-warm-dark">
              Your Analysis Dashboard
            </h1>
            {state?.role && (
              <p className="text-warm-brown mt-1">
                Analyzed for: <span className="font-semibold text-orange-600">{state.role}</span>
                {state.companies?.length > 0 && ` · ${state.companies.join(', ')}`}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/home')}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Re-analyze
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Top row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="card p-8 flex flex-col items-center justify-center"
          >
            <CircularScore score={result.score} size={220} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="font-semibold text-warm-dark text-lg">Resume Overview</h2>
            </div>
            <p className="text-warm-brown leading-relaxed text-sm mb-5">{result.summary}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Matched Skills', value: result.matchedSkills.length, color: '#16A34A', bg: '#F0FDF4' },
                { label: 'Skill Gaps', value: result.unmatchedSkills.length, color: '#DC2626', bg: '#FFF1F2' },
                { label: 'Readiness', value: `${result.score}%`, color: '#F97316', bg: '#FFF7ED' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: s.bg }}>
                  <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-warm-mid mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Skills Analysis ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="font-semibold text-warm-dark text-lg">Matched Skills</h2>
              <span className="ml-auto bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {result.matchedSkills.length} skills
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.matchedSkills.map((skill, i) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="badge-matched"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="font-semibold text-warm-dark text-lg">Skill Gaps</h2>
              <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                {result.unmatchedSkills.length} gaps
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {result.unmatchedSkills.map((item, i) => (
                <motion.span
                  key={item.skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="badge-unmatched"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {item.skill}
                </motion.span>
              ))}
            </div>
            <p className="text-xs text-warm-mid">Click each skill below for course recommendations ↓</p>
          </motion.div>
        </div>

        {/* ── Detailed Skill Gaps ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="font-semibold text-warm-dark text-lg">Skill Gaps & Recommended Courses</h2>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-warm-mid">
              <Info className="w-3.5 h-3.5" />
              Click each row to see course
            </div>
          </div>
          <div className="space-y-3">
            {result.unmatchedSkills.map((item, i) => (
              <SkillRow key={item.skill} item={item} index={i} />
            ))}
          </div>
        </motion.div>

        {/* ── Strengths + Improvements ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Star className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="font-semibold text-warm-dark">Your Strengths</h2>
            </div>
            <div className="space-y-3">
              {result.topStrengths.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-warm-brown text-sm">{s}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="font-semibold text-warm-dark">Areas to Improve</h2>
            </div>
            <div className="space-y-3">
              {result.improvements.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.08 }} className="flex items-start gap-2.5">
                  <TrendingUp className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-warm-brown text-sm">{s}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Experience & Education ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-semibold text-warm-dark">Work Experience</h2>
            </div>
            <div className="space-y-4">
              {result.experience.map((exp, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-warm-dark text-sm">{exp.role}</p>
                    <p className="text-warm-brown text-sm">{exp.company}</p>
                    <p className="text-warm-mid text-xs mt-0.5">{exp.duration} · {exp.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="font-semibold text-warm-dark">Education</h2>
            </div>
            {result.education.map((edu, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-warm-dark text-sm">{edu.degree}</p>
                  <p className="text-warm-brown text-sm">{edu.institution}</p>
                  <p className="text-warm-mid text-xs mt-0.5">{edu.score} · {edu.year}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card p-8 text-center bg-orange-gradient"
        >
          <h2 className="font-display text-2xl font-bold text-white mb-3">Improve & Re-analyze</h2>
          <p className="text-white/80 mb-6">Work on your skill gaps, update your resume, and watch your readiness score climb!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-bold rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4" />
              Upload New Resume
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Generating...' : 'Download Report'}
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}