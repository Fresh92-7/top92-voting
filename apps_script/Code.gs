// Fresh 92.7 — Top 92 voting backend (Google Apps Script)
// Saves share cards to Drive and emails attachment to the voter.

const DRIVE_FOLDER_ID = '1coKkpTvEfI6gW-Zw14R2F5A9YR1WjRl9'; // your private folder
const FROM_NAME = 'Fresh 92.7';
const FROM_EMAIL = 'admin@fresh927.com.au'; // Must be an alias on the executing account, or change to the executing account email

function doPost(e) {
  try {
    const p = e.parameter || {};
    const action = (p.action || 'submit').toLowerCase();
    if (action === 'spotify') {
      // Not used in current flow (kept for backward compatibility)
      return json({ ok: false, note: 'spotify lookup disabled' });
    }

    // Submit handler: name, mobile, email, picks_json, imageDataUrl, ua
    const name = String(p.name || '').trim();
    const mobile = String(p.mobile || '').trim();
    const email = String(p.email || '').trim();
    const picks = parseJsonSafe(p.picks_json) || [];
    const ua = String(p.ua || '');
    const when = new Date();

    // Save image into Drive folder (kept private by default)
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const pngBlob = dataUrlToBlob(p.imageDataUrl, 'image/png');
    const filename = Utilities.formatDate(when, Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") +
      ' - ' + sanitizeFilename(name || 'anonymous') + ' - Top92.png';
    const imgFile = folder.createFile(pngBlob).setName(filename);

    // Save metadata (JSON) alongside the image
    const meta = {
      name, mobile, email, picks, ua,
      imageFileId: imgFile.getId(),
      timestamp: when.toISOString(),
    };
    const metaBlob = Utilities.newBlob(JSON.stringify(meta, null, 2), 'application/json', filename.replace(/\.png$/, '.json'));
    folder.createFile(metaBlob);

    // Email voter with the image attached
    const subject = `${name || 'Your'}'s 2025 Top 92 Votes`;
    const plain = buildPlainText(name, picks);
    const html = buildHtmlBody(name, picks);

    // Use GmailApp. The 'from' param requires a configured alias for the executing account.
    sendEmailWithFallback(email, subject, plain, html, imgFile);

    return json({ ok: true, fileId: imgFile.getId() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Simple GET ping for sanity checks from the browser
function doGet(e){
  const p = e && e.parameter || {};
  if ((p.action||'').toLowerCase() === 'ping') {
    return json({ ok:true, message:'Web App is live', time:(new Date()).toISOString() });
  }
  return json({ ok:true, message:'Fresh 92.7 Top 92 Web App', time:(new Date()).toISOString() });
}

function sendEmailWithFallback(to, subject, plain, html, imgFile){
  const optsBase = {
    name: FROM_NAME,
    htmlBody: html,
    attachments: [imgFile.getAs(MimeType.PNG)],
    replyTo: FROM_EMAIL,
  };
  try{
    // Attempt to use the configured FROM address first (requires Send As alias)
    GmailApp.sendEmail(to, subject, plain, Object.assign({}, optsBase, { from: FROM_EMAIL }));
  } catch (e) {
    // Fallback: send from the executing account without the 'from' parameter
    GmailApp.sendEmail(to, subject, plain, optsBase);
  }
}

// Optional: run inside the Script Editor to validate Drive + Gmail scopes
function selfTest(){
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const blob = Utilities.newBlob('Top92 test file — ' + (new Date()).toISOString(),'text/plain','test.txt');
  const f = folder.createFile(blob);
  GmailApp.sendEmail(Session.getActiveUser().getEmail(), 'Top92 Self-Test', 'This is a self-test email with a test file attached.', {
    attachments:[f.getAs(MimeType.PLAIN_TEXT)]
  });
}

function dataUrlToBlob(dataUrl, mimeDefault) {
  if (!dataUrl) throw new Error('Missing imageDataUrl');
  const parts = String(dataUrl).split(',');
  const base64 = parts[1] || '';
  const meta = parts[0] || '';
  const mime = (meta.match(/^data:([^;]+)/) || [null, mimeDefault])[1];
  const bytes = Utilities.base64Decode(base64);
  return Utilities.newBlob(bytes, mime || mimeDefault, 'share.png');
}

function buildPlainText(name, picks) {
  const intro = `Hi ${name || ''},\n\nThank you for taking the time to vote in Fresh 92.7's Top 92 of 2025! Attached are your votes - feel free to share on your socials and be sure to tag @Fresh927!\n\nBe sure to follow our socials to stay up to date with all the details about our Top92 Party, happening at the Pier Glenelg on Saturday January 17, 2026.\n\nThanks,\nFresh 92.7\n\nYour Top 10:`;
  const list = picks.map((p, i) => `\n${i + 1}. ${p}`).join('');
  return intro + list;
}

function buildHtmlBody(name, picks) {
  const items = picks.map((p, i) => `<li><strong>${i + 1}.</strong> ${safe(p)}</li>`).join('');
  return `
  <div style="font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5; color:#0b0b12">
    <p>Hi ${safe(name)},</p>
    <p>Thank you for taking the time to vote in Fresh 92.7's Top 92 of 2025! Attached are your votes — feel free to share on your socials and be sure to tag <strong>@Fresh927</strong>!</p>
    <p>Be sure to follow our socials to stay up to date with all the details about our <strong>Top92 Party</strong>, happening at the <strong>Pier Glenelg</strong> on <strong>Saturday January 17, 2026</strong>.</p>
    <p>Thanks,<br/>Fresh 92.7</p>
    <p><strong>Your Top 10:</strong></p>
    <ol>${items}</ol>
  </div>`;
}

function sanitizeFilename(s) {
  return String(s).replace(/[\\/:*?"<>|]+/g, '_').trim();
}

function parseJsonSafe(str) {
  try { return JSON.parse(str); } catch(e){ return null; }
}

function safe(s) { return String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
