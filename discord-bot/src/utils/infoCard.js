import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'DejaVu');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'DejaVuBold');

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

async function drawCircleImg(ctx, url, cx, cy, r) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const img = await loadImage(Buffer.from(await res.arrayBuffer()));
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  } catch {
    ctx.save();
    ctx.fillStyle = '#1A2744';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function trunc(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
  return text + '…';
}

function hGrad(ctx, x1, x2, c1, c2) {
  const g = ctx.createLinearGradient(x1, 0, x2, 0);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  return g;
}

function topStripe(ctx, W, c1, c2) {
  ctx.fillStyle = hGrad(ctx, 0, W, c1, c2);
  ctx.fillRect(0, 0, W, 6);
}

function botStripe(ctx, W, H, c1, c2) {
  ctx.fillStyle = hGrad(ctx, 0, W, c1, c2);
  ctx.fillRect(0, H - 6, W, 6);
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER INFO CARD  —  1000 × 530
// ─────────────────────────────────────────────────────────────────────────────
const VERIFY_LABELS = ['None', 'Low', 'Medium', 'High', 'Highest'];
const BOOST_LABELS  = ['No Boost', 'Level 1', 'Level 2', 'Level 3'];

export async function generateServerCard({
  guildName, guildIconUrl, description,
  humanCount, botCount,
  textChannels, voiceChannels, categories,
  roleCount, emojis,
  boosts, boostTier, verificationLevel,
  createdAt, ownerName,
}) {
  const W = 1000, H = 530;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // ── Background ──────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#050D1C');
  bg.addColorStop(1, '#091422');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Glow blobs
  const gc = ctx.createRadialGradient(900, 40, 0, 900, 40, 380);
  gc.addColorStop(0, 'rgba(0,180,216,0.17)'); gc.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gc; ctx.fillRect(0, 0, W, H);

  const gb = ctx.createRadialGradient(100, 500, 0, 100, 500, 280);
  gb.addColorStop(0, 'rgba(88,101,242,0.14)'); gb.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gb; ctx.fillRect(0, 0, W, H);

  // Stripes
  topStripe(ctx, W, '#00B4D8', '#5865F2');
  botStripe(ctx, W, H, '#00B4D8', '#5865F2');

  // ── Icon ────────────────────────────────────────────────────────────────────
  const IR = 62, ICX = W / 2, ICY = 90;

  const halo = ctx.createRadialGradient(ICX, ICY, 0, ICX, ICY, IR + 32);
  halo.addColorStop(0, 'rgba(0,180,216,0.20)'); halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(ICX, ICY, IR + 32, 0, Math.PI * 2); ctx.fill();

  const ring = ctx.createLinearGradient(ICX - IR, ICY - IR, ICX + IR, ICY + IR);
  ring.addColorStop(0, '#00B4D8'); ring.addColorStop(1, '#5865F2');
  ctx.fillStyle = ring;
  ctx.beginPath(); ctx.arc(ICX, ICY, IR + 5, 0, Math.PI * 2); ctx.fill();

  if (guildIconUrl) {
    await drawCircleImg(ctx, guildIconUrl, ICX, ICY, IR);
  } else {
    ctx.fillStyle = '#1A2744';
    ctx.beginPath(); ctx.arc(ICX, ICY, IR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = `bold 48px 'DejaVuBold'`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(guildName[0]?.toUpperCase() ?? 'S', ICX, ICY + 2);
    ctx.textBaseline = 'alphabetic';
  }

  // ── Guild name ──────────────────────────────────────────────────────────────
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF'; ctx.font = `bold 34px 'DejaVuBold'`;
  ctx.fillText(trunc(ctx, guildName, W - 100), ICX, 176);

  // Description (if any)
  let metaY = 200;
  if (description) {
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.font = `15px 'DejaVu'`;
    ctx.fillText(trunc(ctx, description, W - 120), ICX, metaY);
    metaY += 22;
  }

  // Meta line
  const verLabel = VERIFY_LABELS[verificationLevel] ?? 'Unknown';
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.font = `13px 'DejaVu'`;
  ctx.fillText(`Owner: ${ownerName}   ·   Created: ${createdAt}   ·   Verification: ${verLabel}`, ICX, metaY);

  // Divider
  const divY = metaY + 16;
  const divG = ctx.createLinearGradient(60, 0, W - 60, 0);
  divG.addColorStop(0, 'transparent');
  divG.addColorStop(0.2, 'rgba(0,180,216,0.55)');
  divG.addColorStop(0.8, 'rgba(88,101,242,0.55)');
  divG.addColorStop(1, 'transparent');
  ctx.fillStyle = divG; ctx.fillRect(60, divY, W - 120, 1);

  // ── 3×3 Stats grid ──────────────────────────────────────────────────────────
  const BOOST_LABEL = BOOST_LABELS[boostTier] ?? 'None';
  const STATS = [
    { label: 'MEMBERS',    value: humanCount.toLocaleString(),   color: '#00B4D8' },
    { label: 'BOTS',       value: botCount.toLocaleString(),     color: '#57F287' },
    { label: 'ROLES',      value: roleCount.toLocaleString(),    color: '#EB459E' },
    { label: 'TEXT CH.',   value: textChannels.toLocaleString(), color: '#5865F2' },
    { label: 'VOICE CH.',  value: voiceChannels.toLocaleString(),color: '#9B59B6' },
    { label: 'CATEGORIES', value: categories.toLocaleString(),   color: '#3498DB' },
    { label: 'EMOJIS',     value: emojis.toLocaleString(),       color: '#F59E0B' },
    { label: 'BOOSTS',     value: boosts.toString(),             color: '#F07427' },
    { label: 'BOOST TIER', value: BOOST_LABEL,                   color: '#FEE75C' },
  ];

  const COLS = 3, BOX_W = 282, BOX_H = 86;
  const GAP_X = Math.floor((W - COLS * BOX_W) / (COLS + 1));
  const GRID_START_Y = divY + 14;
  const ROW_GAP = BOX_H + 12;

  for (let i = 0; i < STATS.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const bx  = GAP_X + col * (BOX_W + GAP_X);
    const by  = GRID_START_Y + row * ROW_GAP;
    const s   = STATS[i];

    // Glass fill
    ctx.fillStyle = 'rgba(255,255,255,0.052)';
    roundRect(ctx, bx, by, BOX_W, BOX_H, 14); ctx.fill();

    // Glass border
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, BOX_W, BOX_H, 14); ctx.stroke();
    ctx.restore();

    // Colour accent — top edge gradient strip
    const accentG = ctx.createLinearGradient(bx, 0, bx + BOX_W, 0);
    accentG.addColorStop(0, s.color + 'CC');
    accentG.addColorStop(1, s.color + '44');
    ctx.fillStyle = accentG;
    roundRect(ctx, bx, by, BOX_W, 3, 3); ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.40)';
    ctx.font = `bold 10px 'DejaVuBold'`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s.label, bx + 16, by + 24);

    // Value (large)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 28px 'DejaVuBold'`;
    ctx.fillText(trunc(ctx, s.value, BOX_W - 30), bx + 16, by + 64);

    // Colour dot next to label
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(bx + BOX_W - 16, by + 20, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.encode('png');
}

// ─────────────────────────────────────────────────────────────────────────────
// USER INFO CARD  —  1000 × 480
// ─────────────────────────────────────────────────────────────────────────────
export async function generateUserCard({
  username, avatarUrl, displayColor,
  nickname, tag,
  accountCreated, joinedServer,
  roleCount, topRoles,
  level, xp, totalXp, rank,
}) {
  const W = 1000, H = 480;
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  const ACCENT  = displayColor && displayColor !== '#000000' ? displayColor : '#7C3AED';
  const PANEL_W = 310;
  const RX      = PANEL_W + 34;

  // ── Background ──────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0C0416');
  bg.addColorStop(1, '#160828');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // Glow blobs
  const g1 = ctx.createRadialGradient(W - 80, 50, 0, W - 80, 50, 380);
  g1.addColorStop(0, ACCENT + '2A'); g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

  const g2 = ctx.createRadialGradient(80, H - 60, 0, 80, H - 60, 260);
  g2.addColorStop(0, 'rgba(192,38,211,0.13)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

  // Stripes
  topStripe(ctx, W, ACCENT, '#C026D3');
  botStripe(ctx, W, H, ACCENT, '#C026D3');

  // ── Left panel ───────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.fillRect(0, 6, PANEL_W, H - 12);

  // Vertical divider
  const vG = ctx.createLinearGradient(0, 0, 0, H);
  vG.addColorStop(0, 'transparent');
  vG.addColorStop(0.2, ACCENT + '55');
  vG.addColorStop(0.8, '#C026D355');
  vG.addColorStop(1, 'transparent');
  ctx.fillStyle = vG; ctx.fillRect(PANEL_W, 6, 1, H - 12);

  // Avatar
  const AV_R = 72, AV_CX = PANEL_W / 2, AV_CY = 148;

  const avHalo = ctx.createRadialGradient(AV_CX, AV_CY, 0, AV_CX, AV_CY, AV_R + 30);
  avHalo.addColorStop(0, ACCENT + '30'); avHalo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = avHalo;
  ctx.beginPath(); ctx.arc(AV_CX, AV_CY, AV_R + 30, 0, Math.PI * 2); ctx.fill();

  // Double ring
  ctx.fillStyle = '#C026D3';
  ctx.beginPath(); ctx.arc(AV_CX, AV_CY, AV_R + 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ACCENT;
  ctx.beginPath(); ctx.arc(AV_CX, AV_CY, AV_R + 4, 0, Math.PI * 2); ctx.fill();

  await drawCircleImg(ctx, avatarUrl, AV_CX, AV_CY, AV_R);

  // Username + tag
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#FFFFFF'; ctx.font = `bold 18px 'DejaVuBold'`;
  ctx.fillText(trunc(ctx, username, PANEL_W - 20), AV_CX, 246);

  ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.font = `13px 'DejaVu'`;
  ctx.fillText(tag, AV_CX, 264);

  if (nickname && nickname !== username) {
    ctx.fillStyle = ACCENT + 'CC'; ctx.font = `12px 'DejaVu'`;
    ctx.fillText(trunc(ctx, `"${nickname}"`, PANEL_W - 20), AV_CX, 282);
  }

  // Divider
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(24, 292, PANEL_W - 48, 1);

  // ── Level badge in left panel ─────────────────────────────────────────────────
  if (level != null) {
    // Level pill
    const LVL_STR = `${level}`;
    ctx.font = `bold 36px 'DejaVuBold'`;
    const lvlW = ctx.measureText(LVL_STR).width + 50;
    const lvlX = AV_CX - lvlW / 2;
    const lvlY = 305;

    // Pill background
    const pillG = ctx.createLinearGradient(lvlX, 0, lvlX + lvlW, 0);
    pillG.addColorStop(0, ACCENT + 'AA'); pillG.addColorStop(1, '#C026D3AA');
    ctx.fillStyle = pillG;
    roundRect(ctx, lvlX, lvlY, lvlW, 44, 22); ctx.fill();

    // "LVL" micro label
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = `bold 11px 'DejaVuBold'`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('LEVEL', AV_CX - lvlW / 2 + 10, lvlY + 16);

    // Number
    ctx.fillStyle = '#FFFFFF'; ctx.font = `bold 26px 'DejaVuBold'`;
    ctx.textAlign = 'right';
    ctx.fillText(LVL_STR, lvlX + lvlW - 12, lvlY + 34);

    ctx.textAlign = 'center';

    // XP bar
    const XP_VAL = xp ?? 0;
    const XP_PCT = Math.min(XP_VAL / 100, 1);
    const barX = 24, barY = 358, barW = PANEL_W - 48, barH = 8;

    ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.font = `10px 'DejaVu'`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${XP_VAL} / 100 XP  to next level`, AV_CX, barY - 6);

    // Track
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    roundRect(ctx, barX, barY, barW, barH, barH / 2); ctx.fill();

    // Fill
    if (XP_PCT > 0) {
      const barFill = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      barFill.addColorStop(0, ACCENT); barFill.addColorStop(1, '#C026D3');
      ctx.fillStyle = barFill;
      roundRect(ctx, barX, barY, Math.max(barW * XP_PCT, barH), barH, barH / 2);
      ctx.fill();
    }

    // Total XP sub label
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = `10px 'DejaVu'`;
    ctx.fillText(`${(totalXp ?? 0).toLocaleString()} total XP`, AV_CX, barY + barH + 14);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = `14px 'DejaVu'`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('No XP data yet', AV_CX, 340);
  }

  // ── Right panel ──────────────────────────────────────────────────────────────
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

  // Section label
  ctx.fillStyle = ACCENT + 'BB'; ctx.font = `bold 10px 'DejaVuBold'`;
  ctx.fillText('USER PROFILE', RX, 36);

  // Username large
  ctx.fillStyle = '#FFFFFF'; ctx.font = `bold 40px 'DejaVuBold'`;
  ctx.fillText(trunc(ctx, username, W - RX - 30), RX, 88);

  // Nickname
  let dividerY = 105;
  if (nickname && nickname !== username) {
    ctx.fillStyle = 'rgba(255,255,255,0.50)'; ctx.font = `17px 'DejaVu'`;
    ctx.fillText(trunc(ctx, `aka  ${nickname}`, W - RX - 30), RX, 112);
    dividerY = 128;
  }

  // Horizontal divider
  const hdivG = ctx.createLinearGradient(RX, 0, W - 30, 0);
  hdivG.addColorStop(0, ACCENT + '99'); hdivG.addColorStop(1, 'transparent');
  ctx.fillStyle = hdivG; ctx.fillRect(RX, dividerY, W - RX - 30, 1);

  // ── 2×2 Stat boxes ───────────────────────────────────────────────────────────
  const sBOX_W = (W - RX - 30) / 2 - 8;
  const sBOX_H = 76;
  const sSTART_Y = dividerY + 14;

  const RIGHT_STATS = [
    { label: 'SERVER RANK',     value: rank != null ? `#${rank}` : '—',         color: '#F59E0B' },
    { label: 'TOTAL XP',        value: totalXp != null ? `${totalXp.toLocaleString()} XP` : '—', color: ACCENT },
    { label: 'JOINED SERVER',   value: joinedServer,                              color: '#57F287' },
    { label: 'ACCOUNT CREATED', value: accountCreated,                            color: '#00B4D8' },
  ];

  for (let i = 0; i < RIGHT_STATS.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx  = RX + col * (sBOX_W + 16);
    const by  = sSTART_Y + row * (sBOX_H + 10);
    const s   = RIGHT_STATS[i];

    // Glass box
    ctx.fillStyle = 'rgba(255,255,255,0.048)';
    roundRect(ctx, bx, by, sBOX_W, sBOX_H, 12); ctx.fill();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
    roundRect(ctx, bx, by, sBOX_W, sBOX_H, 12); ctx.stroke();
    ctx.restore();

    // Bottom accent bar
    ctx.fillStyle = s.color;
    ctx.save(); ctx.globalAlpha = 0.8;
    roundRect(ctx, bx, by + sBOX_H - 3, sBOX_W, 3, 3); ctx.fill();
    ctx.restore();

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.font = `bold 9px 'DejaVuBold'`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s.label, bx + 14, by + 20);

    // Value
    ctx.fillStyle = '#FFFFFF'; ctx.font = `bold 22px 'DejaVuBold'`;
    ctx.fillText(trunc(ctx, s.value, sBOX_W - 22), bx + 14, by + 56);
  }

  // ── Role chips ───────────────────────────────────────────────────────────────
  const CHIP_SEC_Y = sSTART_Y + 2 * (sBOX_H + 10) + 14;
  ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.font = `bold 9px 'DejaVuBold'`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(`TOP ROLES  (${roleCount} total)`, RX, CHIP_SEC_Y);

  let chipX = RX;
  const CHIP_H = 28, CHIP_PAD = 14, CHIP_GAP = 6;
  const chipY  = CHIP_SEC_Y + 10;

  for (const role of topRoles.slice(0, 7)) {
    ctx.font = `bold 12px 'DejaVuBold'`;
    const cW = ctx.measureText(role.name).width + CHIP_PAD * 2;
    if (chipX + cW > W - 24) break;

    const rc = role.color || ACCENT;

    ctx.fillStyle = rc + '2E';
    roundRect(ctx, chipX, chipY, cW, CHIP_H, CHIP_H / 2); ctx.fill();

    ctx.save();
    ctx.strokeStyle = rc + '77'; ctx.lineWidth = 1;
    roundRect(ctx, chipX, chipY, cW, CHIP_H, CHIP_H / 2); ctx.stroke();
    ctx.restore();

    // Colour dot
    ctx.fillStyle = rc;
    ctx.beginPath(); ctx.arc(chipX + 10, chipY + CHIP_H / 2, 4, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#FFFFFF'; ctx.textBaseline = 'middle';
    ctx.fillText(role.name, chipX + CHIP_PAD + 4, chipY + CHIP_H / 2);
    ctx.textBaseline = 'alphabetic';

    chipX += cW + CHIP_GAP;
  }

  return canvas.encode('png');
}
