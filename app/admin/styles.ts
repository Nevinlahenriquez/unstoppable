// The dashboard's look: the event's black and gold, built for a phone first.
export const ADMIN_CSS = `
.ad{min-height:100vh;background:#000;color:#fff;font-family:var(--vv-body),system-ui,sans-serif;padding:0 0 60px}
.ad-center{display:flex;align-items:center;justify-content:center;padding:32px 16px}
.ad *{box-sizing:border-box}
.ad h1,.ad h2{font-family:var(--vv-display),Impact,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:.01em;margin:0}
.ad-kicker{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#E3AE45;margin:0 0 10px}
.ad-muted{color:#B5AD9F;line-height:1.6}
.ad-small{font-size:13px;color:#8E8576;margin:14px 0 0}
.ad-warn{color:#F2B8A0;font-size:14.5px;line-height:1.5;margin:10px 0}
.ad-login{width:100%;max-width:420px;background:#0D0C0A;border:1px solid rgba(227,174,69,.35);border-radius:6px;padding:34px 26px}
.ad-login h1{font-size:34px;margin-bottom:18px}
.ad-login label{display:block;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8E8576;margin:0 0 8px}
.ad input,.ad textarea{width:100%;font-size:16px;color:#fff;caret-color:#E3AE45;background:#1A1814;border:1px solid rgba(227,174,69,.3);border-radius:4px;padding:13px 14px;font-family:inherit}
.ad input:focus{outline:none;border-color:#E3AE45}
.ad-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;margin-top:14px;padding:0 20px;background:#E3AE45;color:#000;font-weight:800;font-size:14.5px;border:0;border-radius:3px;cursor:pointer;text-decoration:none;font-family:inherit}
.ad-login .ad-btn{width:100%}
.ad-btn:disabled{opacity:.6;cursor:default}
.ad-btn.ghost{background:transparent;color:#E3AE45;border:1px solid rgba(227,174,69,.45)}
.ad-btn.sm{min-height:38px;padding:0 14px;font-size:13px;margin-top:0}
.ad-top{position:sticky;top:0;z-index:5;background:rgba(0,0,0,.92);backdrop-filter:blur(8px);border-bottom:1px solid rgba(227,174,69,.2)}
.ad-top-in{max-width:1100px;margin:0 auto;padding:16px 16px 0}
.ad-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
.ad-head h1{font-size:clamp(24px,5vw,32px)}
.ad-me{font-size:12.5px;color:#8E8576;text-align:right}
.ad-me button{background:none;border:0;color:#E3AE45;font:inherit;font-weight:700;cursor:pointer;padding:4px 0}
.ad-tabs{display:flex;gap:4px;margin-top:14px;overflow-x:auto}
.ad-tab{background:none;border:0;border-bottom:2px solid transparent;color:#8E8576;font:inherit;font-weight:700;font-size:14px;padding:10px 14px;cursor:pointer;white-space:nowrap}
.ad-tab[aria-selected=true]{color:#E3AE45;border-color:#E3AE45}
.ad-body{max-width:1100px;margin:0 auto;padding:22px 16px}
.ad-banner{border:1px solid rgba(227,174,69,.35);background:rgba(227,174,69,.08);border-radius:4px;padding:12px 14px;font-size:14.5px;line-height:1.5;margin:0 0 18px;color:#E9DFC9}
.ad-banner.bad{border-color:rgba(242,184,160,.4);background:rgba(242,184,160,.07);color:#F2B8A0}
.ad-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:0 0 22px}
@media(min-width:760px){.ad-stats{grid-template-columns:repeat(5,1fr)}}
.ad-stat{background:#0D0C0A;border:1px solid rgba(255,255,255,.08);border-radius:4px;padding:14px}
.ad-stat b{display:block;font-family:var(--vv-display),Impact,sans-serif;font-weight:400;font-size:30px;color:#fff;line-height:1.1}
.ad-stat span{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8E8576}
.ad-bar{height:6px;background:#1A1814;border-radius:3px;overflow:hidden;margin-top:10px}
.ad-bar i{display:block;height:100%;background:#E3AE45}
.ad-grid2{display:grid;gap:16px}
@media(min-width:860px){.ad-grid2{grid-template-columns:1fr 1fr}}
.ad-card{background:#0D0C0A;border:1px solid rgba(255,255,255,.08);border-radius:4px;padding:18px}
.ad-card h2{font-size:19px;margin:0 0 12px;color:#fff}
.ad-list{list-style:none;margin:0;padding:0}
.ad-list li{padding:10px 0;border-top:1px solid rgba(255,255,255,.06);font-size:14.5px;line-height:1.5;color:#D9D2C5}
.ad-list li:first-child{border-top:0}
.ad-list small{display:block;color:#8E8576;font-size:12.5px}
.ad-empty{color:#8E8576;font-size:14.5px;line-height:1.6}
.ad-tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 14px}
.ad-tools input{flex:1;min-width:200px}
.ad-g{background:#0D0C0A;border:1px solid rgba(255,255,255,.08);border-radius:4px;margin:0 0 10px}
.ad-g summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:1fr auto;gap:6px 12px;padding:14px;align-items:center}
.ad-g summary::-webkit-details-marker{display:none}
.ad-g-name{font-weight:700;font-size:15.5px;color:#fff}
.ad-g-sub{font-size:13px;color:#8E8576;grid-column:1/2}
.ad-pill{font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:3px;background:#1A1814;color:#B5AD9F;white-space:nowrap}
.ad-pill.ok{background:rgba(124,201,138,.14);color:#9BDCA8}
.ad-g-body{padding:0 14px 16px;display:grid;gap:12px}
.ad-dl{display:grid;gap:10px;margin:0}
@media(min-width:700px){.ad-dl{grid-template-columns:1fr 1fr}}
.ad-dl dt{font-size:11.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8E8576}
.ad-dl dd{margin:3px 0 0;font-size:14.5px;color:#fff;line-height:1.5;word-break:break-word}
.ad-dl a{color:#E3AE45}
.ad-actions{display:flex;flex-wrap:wrap;gap:8px}
.ad-sent{display:flex;flex-wrap:wrap;gap:6px}
.ad-mail{display:grid;gap:12px;margin:0 0 22px}
@media(min-width:860px){.ad-mail{grid-template-columns:1fr 1fr;align-items:start}}
.ad-mail-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.ad-mail-h b{font-size:16px;color:#fff}
.ad-mail p{margin:4px 0 0;font-size:13.5px;color:#8E8576;line-height:1.5}
.ad-mail .subj{color:#D9D2C5}
.ad-frame{width:100%;height:520px;border:1px solid rgba(255,255,255,.1);border-radius:4px;background:#000;margin-top:12px}
.ad-note{font-size:13px;color:#9BDCA8;margin:8px 0 0}
.ad-note.bad{color:#F2B8A0}
.ad-table{width:100%;border-collapse:collapse;font-size:14px}
.ad-table th{text-align:left;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:#8E8576;padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.1)}
.ad-table td{padding:10px 6px;border-bottom:1px solid rgba(255,255,255,.06);color:#D9D2C5;vertical-align:top}
.ad-scroll{overflow-x:auto}
.ad-form{display:grid;gap:12px}
.ad-form label{display:grid;gap:6px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#8E8576}
.ad-form .ad-btn{margin-top:4px}
`
