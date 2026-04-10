import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DejaVu');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'DejaVuBold');

// ── Stats card palette ─────────────────────────────────────────────────────────
const ORANGE       = '#F07427';
const ORANGE_LIGHT = '#FFD4A8';
const GRAY         = '#AAAAAA';
const WHITE        = '#FFFFFF';

// ── Leaderboard palette (dark theme) ──────────────────────────────────────────
const BG_DARK      = '#0D1117';
const BG_CARD      = '#161B22';
const ACCENT_1     = '#5865F2';
const ACCENT_2     = '#EB459E';
const TEXT_1       = '#FFFFFF';
const TEXT_2       = '#8B949E';
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_BG     = [
  'rgba(255,215,0,0.09)',
  'rgba(192,192,192,0.06)',
  'rgba(205,127,50,0.07)',
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawCircleAvatar(ctx, url, cx, cy, r, fallbackInitial = '?', fallbackBg = ACCENT_1) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('bad response');
    const buf = await res.arrayBuffer();
    const img = await loadImage(Buffer.from(buf));
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  } catch {
    ctx.save();
    ctx.fillStyle = fallbackBg;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = WHITE;
    ctx.font = `bold ${Math.floor(r)}px 'DejaVuBold'`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallbackInitial[0]?.toUpperCase() ?? '?', cx, cy + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
}

function truncateText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text + '…').width > maxW) {
    text = text.slice(0, -1);
  }
  return text + '…';
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS CARD  —  1000 × 250  (exact reference dimensions)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateStatsCard({ user, level, xp, totalXp, rank }) {
  const W = 1000, H = 250;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // ── White background ────────────────────────────────────────────────────────
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, W, H);

  // ── Decorative dots (pixel-matched to reference) ────────────────────────────
  // Each entry: [cx, cy, radius, alpha]
  // Upper cluster (top half, scattered)
  const DOTS = [
    [262, 28,  15, 0.45],   // large upper-left
    [363, 52,   9, 0.30],   // small upper-left-mid
    [540, 20,  11, 0.40],   // medium upper-center
    [665, 38,   7, 0.25],   // small upper-right
    // Large faint dot right-center area
    [458, 122, 26, 0.12],
    // Bottom cluster
    [238, 200, 13, 0.35],
    [308, 215,  6, 0.22],
    [552, 208, 10, 0.30],
    [730, 213,  6, 0.20],
    [876, 218, 15, 0.28],
    [958, 200, 20, 0.12],
  ];
  for (const [cx, cy, r, a] of DOTS) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle   = ORANGE;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Avatar ──────────────────────────────────────────────────────────────────
  // Reference: avatar circle centered ~(118, 130), radius ~78
  const AV_R  = 78;
  const AV_CX = 118;
  const AV_CY = 130;

  // White border ring (clean edge against coloured background)
  ctx.save();
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(AV_CX, AV_CY, AV_R + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
  await drawCircleAvatar(ctx, avatarUrl, AV_CX, AV_CY, AV_R, user.username, ORANGE);

  // Green online status dot
  const DOT_X = AV_CX + Math.round(AV_R * 0.70);
  const DOT_Y = AV_CY + Math.round(AV_R * 0.70);
  ctx.save();
  ctx.fillStyle = WHITE;
  ctx.beginPath(); ctx.arc(DOT_X, DOT_Y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3BA55D';
  ctx.beginPath(); ctx.arc(DOT_X, DOT_Y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── Top-right: LVL [level] RANK [rank] ─────────────────────────────────────
  // Reference baseline y ≈ 78, right edge x = 972
  const RIGHT_X = 972;
  const TOP_Y   = 78;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign    = 'right';

  // "rank" number — large orange
  ctx.fillStyle = ORANGE;
  ctx.font      = `bold 62px 'DejaVuBold'`;
  const rankStr = `${rank}`;
  ctx.fillText(rankStr, RIGHT_X, TOP_Y);
  const rNW = ctx.measureText(rankStr).width;

  // " RANK " label — smaller gray (leading space = gap from number)
  ctx.fillStyle = GRAY;
  ctx.font      = `bold 28px 'DejaVuBold'`;
  const rankLbl = ' RANK ';
  ctx.fillText(rankLbl, RIGHT_X - rNW, TOP_Y);
  const rLW = ctx.measureText(rankLbl).width;

  // "level" number — large orange
  ctx.fillStyle = ORANGE;
  ctx.font      = `bold 62px 'DejaVuBold'`;
  const lvlStr  = `${level}`;
  ctx.fillText(lvlStr, RIGHT_X - rNW - rLW, TOP_Y);
  const lNW = ctx.measureText(lvlStr).width;

  // "LVL " label — smaller gray (trailing space = gap to number)
  ctx.fillStyle = GRAY;
  ctx.font      = `bold 28px 'DejaVuBold'`;
  ctx.fillText('LVL ', RIGHT_X - rNW - rLW - lNW, TOP_Y);

  // ── Middle row: username  ·  xp / 100 xp ───────────────────────────────────
  // Reference baseline y ≈ 148; content starts just right of avatar
  const TEXT_X = AV_CX + AV_R + 24;   // ≈ 220
  const MID_Y  = 148;

  // Username — orange bold, left-aligned
  ctx.fillStyle = ORANGE;
  ctx.font      = `bold 32px 'DejaVuBold'`;
  ctx.textAlign = 'left';
  ctx.fillText(truncateText(ctx, user.username, 370), TEXT_X, MID_Y);

  // XP display — right-aligned: [xp] in orange bold, "/100 xp" in gray
  const suffix  = `/100 xp`;
  ctx.fillStyle = GRAY;
  ctx.font      = `24px 'DejaVu'`;
  ctx.textAlign = 'right';
  ctx.fillText(suffix, RIGHT_X, MID_Y);
  const sfxW = ctx.measureText(suffix).width;

  ctx.fillStyle = ORANGE;
  ctx.font      = `bold 24px 'DejaVuBold'`;
  ctx.fillText(`${xp}`, RIGHT_X - sfxW, MID_Y);

  // ── Progress bar ────────────────────────────────────────────────────────────
  // Reference: bar from x≈220 to x≈972, y≈164 h≈30
  const BAR_X  = TEXT_X;
  const BAR_Y  = MID_Y + 16;
  const BAR_W  = RIGHT_X - TEXT_X;
  const BAR_H  = 30;
  const prog   = Math.min(Math.max(xp / 100, 0), 1);

  // Track
  ctx.fillStyle = ORANGE_LIGHT;
  roundRect(ctx, BAR_X, BAR_Y, BAR_W, BAR_H, BAR_H / 2);
  ctx.fill();

  // Fill — min width = BAR_H so the end-cap is always visible at xp > 0
  if (prog > 0) {
    ctx.fillStyle = ORANGE;
    roundRect(ctx, BAR_X, BAR_Y, Math.max(BAR_W * prog, BAR_H), BAR_H, BAR_H / 2);
    ctx.fill();
  }

  return canvas.encode('png');
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD CARD  —  800 × dynamic  (redesigned)
// ─────────────────────────────────────────────────────────────────────────────
const MEDAL   = ['#F59E0B', '#94A3B8', '#CD7F32'];   // gold / silver / bronze
const MEDAL_A = ['rgba(245,158,11,', 'rgba(148,163,184,', 'rgba(205,127,50,'];

export async function generateLeaderboardCard({ guildName, guildIconUrl, entries }) {
  const W        = 800;
  const HEADER_H = 155;
  const ROW_H    = 74;
  const FOOTER_H = 6;
  const H        = HEADER_H + entries.length * ROW_H + FOOTER_H;

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // ── Background ──────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#080C14');
  bg.addColorStop(1, '#0C1020');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Radial gold glow top-right
  const g1 = ctx.createRadialGradient(W, 0, 0, W, 0, 360);
  g1.addColorStop(0, 'rgba(245,158,11,0.12)');
  g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

  // Radial blurple glow bottom-left
  const g2 = ctx.createRadialGradient(0, H, 0, 0, H, 340);
  g2.addColorStop(0, 'rgba(88,101,242,0.12)');
  g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

  // ── Header ──────────────────────────────────────────────────────────────────
  // Header background strip
  const hBg = ctx.createLinearGradient(0, 0, W, HEADER_H);
  hBg.addColorStop(0, '#0F1628');
  hBg.addColorStop(1, '#080C14');
  ctx.fillStyle = hBg;
  ctx.fillRect(0, 0, W, HEADER_H);

  // Top accent stripe (gradient)
  const topStripe = ctx.createLinearGradient(0, 0, W, 0);
  topStripe.addColorStop(0, '#F59E0B');
  topStripe.addColorStop(0.5, '#5865F2');
  topStripe.addColorStop(1, '#F59E0B');
  ctx.fillStyle = topStripe;
  ctx.fillRect(0, 0, W, 5);

  // Guild icon circle
  const GI_R = 30, GI_X = 52, GI_Y = HEADER_H / 2;
  // ring
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath(); ctx.arc(GI_X, GI_Y, GI_R + 3, 0, Math.PI * 2); ctx.fill();
  if (guildIconUrl) {
    try {
      const buf = await fetch(guildIconUrl).then(r => r.arrayBuffer());
      const img = await loadImage(Buffer.from(buf));
      ctx.save();
      ctx.beginPath(); ctx.arc(GI_X, GI_Y, GI_R, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, GI_X - GI_R, GI_Y - GI_R, GI_R * 2, GI_R * 2);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#1A2744';
      ctx.beginPath(); ctx.arc(GI_X, GI_Y, GI_R, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Trophy + "LEADERBOARD" right of icon
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle    = '#F59E0B';
  ctx.font         = `bold 36px 'DejaVuBold'`;
  ctx.fillText('LEADERBOARD', GI_X + GI_R + 18, HEADER_H / 2 + 6);

  // Guild name + entry count subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.font      = `16px 'DejaVu'`;
  ctx.fillText(
    `${truncateText(ctx, guildName, W - GI_X - GI_R - 130)}  ·  Top ${entries.length}`,
    GI_X + GI_R + 18, HEADER_H / 2 + 30
  );

  // Column header labels
  const COL = { rank: 38, av: 92, name: 140, bar: 470, xp: W - 22 };
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.font      = `bold 11px 'DejaVuBold'`;
  ctx.textAlign = 'center';
  ctx.fillText('RANK', COL.rank, HEADER_H - 16);
  ctx.textAlign = 'left';
  ctx.fillText('PLAYER', COL.name, HEADER_H - 16);
  ctx.fillText('PROGRESS', COL.bar, HEADER_H - 16);
  ctx.textAlign = 'right';
  ctx.fillText('TOTAL XP', COL.xp, HEADER_H - 16);

  // Header bottom divider
  const hdiv = ctx.createLinearGradient(0, 0, W, 0);
  hdiv.addColorStop(0, 'rgba(245,158,11,0.6)');
  hdiv.addColorStop(0.5, 'rgba(88,101,242,0.6)');
  hdiv.addColorStop(1, 'rgba(245,158,11,0.6)');
  ctx.fillStyle = hdiv;
  ctx.fillRect(0, HEADER_H - 2, W, 2);

  // ── Rows ────────────────────────────────────────────────────────────────────
  for (let i = 0; i < entries.length; i++) {
    const e    = entries[i];
    const rowY = HEADER_H + i * ROW_H;
    const rowCY = rowY + ROW_H / 2;
    const isTop = i < 3;
    const mc    = isTop ? MEDAL[i]    : null;
    const ma    = isTop ? MEDAL_A[i]  : null;

    // Row background
    if (isTop) {
      const rowBg = ctx.createLinearGradient(0, rowY, W, rowY + ROW_H);
      rowBg.addColorStop(0, `${ma}0.10)`);
      rowBg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rowBg;
      ctx.fillRect(0, rowY, W, ROW_H);

      // Left medal accent bar
      ctx.fillStyle = mc;
      ctx.fillRect(0, rowY, 4, ROW_H);
    } else {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent';
      ctx.fillRect(0, rowY, W, ROW_H);
    }

    // ── Rank badge ────────────────────────────────────────────────────────────
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    if (isTop) {
      // Filled circle badge
      ctx.fillStyle = mc;
      ctx.beginPath(); ctx.arc(COL.rank, rowCY, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#080C14';
      ctx.font      = `bold 16px 'DejaVuBold'`;
      ctx.fillText(`${i + 1}`, COL.rank, rowCY + 1);
    } else {
      // Outlined circle badge
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.20)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath(); ctx.arc(COL.rank, rowCY, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font      = `bold 15px 'DejaVuBold'`;
      ctx.fillText(`${i + 1}`, COL.rank, rowCY + 1);
    }

    // ── Avatar ────────────────────────────────────────────────────────────────
    const AV_R = 27;
    // Ring colour
    ctx.fillStyle = isTop ? mc : ACCENT_1;
    ctx.beginPath(); ctx.arc(COL.av, rowCY, AV_R + 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#080C14';
    ctx.beginPath(); ctx.arc(COL.av, rowCY, AV_R + 1, 0, Math.PI * 2); ctx.fill();
    await drawCircleAvatar(ctx, e.avatarUrl, COL.av, rowCY, AV_R, e.username, isTop ? mc : ACCENT_1);

    // ── Username + level badge ────────────────────────────────────────────────
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = isTop ? mc : TEXT_1;
    ctx.font         = `bold ${isTop ? 19 : 17}px 'DejaVuBold'`;

    // Max width for username: from COL.name to start of bar minus gap
    const nameMaxW = COL.bar - COL.name - 90;
    ctx.fillText(truncateText(ctx, e.username, nameMaxW), COL.name, rowCY - 8);

    // Level badge pill
    const LW = 66, LH = 20, LX = COL.name, LY = rowCY + 4;
    ctx.fillStyle   = isTop ? `${ma}0.25)` : 'rgba(88,101,242,0.25)';
    roundRect(ctx, LX, LY, LW, LH, LH / 2); ctx.fill();
    ctx.fillStyle   = isTop ? mc : ACCENT_1;
    ctx.font        = `bold 11px 'DejaVuBold'`;
    ctx.textAlign   = 'center';
    ctx.fillText(`LVL ${e.level}`, LX + LW / 2, LY + LH / 2 + 1);

    // ── XP progress bar ───────────────────────────────────────────────────────
    const BAR_X = COL.bar, BAR_W = 190, BAR_H = 8, BAR_Y = rowCY - BAR_H / 2;
    const prog   = Math.min(e.xp / 100, 1);

    // Track
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    roundRect(ctx, BAR_X, BAR_Y, BAR_W, BAR_H, BAR_H / 2); ctx.fill();

    // Fill
    if (prog > 0) {
      const barFill = ctx.createLinearGradient(BAR_X, 0, BAR_X + BAR_W, 0);
      if (isTop) {
        barFill.addColorStop(0, mc);
        barFill.addColorStop(1, `${mc}88`);
      } else {
        barFill.addColorStop(0, ACCENT_1);
        barFill.addColorStop(1, ACCENT_2);
      }
      ctx.fillStyle = barFill;
      roundRect(ctx, BAR_X, BAR_Y, Math.max(BAR_W * prog, BAR_H), BAR_H, BAR_H / 2);
      ctx.fill();
    }

    // XP label below bar
    ctx.fillStyle    = 'rgba(255,255,255,0.35)';
    ctx.font         = `10px 'DejaVu'`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${e.xp}/100 xp`, BAR_X, BAR_Y + BAR_H + 13);

    // ── Total XP ──────────────────────────────────────────────────────────────
    ctx.fillStyle    = isTop ? mc : 'rgba(255,255,255,0.75)';
    ctx.font         = `bold 16px 'DejaVuBold'`;
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${e.totalXp.toLocaleString()} XP`, COL.xp, rowCY);

    // Row separator
    if (i < entries.length - 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(20, rowY + ROW_H - 1, W - 40, 1);
    }
  }

  // ── Footer accent ────────────────────────────────────────────────────────────
  const footGrad = ctx.createLinearGradient(0, 0, W, 0);
  footGrad.addColorStop(0, '#F59E0B');
  footGrad.addColorStop(0.5, '#5865F2');
  footGrad.addColorStop(1, '#F59E0B');
  ctx.fillStyle = footGrad;
  ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H);

  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
  return canvas.encode('png');
}
