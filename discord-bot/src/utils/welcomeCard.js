import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));

const W = 1100;
const H = 400;

/**
 * Remove only actual emoji / pictographs so the SVG renderer doesn't show
 * tofu boxes, while keeping ALL regular letters (including Cyrillic, CJK, etc.)
 */
function sanitize(str) {
  return String(str)
    // Strip emoji & pictographs (Extended_Pictographic covers all emoji ranges)
    .replace(/\p{Extended_Pictographic}[\uFE0F\u20E3]?(\u200D\p{Extended_Pictographic}[\uFE0F\u20E3]?)*/gu, '')
    // Strip variation selectors + zero-width / invisible chars
    .replace(/[\uFE00-\uFE0F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '')
    // Collapse leftover spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function generateWelcomeCard(member, guildMemberCount) {
  try {
    // ── layout constants ──────────────────────────────────────────────────────
    const avatarR   = 95;
    const avatarD   = avatarR * 2;
    const glowPad   = 12;
    const glowD     = avatarD + glowPad * 2;
    const borderPad = 5;
    const borderD   = avatarD + borderPad * 2;
    const avatarCX  = 175;
    const avatarCY  = Math.floor(H / 2);

    const panelX = 295;
    const panelY = 55;
    const panelW = 770;
    const panelH = H - 110;
    const textX  = panelX + 30;
    const textCY = H / 2;
    const fonts  = `'Liberation Sans','DejaVu Sans','FreeSans',Arial,sans-serif`;

    // ── 1. Background ─────────────────────────────────────────────────────────
    const bgPath = join(__dirname, '../assets/welcome-bg.webp');
    const bg = await sharp(bgPath)
      .resize(W, H, { fit: 'cover', position: 'centre' })
      .toBuffer();

    // ── 2. Dark gradient overlay ──────────────────────────────────────────────
    const overlayBuf = Buffer.from(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
         <defs>
           <linearGradient id="gr" x1="0" y1="0" x2="1" y2="0">
             <stop offset="0%"   stop-color="#000" stop-opacity="0.82"/>
             <stop offset="42%"  stop-color="#000" stop-opacity="0.55"/>
             <stop offset="100%" stop-color="#000" stop-opacity="0.18"/>
           </linearGradient>
         </defs>
         <rect width="${W}" height="${H}" fill="url(#gr)"/>
       </svg>`
    );

    // ── 3. Frosted panel ──────────────────────────────────────────────────────
    const panelBuf = Buffer.from(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
         <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}"
               rx="16" ry="16" fill="#0c0e16" fill-opacity="0.78"/>
         <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}"
               rx="16" ry="16" fill="none"
               stroke="#5865F2" stroke-opacity="0.50" stroke-width="2"/>
       </svg>`
    );

    // ── 4. Avatar ─────────────────────────────────────────────────────────────
    let avatarCircleBuf;
    try {
      const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
      const res = await fetch(avatarURL);
      if (!res.ok) throw new Error('fetch failed');
      const avatarRaw = Buffer.from(await res.arrayBuffer());
      const mask = Buffer.from(
        `<svg width="${avatarD}" height="${avatarD}">
           <circle cx="${avatarR}" cy="${avatarR}" r="${avatarR}" fill="white"/>
         </svg>`
      );
      avatarCircleBuf = await sharp(avatarRaw)
        .resize(avatarD, avatarD, { fit: 'cover' })
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toBuffer();
    } catch {
      avatarCircleBuf = await sharp(
        Buffer.from(`<svg width="${avatarD}" height="${avatarD}">
           <circle cx="${avatarR}" cy="${avatarR}" r="${avatarR}" fill="#4f545c"/>
         </svg>`)
      ).png().toBuffer();
    }

    // ── 5. Glow ring ──────────────────────────────────────────────────────────
    const glowSVG = Buffer.from(
      `<svg width="${glowD}" height="${glowD}" xmlns="http://www.w3.org/2000/svg">
         <defs>
           <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
             <feGaussianBlur stdDeviation="10"/>
           </filter>
         </defs>
         <circle cx="${glowD/2}" cy="${glowD/2}" r="${glowD/2-6}"
                 fill="none" stroke="#5865F2" stroke-width="16"
                 filter="url(#glow)"/>
       </svg>`
    );

    // ── 6. White border ───────────────────────────────────────────────────────
    const borderSVG = Buffer.from(
      `<svg width="${borderD}" height="${borderD}" xmlns="http://www.w3.org/2000/svg">
         <circle cx="${borderD/2}" cy="${borderD/2}" r="${borderD/2}" fill="white"/>
       </svg>`
    );

    // ── 7. Text ───────────────────────────────────────────────────────────────
    const rawName  = member.user.displayName ?? member.user.username;
    const safeName = sanitize(rawName) || member.user.username;
    const dispName = safeName.length > 18 ? safeName.substring(0, 17) + '…' : safeName;

    const rawGuild  = sanitize(member.guild.name);
    // Fallback to showing nothing rather than blank "to"
    const guildName = rawGuild.length > 0
      ? (rawGuild.length > 28 ? rawGuild.substring(0, 26) + '…' : rawGuild)
      : member.guild.name.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').substring(0, 26);

    const svgText = Buffer.from(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
         <defs>
           <filter id="sh" x="-10%" y="-40%" width="130%" height="200%">
             <feDropShadow dx="0" dy="2" stdDeviation="6"
               flood-color="#000" flood-opacity="1"/>
           </filter>
           <filter id="sh2" x="-10%" y="-40%" width="130%" height="200%">
             <feDropShadow dx="0" dy="1" stdDeviation="3"
               flood-color="#000" flood-opacity="0.95"/>
           </filter>
         </defs>

         <!-- WELCOME badge -->
         <text x="${textX}" y="${textCY - 90}"
               font-family="${fonts}" font-size="17" font-weight="bold"
               fill="#7289ff" letter-spacing="9" filter="url(#sh2)">WELCOME</text>

         <!-- divider line -->
         <line x1="${textX}" y1="${textCY - 72}"
               x2="${textX + 500}" y2="${textCY - 72}"
               stroke="#5865F2" stroke-opacity="0.55" stroke-width="1.5"/>

         <!-- Username — big bold white -->
         <text x="${textX}" y="${textCY - 8}"
               font-family="${fonts}" font-size="66" font-weight="bold"
               fill="#ffffff" filter="url(#sh)">${escapeXml(dispName)}</text>

         <!-- to Server Name -->
         <text x="${textX}" y="${textCY + 50}"
               font-family="${fonts}" font-size="25" font-weight="bold"
               fill="#dde1f0" filter="url(#sh2)">to  ${escapeXml(guildName)}</text>

         <!-- thin rule -->
         <line x1="${textX}" y1="${textCY + 73}"
               x2="${textX + 500}" y2="${textCY + 73}"
               stroke="#ffffff" stroke-opacity="0.12" stroke-width="1"/>

         <!-- Member count -->
         <text x="${textX}" y="${textCY + 106}"
               font-family="${fonts}" font-size="21"
               fill="#b0b8d0" filter="url(#sh2)">Member  #${escapeXml(String(guildMemberCount))}</text>
       </svg>`
    );

    // ── 8. Composite ──────────────────────────────────────────────────────────
    const card = await sharp(bg)
      .composite([
        { input: overlayBuf, left: 0, top: 0 },
        { input: panelBuf,   left: 0, top: 0 },
        { input: glowSVG,    left: avatarCX - Math.floor(glowD   / 2), top: avatarCY - Math.floor(glowD   / 2) },
        { input: borderSVG,  left: avatarCX - Math.floor(borderD / 2), top: avatarCY - Math.floor(borderD / 2) },
        { input: avatarCircleBuf, left: avatarCX - avatarR, top: avatarCY - avatarR },
        { input: svgText,    left: 0, top: 0 },
      ])
      .png({ compressionLevel: 6 })
      .toBuffer();

    return card;
  } catch (err) {
    console.error('Welcome card generation error:', err.message);
    return null;
  }
}
