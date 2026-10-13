/* Zolla MG website: booking, blog, assistant and admin, backed by Firebase (Firestore + Google sign-in). */
const ADMIN_EMAIL = 'zollamg90@gmail.com';
const FIREBASE = {
  apiKey: 'AIzaSyCeEjBIg-pfh7DAZy94PlyjBc01khxF98I',
  authDomain: 'zollamg.firebaseapp.com',
  projectId: 'zollamg',
  storageBucket: 'zollamg.firebasestorage.app',
  messagingSenderId: '355791457580',
  appId: '1:355791457580:web:ad934851f6beba6506b089',
};
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const WA_NUM = '251993447793', TG = 'https://t.me/zollamg';
const LOCAL = new URLSearchParams(location.search).has('local'); // test mode only: data stays in this browser

/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3000); }
const waLink = (text, num = WA_NUM) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
const sha = async (t) => { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join(''); };
const newRef = () => 'ZMG-' + Array.from(crypto.getRandomValues(new Uint8Array(6)), (x) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join('');
function normPhone(p) {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0') && d.length === 10) d = '251' + d.slice(1);
  if (d.length === 9 && /^[79]/.test(d)) d = '251' + d;
  return d;
}
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

/* ================= calendars (Julian Day Number method) ================= */
const EP = 1723856, fdiv = (a, b) => Math.floor(a / b), mod = (a, b) => ((a % b) + b) % b;
const EM = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'];
const EMA = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'];
const GM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const GMA = ['ጃንዩወሪ', 'ፌብሩወሪ', 'ማርች', 'ኤፕሪል', 'ሜይ', 'ጁን', 'ጁላይ', 'ኦገስት', 'ሴፕቴምበር', 'ኦክቶበር', 'ኖቬምበር', 'ዲሴምበር'];
const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WDA = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];
const g2j = (y, m, d) => { const a = fdiv(14 - m, 12), Y = y + 4800 - a, M = m + 12 * a - 3; return d + fdiv(153 * M + 2, 5) + 365 * Y + fdiv(Y, 4) - fdiv(Y, 100) + fdiv(Y, 400) - 32045; };
const j2g = (j) => { const a = j + 32044, b = fdiv(4 * a + 3, 146097), c = a - fdiv(146097 * b, 4), d = fdiv(4 * c + 3, 1461), e = c - fdiv(1461 * d, 4), m = fdiv(5 * e + 2, 153); return { y: 100 * b + d - 4800 + fdiv(m, 10), m: m + 3 - 12 * fdiv(m, 10), d: e - fdiv(153 * m + 2, 5) + 1 }; };
const e2j = (y, m, d) => EP + 365 + 365 * (y - 1) + fdiv(y, 4) + 30 * m + d - 31;
const j2e = (j) => { const r = mod(j - EP, 1461), n = mod(r, 365) + 365 * fdiv(r, 1460); return { y: 4 * fdiv(j - EP, 1461) + fdiv(r, 365) - fdiv(r, 1460), m: fdiv(n, 30) + 1, d: mod(n, 30) + 1 }; };
const eDays = (y, m) => (m < 13 ? 30 : mod(y, 4) === 3 ? 6 : 5);
const gDays = (y, m) => [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
const pad = (n) => String(n).padStart(2, '0');
const iso = (j) => { const g = j2g(j); return `${g.y}-${pad(g.m)}-${pad(g.d)}`; };
const jdn = (s) => { const [y, m, d] = s.split('-').map(Number); return g2j(y, m, d); };
const wday = (s) => mod(jdn(s) + 1, 7);
const OFF = 180, TZ = 'Africa/Addis_Ababa';
const today = () => new Date(Date.now() + OFF * 60000).toISOString().slice(0, 10);
const toUtc = (day, min) => { const [y, m, d] = day.split('-').map(Number); return Date.UTC(y, m - 1, d, 0, min) - OFF * 60000; };
const dayOf = (ms) => iso(fdiv(ms + OFF * 60000, 86400000) + 2440588);
const BLOCK = 900000; // 15 minutes

/* ================= language ================= */
const T = {
  en: {
    n_home: 'Home', n_topics: 'Topics', n_blog: 'Blog', n_about: 'About', n_contact: 'Contact', mybk: 'My bookings', book: 'Book',
    h1: 'Ideas into', words: ['action.', 'income.', 'brands.', 'growth.', 'impact.'],
    intro: 'I help people and businesses turn digital skills into real results.', cta: 'Book a session',
    need: 'What do you need?', needsub: 'Pick one. Book in a minute.',
    blog: 'Blog', blogsub: 'Short, practical notes on AI, branding and digital business.', blogsoon: 'First posts are on the way.', blogfollow: 'Follow on Telegram to read them first.', blogbtn: 'Follow on Telegram',
    hi: 'Hi, I’m Zolla.', hitext: 'Founder & CEO of Lilo Digital Academy. I help young people learn practical digital skills that lead to real jobs and businesses.',
    journey: 'My journey', y1: '2023 – now', y2: 'Fellowship', y3: 'Earlier', j1: 'Founder & CEO, Lilo Digital Academy', j2: 'Mastercard Foundation EdTech Fellowship', j3: 'Media & education: Finote Birhan, Alaje Media, Dreams Academy', j4: 'BSc Mechanical Engineering, Aksum University',
    quote: '“Knowledge matters most when it turns into action.”', ask: 'Ask me anything', todayin: 'Today in Addis Ababa',
    booktitle: 'Book a session', other: 'Something else',
    s_topic_q: 'What would you like help with?', s_topic_sub: 'Tap one. You can explain more later.', talk: 'Prefer to talk directly?',
    s_when_q: 'When suits you?', s_when_sub: 'Pick a day, then a time.', change: 'Change', done: 'Done', min: '{n} min', free: 'Free', etb: 'ETB {n}',
    eth: 'Ethiopian', greg: 'Gregorian', more: 'More dates', hidecal: 'Hide calendar', loading: 'Finding open times…',
    nodays: 'No open times right now. Message Zolla and he will find a time for you.', pickday: 'Pick a day to see the times.', timesfor: 'Times on {d}',
    s_you_q: 'Almost done.', name: 'Your name', phone: 'Phone or WhatsApp', notes: 'Anything Zolla should know? (optional)',
    pin: 'PIN to check your booking later (optional)', pinhint: '4 numbers. With your phone number, it shows your bookings on any phone.',
    payfree: 'Free. Zolla will confirm and send the details.', payafter: '{p}. You pay after Zolla confirms. Nothing to pay now.',
    e_name: 'Please write your name', e_phone: 'Add your phone number, like 0911 234 567', e_pin: 'Use 4 numbers, or leave it empty',
    cont: 'Continue', send: 'Send my request', sending: 'Sending…', close: 'Close',
    taken: 'That time was just taken. Please pick another.', neterr: 'Could not send. Check your internet and try again, or message Zolla on WhatsApp.',
    d_pending: 'Request sent!', d_confirmed: 'You’re booked!', ds_pending: 'Your time is held. Zolla will confirm and send the meeting details.', ds_confirmed: 'Your seat is secured. Details are on their way.',
    t_session: 'Session', t_date: 'Date', t_time: 'Time', t_price: 'Price', t_ref: 'Reference', t_greg: 'Gregorian',
    sb_t: 'Make sure Zolla sees it right away', sb_s: 'Send your request in one tap. It is already written for you.', sendwa: 'Send on WhatsApp', sendtg: 'Telegram',
    keepref: 'Your bookings are saved on this phone under “My bookings”.', sum0: 'Takes about a minute', sum0b: 'No account or app needed',
    st_pending: 'Waiting for Zolla', st_confirmed: 'Confirmed', st_completed: 'Completed', st_cancelled: 'Cancelled',
    mb_title: 'My bookings', mb_none: 'No bookings on this phone yet.', mb_find: 'Booked on another phone?', mb_find_sub: 'Enter the phone number and PIN you used when booking.',
    mb_findbtn: 'Show my bookings', mb_notfound: 'No bookings found with this phone and PIN.', mb_cancel: 'Cancel', mb_cancel_q: 'Cancel this booking?', mb_yes: 'Yes, cancel', mb_keep: 'Keep it',
    mb_cancelled: 'Cancelled. Zolla will see it.', mb_join: 'Join meeting', mb_msg: 'Message Zolla', mb_new: 'Book a new session', mb_past: 'Past and cancelled', mb_up: 'Upcoming',
    pinlabel: '4-digit PIN', read: 'Read', back: 'Back',
    aiTitle: 'Zolla’s assistant', aiSub: 'Quick help, or message Zolla',
    ai_hi: 'Selam! I can help you choose a session, book a time, or reach Zolla directly. What do you need?',
    c_book: 'How do I book?', c_price: 'Prices', c_mine: 'My booking', c_talk: 'Talk to Zolla',
    a_book: 'It takes about a minute:\n1. Tap a topic.\n2. Pick a day and a time.\n3. Write your name and phone.\n4. Send. Zolla confirms and sends the details.',
    a_price: 'Prices:\n{list}\n\nYou don’t pay on the website. For paid sessions you pay after Zolla confirms.',
    a_mine: 'Tap “My bookings” at the top. Bookings made on this phone show up there. From another phone, use your phone number and PIN.',
    a_talk: 'Of course. Tap one to message Zolla:', a_else: 'Thanks! The easiest way is to book a session, or message Zolla directly:', a_topic: 'Zolla can help with {t}. Want to book it?',
    open_book: 'Start booking', open_mine: 'Open My bookings',
    wa_hello: 'Hi Zolla, I found you through your website.',
    req: 'Hi Zolla, I just booked on your website.\n\nRef: {ref}\nTopic: {topic}\nSession: {svc}\nDate: {date}\nTime: {time} (Addis Ababa)\nName: {name}\nPhone: {phone}',
  },
  am: {
    n_home: 'ዋና', n_topics: 'ርዕሶች', n_blog: 'ብሎግ', n_about: 'ስለ እኔ', n_contact: 'አግኙኝ', mybk: 'ቀጠሮዎቼ', book: 'ቀጠሮ',
    h1: 'ሀሳብን ወደ', words: ['ተግባር።', 'ገቢ።', 'ብራንድ።', 'እድገት።', 'ለውጥ።'],
    intro: 'ሰዎችና ድርጅቶች ዲጂታል ክህሎትን ወደ እውነተኛ ውጤት እንዲቀይሩ እረዳለሁ።', cta: 'ቀጠሮ ይያዙ',
    need: 'በምን ልርዳዎት?', needsub: 'አንዱን ይምረጡ፤ በአንድ ደቂቃ ቀጠሮ ይያዙ።',
    blog: 'ብሎግ', blogsub: 'ስለ AI፣ ብራንዲንግ እና ዲጂታል ቢዝነስ አጭርና ተግባራዊ ጽሑፎች።', blogsoon: 'የመጀመሪያዎቹ ጽሑፎች በቅርቡ ይወጣሉ።', blogfollow: 'ቀድመው ለማንበብ በቴሌግራም ይከታተሉ።', blogbtn: 'በቴሌግራም ይከታተሉ',
    hi: 'ሰላም፣ ዞላ ነኝ።', hitext: 'የሊሎ ዲጂታል አካዳሚ መስራችና ዋና ሥራ አስፈጻሚ ነኝ። ወጣቶች ወደ ሥራና ቢዝነስ የሚያደርሱ ተግባራዊ ዲጂታል ክህሎቶችን እንዲማሩ እረዳለሁ።',
    journey: 'የእኔ ጉዞ', y1: '2023 – አሁን', y2: 'ፌሎውሺፕ', y3: 'ቀደም ሲል', j1: 'መስራችና ዋና ሥራ አስፈጻሚ፣ ሊሎ ዲጂታል አካዳሚ', j2: 'ማስተርካርድ ፋውንዴሽን ኤድቴክ ፌሎውሺፕ', j3: 'ሚዲያና ትምህርት፦ ፍኖተ ብርሃን፣ አላጄ ሚዲያ፣ ድሪምስ አካዳሚ', j4: 'ቢኤስሲ ሜካኒካል ምህንድስና፣ አክሱም ዩኒቨርሲቲ',
    quote: '“እውቀት ዋጋ የሚኖረው ወደ ተግባር ሲቀየር ነው።”', ask: 'ይጠይቁኝ', todayin: 'ዛሬ በአዲስ አበባ',
    booktitle: 'ቀጠሮ ይያዙ', other: 'ሌላ ጉዳይ',
    s_topic_q: 'በምን ጉዳይ ልርዳዎት?', s_topic_sub: 'አንዱን ይንኩ። ዝርዝሩን በኋላ ማስረዳት ይችላሉ።', talk: 'በቀጥታ ማውራት ይመርጣሉ?',
    s_when_q: 'መቼ ይመችዎታል?', s_when_sub: 'ቀን ይምረጡ፣ ከዚያ ሰዓት።', change: 'ቀይር', done: 'ጨርስ', min: '{n} ደቂቃ', free: 'ነጻ', etb: '{n} ብር',
    eth: 'ኢትዮጵያ', greg: 'ፈረንጅ', more: 'ሌሎች ቀናት', hidecal: 'ቀን መቁጠሪያውን ዝጋ', loading: 'ክፍት ሰዓቶችን በመፈለግ ላይ…',
    nodays: 'አሁን ክፍት ሰዓት የለም። ለዞላ መልዕክት ይላኩ፤ ሰዓት ያመቻችልዎታል።', pickday: 'ሰዓቶቹን ለማየት ቀን ይምረጡ።', timesfor: 'የ{d} ሰዓቶች',
    s_you_q: 'ሊጨርሱ ነው።', name: 'ስምዎ', phone: 'ስልክ ወይም ዋትስአፕ', notes: 'ዞላ ማወቅ ያለበት ነገር አለ? (ካለ)',
    pin: 'ቀጠሮዎን በኋላ ለማየት የሚስጥር ቁጥር (ካስፈለገ)', pinhint: '4 ቁጥሮች። ከስልክ ቁጥርዎ ጋር በማንኛውም ስልክ ቀጠሮዎን ያሳያል።',
    payfree: 'ነጻ ነው። ዞላ አረጋግጦ ዝርዝሩን ይልካል።', payafter: '{p}። ዞላ ካረጋገጠ በኋላ ይከፍላሉ። አሁን ምንም አይከፈልም።',
    e_name: 'እባክዎ ስምዎን ይጻፉ', e_phone: 'ስልክ ቁጥር ያስገቡ፣ ለምሳሌ 0911 234 567', e_pin: '4 ቁጥሮች ይጠቀሙ ወይም ባዶ ይተዉት',
    cont: 'ቀጥል', send: 'ጥያቄዬን ላክ', sending: 'በመላክ ላይ…', close: 'ዝጋ',
    taken: 'ያ ሰዓት አሁን ተይዟል። እባክዎ ሌላ ይምረጡ።', neterr: 'መላክ አልተቻለም። ኢንተርኔትዎን አረጋግጠው እንደገና ይሞክሩ፣ ወይም በዋትስአፕ ለዞላ ይጻፉ።',
    d_pending: 'ጥያቄዎ ተልኳል!', d_confirmed: 'ቀጠሮዎ ተይዟል!', ds_pending: 'ሰዓቱ ተይዞልዎታል። ዞላ አረጋግጦ የስብሰባውን ዝርዝር ይልካል።', ds_confirmed: 'ቦታዎ ተረጋግጧል። ዝርዝሩ በቅርቡ ይደርስዎታል።',
    t_session: 'የአገልግሎት አይነት', t_date: 'ቀን', t_time: 'ሰዓት', t_price: 'ዋጋ', t_ref: 'መለያ ቁጥር', t_greg: 'በፈረንጅ',
    sb_t: 'ዞላ ወዲያው እንዲያየው', sb_s: 'ጥያቄዎን በአንድ ንክኪ ይላኩ። መልዕክቱ ተጽፎልዎታል።', sendwa: 'በዋትስአፕ ላክ', sendtg: 'ቴሌግራም',
    keepref: 'ቀጠሮዎችዎ በዚህ ስልክ “ቀጠሮዎቼ” ውስጥ ተቀምጠዋል።', sum0: 'አንድ ደቂቃ ያህል ይወስዳል', sum0b: 'አካውንት ወይም አፕ አያስፈልግም',
    st_pending: 'ዞላን በመጠበቅ ላይ', st_confirmed: 'ተረጋግጧል', st_completed: 'ተጠናቋል', st_cancelled: 'ተሰርዟል',
    mb_title: 'ቀጠሮዎቼ', mb_none: 'በዚህ ስልክ እስካሁን ቀጠሮ የለም።', mb_find: 'በሌላ ስልክ ነው የያዙት?', mb_find_sub: 'ቀጠሮ ሲይዙ የተጠቀሙበትን ስልክ ቁጥርና የሚስጥር ቁጥር ያስገቡ።',
    mb_findbtn: 'ቀጠሮዎቼን አሳይ', mb_notfound: 'በዚህ ስልክና የሚስጥር ቁጥር ቀጠሮ አልተገኘም።', mb_cancel: 'ሰርዝ', mb_cancel_q: 'ይህን ቀጠሮ ይሰርዙ?', mb_yes: 'አዎ፣ ሰርዝ', mb_keep: 'ይቆይ',
    mb_cancelled: 'ተሰርዟል። ዞላ ያየዋል።', mb_join: 'ስብሰባውን ተቀላቀል', mb_msg: 'ለዞላ ጻፍ', mb_new: 'አዲስ ቀጠሮ ይያዙ', mb_past: 'ያለፉና የተሰረዙ', mb_up: 'የሚመጡ',
    pinlabel: 'ባለ 4 አሃዝ የሚስጥር ቁጥር', read: 'አንብብ', back: 'ተመለስ',
    aiTitle: 'የዞላ ረዳት', aiSub: 'ፈጣን እገዛ፣ ወይም ለዞላ ይጻፉ',
    ai_hi: 'ሰላም! አገልግሎት እንዲመርጡ፣ ቀጠሮ እንዲይዙ ወይም ዞላን በቀጥታ እንዲያገኙ እረዳዎታለሁ። ምን ይፈልጋሉ?',
    c_book: 'እንዴት ቀጠሮ እይዛለሁ?', c_price: 'ዋጋዎች', c_mine: 'ቀጠሮዬ', c_talk: 'ዞላን ማናገር',
    a_book: 'አንድ ደቂቃ ያህል ይወስዳል፦\n1. ርዕስ ይንኩ።\n2. ቀንና ሰዓት ይምረጡ።\n3. ስምና ስልክ ይጻፉ።\n4. ይላኩ። ዞላ አረጋግጦ ዝርዝሩን ይልካል።',
    a_price: 'ዋጋዎች፦\n{list}\n\nበድረ-ገጹ ላይ ምንም አይከፍሉም። የሚከፈልባቸውን አገልግሎቶች ዞላ ካረጋገጠ በኋላ ይከፍላሉ።',
    a_mine: 'ከላይ ያለውን “ቀጠሮዎቼ” ይንኩ። በዚህ ስልክ የያዟቸው ቀጠሮዎች እዚያ ይታያሉ። ከሌላ ስልክ ከሆነ ስልክ ቁጥርዎንና የሚስጥር ቁጥርዎን ይጠቀሙ።',
    a_talk: 'በእርግጥ። ለዞላ ለመጻፍ አንዱን ይንኩ፦', a_else: 'እናመሰግናለን! ቀላሉ መንገድ ቀጠሮ መያዝ ወይም ለዞላ በቀጥታ መጻፍ ነው፦', a_topic: 'ዞላ በ{t} ሊረዳዎት ይችላል። ቀጠሮ ይያዙ?',
    open_book: 'ቀጠሮ ጀምር', open_mine: 'ቀጠሮዎቼን ክፈት',
    wa_hello: 'ሰላም ዞላ፣ በድረ-ገጽህ በኩል ነው ያገኘሁህ።',
    req: 'ሰላም ዞላ፣ አሁን በድረ-ገጽህ ቀጠሮ ያዝኩ።\n\nመለያ፦ {ref}\nርዕስ፦ {topic}\nአገልግሎት፦ {svc}\nቀን፦ {date}\nሰዓት፦ {time} (አዲስ አበባ)\nስም፦ {name}\nስልክ፦ {phone}',
  },
};
let LANG = store.get('zmg-lang', (navigator.language || '').toLowerCase().startsWith('am') ? 'am' : 'en');
if (!T[LANG]) LANG = 'en';
const t = (k, v = {}) => String(T[LANG][k] ?? T.en[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => v[x] ?? '');
const am = () => LANG === 'am';
const L = (en, amv) => (am() && amv ? amv : en);

/* dates and times in the visitor's language */
const fEth = (s, lang = LANG) => { const e = j2e(jdn(s)); return lang === 'am' ? `${EMA[e.m - 1]} ${e.d}፣ ${e.y}` : `${EM[e.m - 1]} ${e.d}, ${e.y}`; };
const fGr = (s, lang = LANG) => { const g = j2g(jdn(s)); return lang === 'am' ? `${GMA[g.m - 1]} ${g.d}፣ ${g.y}` : `${GM[g.m - 1]} ${g.d}, ${g.y}`; };
const fWd = (s, lang = LANG) => (lang === 'am' ? WDA : WD)[wday(s)];
const fIntl = (ms) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(ms));
function fLocal(ms) { // Ethiopian clock: 7:00 in the morning is 1 o'clock
  const d = new Date(ms + OFF * 60000), h = d.getUTCHours(), m = d.getUTCMinutes();
  const eh = mod(h - 6, 12) || 12, part = h >= 6 && h < 12 ? 'ጠዋት' : h >= 12 && h < 18 ? 'ከሰዓት' : h >= 18 ? 'ምሽት' : 'ሌሊት';
  return `${part} ${eh}:${pad(m)}`;
}
const fTime = (ms, lang = LANG) => (lang === 'am' ? fLocal(ms) : fIntl(ms));
const fPrice = (s) => (s.price > 0 ? t('etb', { n: Number(s.price).toLocaleString('en-US') }) : t('free'));

/* ================= data ================= */
const DEFAULT_SETTINGS = {
  hours: { 0: [], 1: [{ s: 540, e: 720 }, { s: 840, e: 1020 }], 2: [{ s: 540, e: 720 }, { s: 840, e: 1020 }], 3: [{ s: 540, e: 720 }, { s: 840, e: 1020 }], 4: [{ s: 540, e: 720 }, { s: 840, e: 1020 }], 5: [{ s: 540, e: 720 }], 6: [] },
  notice: 12, ahead: 60, step: 30, buf: 15, off: [],
};
const DEFAULT_SERVICES = [
  { id: 'personal', order: 1, kind: 'session', title: 'Personal Consultation', titleAm: 'የግል ምክክር', desc: 'A focused conversation about a goal or a decision.', descAm: 'ስለ አንድ ግብ ወይም ውሳኔ ትኩረት ያለው ውይይት።', min: 60, price: 0, approve: true, active: true },
  { id: 'business', order: 2, kind: 'session', title: 'Business & Strategy', titleAm: 'ቢዝነስ እና ስትራቴጂ', desc: 'Work through a business, brand or strategy question.', descAm: 'የቢዝነስ፣ የብራንድ ወይም የስትራቴጂ ጥያቄን አብረን እንፈታለን።', min: 60, price: 2500, approve: true, active: true },
  { id: 'career', order: 3, kind: 'session', title: 'Career Development', titleAm: 'የሥራ እድገት', desc: 'Clarity on your next move, skills and positioning.', descAm: 'ስለሚቀጥለው እርምጃዎ፣ ክህሎትዎና አቋምዎ ግልጽነት።', min: 45, price: 1500, approve: false, active: true },
  { id: 'vip', order: 4, kind: 'vip', title: 'VIP Personal Training', titleAm: 'ቪአይፒ የግል ስልጠና', desc: 'An introductory call before a private training program.', descAm: 'ከግል የስልጠና ፕሮግራም በፊት የትውውቅ ጥሪ።', min: 30, price: 0, approve: true, active: true },
];
const TOPICS = [
  ['Artificial Intelligence', 'career', 'ሰው ሰራሽ አስተውሎት (AI)'], ['Social Media Marketing', 'business', 'ሶሻል ሚዲያ ማርኬቲንግ'], ['Digital Skills', 'career', 'ዲጂታል ክህሎት'],
  ['Content Creation', 'career', 'ይዘት ፈጠራ'], ['Startups & Entrepreneurship', 'business', 'ስታርትአፕ እና ሥራ ፈጠራ'], ['Digital Business', 'business', 'ዲጂታል ቢዝነስ'],
  ['Personal Branding', 'personal', 'የግል ብራንዲንግ'], ['Branding', 'business', 'ብራንዲንግ'], ['Productivity & Technology', 'personal', 'ምርታማነት እና ቴክኖሎጂ'],
  ['Personal Insights', 'personal', 'የግል ምክር'], ['YouTube Management', 'business', 'የዩቲዩብ አስተዳደር'], ['Social Media Management', 'business', 'ሶሻል ሚዲያ አስተዳደር'],
  ['Influencer Marketing & Consulting', 'business', 'ኢንፍሉዌንሰር ማርኬቲንግ እና ማማከር'],
];
const topicName = (en) => { const x = TOPICS.find((t) => t[0] === en); return x ? L(x[0], x[2]) : en === 'Something else' ? t('other') : en; };

let SETTINGS = structuredClone(DEFAULT_SETTINGS), SERVICES = DEFAULT_SERVICES.map((s) => ({ ...s })), POSTS = [], BUSY = new Set();
let ONLINE = false, DB = null;

/* Local test store (only with ?local) */
const LDB = {
  load() { return store.get('zmg-ldb', { settings: null, services: {}, posts: {}, bookings: {}, slots: {}, mine: {} }); },
  save(d) { store.set('zmg-ldb', d); },
};

async function connect() {
  if (LOCAL) { ONLINE = true; return true; }
  try {
    const [A, F, U] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-firestore.js'), import(SDK + 'firebase-auth.js')]);
    const app = A.initializeApp(FIREBASE);
    DB = { F, U, db: F.getFirestore(app), auth: U.getAuth(app) };
    ONLINE = true; return true;
  } catch (e) { console.warn('Firebase not reachable', e); ONLINE = false; return false; }
}
const api = {
  async publicData() {
    if (LOCAL) { const d = LDB.load(), ent = (o) => Object.entries(o).map(([id, x]) => ({ ...x, id })); return { settings: d.settings, services: ent(d.services), posts: ent(d.posts).filter((p) => p.published) }; }
    const { F, db } = DB;
    const [st, sv, ps] = await Promise.all([
      F.getDoc(F.doc(db, 'settings', 'main')).catch(() => null),
      F.getDocs(F.collection(db, 'services')).catch(() => null),
      F.getDocs(F.query(F.collection(db, 'posts'), F.where('published', '==', true))).catch(() => null),
    ]);
    return { settings: st?.exists() ? st.data() : null, services: sv ? sv.docs.map((d) => ({ ...d.data(), id: d.id })) : [], posts: ps ? ps.docs.map((d) => ({ ...d.data(), id: d.id })) : [] };
  },
  async busy(from) {
    if (LOCAL) return new Set(Object.values(LDB.load().slots).map((x) => x.t).filter((x) => x >= from));
    const { F, db } = DB;
    const q = await F.getDocs(F.query(F.collection(db, 'slots'), F.where('t', '>=', from)));
    return new Set(q.docs.map((d) => d.data().t));
  },
  async book(ref, data, mineId) {
    if (LOCAL) {
      const d = LDB.load(); if (data.blocks.some((b) => d.slots[b])) throw new Error('taken');
      d.bookings[ref] = data; data.blocks.forEach((b) => (d.slots[b] = { t: b }));
      if (mineId) d.mine[mineId] = { refs: [...new Set([...(d.mine[mineId]?.refs || []), ref])] };
      LDB.save(d); return;
    }
    const { F, db } = DB, b = F.writeBatch(db);
    b.set(F.doc(db, 'bookings', ref), data);
    data.blocks.forEach((x) => b.set(F.doc(db, 'slots', String(x)), { t: x }));
    if (mineId) b.set(F.doc(db, 'mine', mineId), { refs: F.arrayUnion(ref) }, { merge: true });
    try { await b.commit(); }
    catch (e) {
      const hits = await Promise.all(data.blocks.map((x) => F.getDoc(F.doc(db, 'slots', String(x))).then((s) => s.exists()).catch(() => false)));
      if (hits.some(Boolean)) throw new Error('taken');
      throw e;
    }
  },
  async getBooking(ref) {
    if (LOCAL) { const x = LDB.load().bookings[ref]; return x ? { ...x, ref } : null; }
    const { F, db } = DB; const s = await F.getDoc(F.doc(db, 'bookings', ref)); return s.exists() ? { ...s.data(), ref } : null;
  },
  async cancel(ref) {
    if (LOCAL) { const d = LDB.load(); d.bookings[ref].status = 'cancelled'; LDB.save(d); return; }
    const { F, db } = DB; await F.updateDoc(F.doc(db, 'bookings', ref), { status: 'cancelled' });
  },
  async mineRefs(id) {
    if (LOCAL) return LDB.load().mine[id]?.refs || [];
    const { F, db } = DB; const s = await F.getDoc(F.doc(db, 'mine', id)); return s.exists() ? s.data().refs || [] : [];
  },
  /* admin */
  async all(col) {
    if (LOCAL) { const d = LDB.load(); return Object.entries(d[col] || {}).map(([id, x]) => ({ ...x, id, ref: id })); }
    const { F, db } = DB; const q = await F.getDocs(F.collection(db, col)); return q.docs.map((d) => ({ ...d.data(), id: d.id, ref: d.id }));
  },
  async put(col, id, data) {
    if (LOCAL) { const d = LDB.load(); if (col === 'settings') d.settings = data; else d[col][id] = data; LDB.save(d); return; }
    const { F, db } = DB; await F.setDoc(F.doc(db, col, id), data);
  },
  async patch(col, id, data) {
    if (LOCAL) { const d = LDB.load(); Object.assign(d[col][id], data); LDB.save(d); return; }
    const { F, db } = DB; await F.updateDoc(F.doc(db, col, id), data);
  },
  async remove(col, id) {
    if (LOCAL) { const d = LDB.load(); delete d[col][id]; LDB.save(d); return; }
    const { F, db } = DB; await F.deleteDoc(F.doc(db, col, id));
  },
  async freeSlots(blocks) {
    if (!blocks?.length) return;
    if (LOCAL) { const d = LDB.load(); blocks.forEach((b) => delete d.slots[b]); LDB.save(d); return; }
    const { F, db } = DB, b = F.writeBatch(db); blocks.forEach((x) => b.delete(F.doc(db, 'slots', String(x)))); await b.commit();
  },
  async takeSlots(blocks) {
    if (LOCAL) { const d = LDB.load(); if (blocks.some((b) => d.slots[b])) throw new Error('taken'); blocks.forEach((b) => (d.slots[b] = { t: b })); LDB.save(d); return; }
    const { F, db } = DB, b = F.writeBatch(db); blocks.forEach((x) => b.set(F.doc(db, 'slots', String(x)), { t: x })); await b.commit();
  },
  onAuth(cb) {
    if (LOCAL) { cb(store.get('zmg-ladmin', false) ? { email: ADMIN_EMAIL, displayName: 'Zolla (test)' } : null); return; }
    DB.U.onAuthStateChanged(DB.auth, cb);
  },
  async signIn() {
    if (LOCAL) { store.set('zmg-ladmin', true); location.reload(); return; }
    const p = new DB.U.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    await DB.U.signInWithPopup(DB.auth, p);
  },
  async signOut() { if (LOCAL) { store.set('zmg-ladmin', false); location.reload(); return; } await DB.U.signOut(DB.auth); },
};

function applyPublic({ settings, services, posts }) {
  if (settings?.hours) SETTINGS = { ...DEFAULT_SETTINGS, ...settings };
  const act = (services || []).filter((s) => s.active !== false);
  if (act.length) SERVICES = act.sort((a, b) => (a.order || 0) - (b.order || 0));
  POSTS = (posts || []).filter((p) => p.published).sort((a, b) => (b.created || 0) - (a.created || 0));
}
const svcById = (id) => SERVICES.find((s) => s.id === id) || SERVICES[0];
const svcTitle = (s) => L(s.title, s.titleAm);
const svcDesc = (s) => L(s.desc, s.descAm);

/* ================= availability ================= */
const blocksFor = (st, min) => { const out = [], end = st + (min + (SETTINGS.buf || 0)) * 60000; for (let b = fdiv(st, BLOCK); b * BLOCK < end; b++) out.push(b); return out; };
function slots(day, s) {
  const wins = SETTINGS.hours?.[wday(day)] || [];
  if (!wins.length || (SETTINGS.off || []).includes(day)) return [];
  const lo = Date.now() + (SETTINGS.notice || 0) * 3600000, hi = Date.now() + (SETTINGS.ahead || 60) * 86400000, step = SETTINGS.step || 30;
  const out = [];
  for (const w of wins) for (let m = w.s; m + s.min <= w.e; m += step) {
    const st = toUtc(day, m);
    if (st < lo || st > hi) continue;
    if (blocksFor(st, s.min).some((b) => BUSY.has(b))) continue;
    out.push(st);
  }
  return out;
}
function openDays(s, n) {
  const out = []; let d = today();
  for (let i = 0; i <= (SETTINGS.ahead || 60) && out.length < n; i++, d = iso(jdn(d) + 1)) if (slots(d, s).length) out.push(d);
  return out;
}
async function refreshBusy() { try { BUSY = await api.busy(fdiv(Date.now(), BLOCK)); } catch (e) { console.warn(e); } }

/* ================= public page ================= */
function paintToday() {
  const d = today();
  $('#todaycard').innerHTML = `<small>${t('todayin')} · ${fTime(Date.now())}</small><b>${esc(fEth(d))}</b><span>${esc(fWd(d))}, ${esc(fGr(d))}</span>`;
  $('#footdate').textContent = `${fEth(d)} · ${fGr(d)}`;
}
function paintTopics() {
  $('#topicgrid').innerHTML = TOPICS.map(([en]) => `<button type="button" class="topic" data-topic="${esc(en)}">${esc(topicName(en))}</button>`).join('');
}
function paintPosts() {
  const box = $('#posts');
  if (!POSTS.length) {
    box.innerHTML = `<div class="blog-empty"><span class="blog-ic" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg></span>
      <div><b>${t('blogsoon')}</b><p class="soft">${t('blogfollow')}</p></div><a class="btn btn-blue" href="${TG}" target="_blank" rel="noopener">${t('blogbtn')}</a></div>`;
    return;
  }
  box.innerHTML = `<div class="posts">${POSTS.map((p) => `<button type="button" class="post" data-post="${esc(p.id)}">
    <div class="cv">${p.cover ? `<img src="${esc(p.cover)}" alt="" loading="lazy">` : esc((p.title || 'Z').trim()[0] || 'Z')}</div>
    <div class="tx"><time>${esc(p.created ? fEth(dayOf(p.created)) : '')}</time><h3 ${langAttr(p.title)}>${esc(p.title)}</h3><p ${langAttr(p.body)}>${esc((p.body || '').slice(0, 220))}</p></div></button>`).join('')}</div>`;
}
const langAttr = (s) => (/[ሀ-፿]/.test(s || '') ? 'lang="am"' : '');

function setLang(l) {
  LANG = l === 'am' ? 'am' : 'en'; store.set('zmg-lang', LANG);
  document.documentElement.lang = LANG; document.documentElement.classList.toggle('is-am', am());
  $$('[data-t]').forEach((el) => { const v = T[LANG][el.dataset.t]; if (typeof v === 'string') el.textContent = v; });
  const b = $('#langbtn'); b.textContent = am() ? 'EN' : 'አማ'; b.lang = am() ? 'en' : 'am'; b.setAttribute('aria-label', am() ? 'Switch to English' : 'ወደ አማርኛ ቀይር');
  $$('[data-wa]').forEach((a) => (a.href = waLink(t('wa_hello'))));
  wi = 0; const r = $('#rot'); r.innerHTML = `<span>${esc(T[LANG].words[0])}</span>`;
  $('#h1').setAttribute('aria-label', `${t('h1')} ${T[LANG].words[0]}`);
  paintToday(); paintTopics(); paintPosts();
  if (!$('#sheet').hidden && S) renderStep('none');
  if (!$('#modal').hidden && MOD.repaint) MOD.repaint();
  if (!$('#aiPanel').hidden) { AI.opened = false; $('#aiBody').innerHTML = ''; openAI(); }
}
$('#langbtn').addEventListener('click', () => setLang(am() ? 'en' : 'am'));

/* rotating word */
let wi = 0;
if (!reduce) setInterval(() => {
  if (document.hidden || $('#site').hidden) return;
  const r = $('#rot'), words = T[LANG].words; if (!r) return;
  while (r.children.length > 1) r.firstElementChild.remove();
  const old = r.firstElementChild; wi = (wi + 1) % words.length;
  const nw = document.createElement('span'); nw.textContent = words[wi]; nw.className = 'down'; r.appendChild(nw);
  void nw.offsetWidth; old.className = 'up'; nw.className = '';
  setTimeout(() => old.remove(), 800);
}, 2800);

/* photo slider: the two photos slide in turn */
const PH = { i: 0, timer: null };
function showPhoto(n) {
  const imgs = $$('#photo img'), dots = $$('#pdots button'); if (n === PH.i) return;
  imgs[PH.i].className = 'prev'; imgs[n].className = 'next'; void imgs[n].offsetWidth; imgs[n].className = 'cur';
  const old = PH.i; setTimeout(() => { if (PH.i !== old) imgs[old].className = 'next'; }, 1150);
  dots.forEach((d, k) => d.toggleAttribute('aria-current', k === n)); PH.i = n;
}
function autoPhoto() { clearInterval(PH.timer); if (!reduce) PH.timer = setInterval(() => { if (!document.hidden) showPhoto((PH.i + 1) % 2); }, 4800); }
$('#pdots').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; showPhoto($$('#pdots button').indexOf(b)); autoPhoto(); });
autoPhoto();

/* header, nav, reveal */
addEventListener('scroll', () => $('#hdr').classList.toggle('scrolled', scrollY > 8), { passive: true });
const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.1 }) : null;
$$('.reveal').forEach((el) => (io && !reduce ? io.observe(el) : el.classList.add('in')));
function markNav(k) { $$('[data-nav]').forEach((b) => b.toggleAttribute('aria-current', b.dataset.nav === k)); }
if ('IntersectionObserver' in window) {
  const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) markNav(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
  ['topics', 'blog', 'me', 'contact'].forEach((id) => so.observe(document.getElementById(id)));
  addEventListener('scroll', () => { if (scrollY < 220) markNav('top'); }, { passive: true });
}
markNav('top');
$('#site').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if ('home' in d) return scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  if (d.go) return document.getElementById(d.go)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  if (d.topic) return openSheet(d.topic);
  if ('book' in d) return openSheet(null);
  if ('mybk' in d) return openMine();
  if (d.post) return openPost(d.post);
});

/* ================= overlays ================= */
const MOD = { repaint: null };
function lockScroll(on) { document.body.style.overflow = on ? 'hidden' : ''; document.body.classList.toggle('modal-open', on); }
function showVeil() { const v = $('#veil'); v.hidden = false; requestAnimationFrame(() => v.classList.add('on')); }
function hideVeil() { const v = $('#veil'); v.classList.remove('on'); setTimeout(() => { if (!$('#sheet').classList.contains('on') && $('#modal').hidden) v.hidden = true; }, 350); }
function openModal(paint, wide) {
  MOD.repaint = paint; $('#modal').classList.toggle('wide', !!wide); $('#modal').hidden = false; showVeil(); lockScroll(true); paint();
}
function closeModal() { $('#modal').hidden = true; MOD.repaint = null; if (!$('#sheet').classList.contains('on')) { hideVeil(); lockScroll(false); } }
$('#veil').addEventListener('click', () => { if (!$('#modal').hidden) closeModal(); else if (!$('#sheet').hidden) closeSheet(); });
addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; if (!$('#modal').hidden) closeModal(); else if (!$('#sheet').hidden) closeSheet(); else if (!$('#aiPanel').hidden) closeAI(); });

/* ================= booking ================= */
const STEPS = ['topic', 'when', 'you', 'done'];
let S = null;
async function openSheet(topic) {
  const svc = topic ? svcById(TOPICS.find((x) => x[0] === topic)?.[1] || 'personal') : null;
  S = { i: topic ? 1 : 0, topic, svc, autoSvc: true, showSvc: false, sys: 'eth', day: null, slot: null, cal: false, view: null, loading: true,
    f: { name: store.get('zmg-name', ''), phone: store.get('zmg-phone', ''), notes: '', pin: '' }, err: {}, res: null, busy: false };
  $('#sheet').hidden = false; showVeil(); lockScroll(true);
  requestAnimationFrame(() => $('#sheet').classList.add('on'));
  renderStep('none');
  await refreshBusy(); S.loading = false;
  if (STEPS[S.i] === 'when') renderStep('none');
}
function closeSheet() {
  $('#sheet').classList.remove('on'); hideVeil(); if ($('#modal').hidden) lockScroll(false);
  setTimeout(() => { $('#sheet').hidden = true; }, 450);
}
$('#close').onclick = closeSheet;
$('#back').onclick = () => goStep(S.i - 1);
$('#next').onclick = () => nextStep();
function goStep(n) {
  const dir = n > S.i ? 'fwd' : 'back'; S.i = n; renderStep(dir);
}
function renderStep(dir) {
  const k = STEPS[S.i], st = $('#stage'); let h = '';
  $('#barfill').style.width = `${((S.i + 1) / STEPS.length) * 100}%`;
  $('#back').disabled = S.i === 0 || k === 'done';
  $('#back').style.visibility = S.i === 0 || k === 'done' ? 'hidden' : 'visible';
  if (k === 'topic') {
    h = `<h2 class="q">${t('s_topic_q')}</h2><p class="qsub">${t('s_topic_sub')}</p>
      <div class="tgrid">${[...TOPICS.map((x) => x[0]), 'Something else'].map((en) => `<button type="button" class="tpick" aria-pressed="${S.topic === en}" data-pick="${esc(en)}">${esc(topicName(en))}</button>`).join('')}</div>
      <div class="sendbox"><b style="font-size:14px">${t('talk')}</b><div class="row"><a class="btn btn-line btn-sm" href="${waLink(t('wa_hello'))}" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn-line btn-sm" href="${TG}" target="_blank" rel="noopener">Telegram</a></div></div>`;
  }
  if (k === 'when') h = whenHtml();
  if (k === 'you') h = youHtml();
  if (k === 'done') h = doneHtml();
  st.innerHTML = `<div class="step ${dir === 'fwd' ? 'in-r' : dir === 'back' ? 'in-l' : ''}">${h}</div>`;
  if (dir !== 'none') st.scrollTop = 0;
  paintFoot();
  if (k === 'when' && S.day) requestAnimationFrame(() => $('#stage .dcard[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' }));
}
function whenHtml() {
  const s = S.svc;
  const sess = `<div class="sessline"><span>${esc(svcTitle(s))} · ${t('min', { n: s.min })} · <b>${esc(fPrice(s))}</b></span><button type="button" class="linkbtn" data-chsvc>${S.showSvc ? t('done') : t('change')}</button></div>
    ${S.showSvc ? `<div class="svcs">${SERVICES.map((x) => `<button type="button" class="svc" aria-pressed="${x.id === s.id}" data-svc="${esc(x.id)}"><b>${esc(svcTitle(x))}</b><span class="pr">${esc(fPrice(x))}</span><span class="d">${esc(svcDesc(x))} ${t('min', { n: x.min })}.</span></button>`).join('')}</div>` : ''}`;
  if (S.loading) return `<h2 class="q">${t('s_when_q')}</h2>${sess}<div class="loading"><span class="spin"></span>${t('loading')}</div>`;
  const days = openDays(s, 14);
  if (!days.length) return `<h2 class="q">${t('s_when_q')}</h2>${sess}<div class="note"><i>!</i><span>${t('nodays')}</span></div><a class="btn btn-blue" href="${waLink(t('wa_hello'))}" target="_blank" rel="noopener">WhatsApp</a>`;
  if (!S.day || !slots(S.day, s).length) { S.day = days[0]; S.slot = null; }
  const card = (d) => { const e = j2e(jdn(d)), g = j2g(jdn(d)), eth = S.sys === 'eth';
    const wd = fWd(d), wds = am() ? wd : wd.slice(0, 3);
    const main = eth ? e.d : g.d, mon = eth ? (am() ? EMA : EM)[e.m - 1] : (am() ? GMA : GM)[g.m - 1];
    const sec = am() ? (eth ? `${g.d}/${g.m}` : `${e.d}/${e.m}`) : eth ? `${GM[g.m - 1].slice(0, 3)} ${g.d}` : `${EM[e.m - 1].slice(0, 3)} ${e.d}`;
    return `<button type="button" class="dcard" aria-pressed="${S.day === d}" data-day="${d}"><small>${esc(wds)}</small><b>${main}</b><span>${esc(am() ? mon : mon.slice(0, 3))}</span><span>${esc(sec)}</span></button>`; };
  const sl = slots(S.day, s);
  return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h2 class="q">${t('s_when_q')}</h2>
      <div class="seg" role="group"><button type="button" data-sys="eth" aria-pressed="${S.sys === 'eth'}">${t('eth')}</button><button type="button" data-sys="greg" aria-pressed="${S.sys === 'greg'}">${t('greg')}</button></div></div>
    ${sess}
    <div class="days-strip" id="strip">${days.map(card).join('')}<button type="button" class="dmore" data-cal>${S.cal ? t('hidecal') : t('more')}</button></div>
    ${S.cal ? calHtml() : ''}
    <p class="daylabel">${esc(fWd(S.day))}, ${esc(S.sys === 'eth' ? fEth(S.day) : fGr(S.day))} <span>· ${esc(S.sys === 'eth' ? fGr(S.day) : fEth(S.day))}</span></p>
    <div class="times" role="radiogroup">${sl.map((x) => `<button type="button" class="time" role="radio" aria-checked="${S.slot === x}" data-slot="${x}"><b>${esc(fTime(x))}</b>${am() ? `<small>${esc(fIntl(x))}</small>` : ''}</button>`).join('')}</div>`;
}
function calHtml() {
  const eth = S.sys === 'eth';
  if (!S.view || S.view.sys !== S.sys) { const j = jdn(S.day || today()), x = eth ? j2e(j) : j2g(j); S.view = { sys: S.sys, y: x.y, m: x.m }; }
  const v = S.view, max = iso(jdn(today()) + (SETTINGS.ahead || 60)), td = today();
  const days = eth ? Array.from({ length: eDays(v.y, v.m) }, (_, i) => iso(e2j(v.y, v.m, 1) + i)) : Array.from({ length: gDays(v.y, v.m) }, (_, i) => iso(g2j(v.y, v.m, i + 1)));
  const curIdx = (() => { const x = eth ? j2e(jdn(td)) : j2g(jdn(td)); return x.y * 13 + x.m; })();
  const title = eth ? `${(am() ? EMA : EM)[v.m - 1]} ${v.y}` : `${(am() ? GMA : GM)[v.m - 1]} ${v.y}`;
  const a = jdn(days[0]), z = jdn(days[days.length - 1]);
  const other = eth ? (() => { const x = j2g(a), y = j2g(z), M = am() ? GMA : GM; return x.m === y.m ? `${M[x.m - 1]} ${y.y}` : `${M[x.m - 1]} – ${M[y.m - 1]} ${y.y}`; })()
    : (() => { const x = j2e(a), y = j2e(z), M = am() ? EMA : EM; return x.m === y.m ? `${M[x.m - 1]} ${y.y}` : `${M[x.m - 1]} – ${M[y.m - 1]} ${y.y}`; })();
  const wdn = am() ? ['እ', 'ሰ', 'ማ', 'ረ', 'ሐ', 'ዓ', 'ቅ'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const cells = days.map((d) => { const open = d >= td && d <= max && slots(d, S.svc).length > 0, x = eth ? j2e(jdn(d)) : j2g(jdn(d));
    return `<button type="button" class="d ${open ? 'open' : ''} ${d === td ? 'today' : ''} ${S.day === d ? 'sel' : ''}" ${open ? `data-day="${d}"` : 'disabled'} aria-label="${esc(fEth(d))}, ${esc(fGr(d))}">${x.d}</button>`; }).join('');
  return `<div class="cal"><div class="month"><button type="button" class="iconbtn" data-mon="-1" ${v.y * 13 + v.m <= curIdx ? 'disabled' : ''} aria-label="Previous month">‹</button>
      <div class="t">${esc(title)}<span>${esc(other)}</span></div><button type="button" class="iconbtn" data-mon="1" ${days[days.length - 1] >= max ? 'disabled' : ''} aria-label="Next month">›</button></div>
    <div class="grid7">${wdn.map((w) => `<span class="wd">${w}</span>`).join('')}${'<span></span>'.repeat(wday(days[0]))}${cells}</div></div>`;
}
function youHtml() {
  const f = S.f, e = S.err, s = S.svc, d = S.day;
  const fld = (k, label, type = 'text', extra = '') => `<label class="field ${e[k] ? 'bad' : ''}"><span>${label}</span>${type === 'area' ? `<textarea data-f="${k}" rows="3">${esc(f[k])}</textarea>` : `<input data-f="${k}" type="${type}" value="${esc(f[k])}" ${extra}>`}${e[k] ? `<span class="err" role="alert">${e[k]}</span>` : ''}</label>`;
  return `<h2 class="q">${t('s_you_q')}</h2>
    <div class="mini-sum"><b>${esc(fWd(d))}, ${esc(fEth(d))} · ${esc(fTime(S.slot))}</b><span class="soft">${esc(fGr(d))}${am() ? ` · ${esc(fIntl(S.slot))}` : ''}</span><span class="soft">${esc(svcTitle(s))}${S.topic ? ` · ${esc(topicName(S.topic))}` : ''}</span></div>
    <div class="note"><i>✓</i><span>${s.price > 0 ? t('payafter', { p: fPrice(s) }) : t('payfree')}</span></div>
    ${fld('name', t('name'), 'text', 'autocomplete="name"')}
    ${fld('phone', t('phone'), 'tel', 'autocomplete="tel" inputmode="tel" placeholder="0911 234 567"')}
    ${fld('notes', t('notes'), 'area')}
    <label class="field ${e.pin ? 'bad' : ''}"><span>${t('pin')}</span><input data-f="pin" class="pinin" type="password" inputmode="numeric" maxlength="4" autocomplete="off" value="${esc(f.pin)}" placeholder="••••"><span class="soft" style="font-size:13px">${t('pinhint')}</span>${e.pin ? `<span class="err" role="alert">${e.pin}</span>` : ''}</label>`;
}
function ticketHtml(b, lang = LANG) {
  const d = dayOf(b.start), s = { price: b.price };
  return `<div class="ticket"><div style="display:flex;justify-content:space-between;gap:12px;align-items:start"><div><p class="soft" style="font-size:13px;font-weight:600">${esc(lang === 'am' && b.svcTitleAm ? b.svcTitleAm : b.svcTitle)}</p><p class="big">${esc(fWd(d, lang))}, ${esc(fEth(d, lang))}</p></div><span class="tag">${esc(b.ref)}</span></div>
    <div class="dash"></div><dl class="kv"><div><dt>${t('t_greg')}</dt><dd>${esc(fGr(d, lang))}</dd></div><div><dt>${t('t_time')}</dt><dd>${esc(fTime(b.start, lang))}${lang === 'am' ? ` (${esc(fIntl(b.start))})` : ''}</dd></div>
    <div><dt>${t('t_price')}</dt><dd>${esc(fPrice(s))}</dd></div><div><dt>${t('t_ref')}</dt><dd>${esc(b.ref)}</dd></div></dl></div>`;
}
function reqText(b) {
  const d = dayOf(b.start);
  return t('req', { ref: b.ref, topic: b.topic || '-', svc: am() && b.svcTitleAm ? b.svcTitleAm : b.svcTitle, date: `${fEth(d)} (${fGr(d)})`, time: fTime(b.start) + (am() ? ` / ${fIntl(b.start)}` : ''), name: b.name, phone: b.phone });
}
function doneHtml() {
  const r = S.res, pending = r.status === 'pending';
  return `<div style="display:grid;gap:12px;justify-items:start"><svg class="done-mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30"/><path d="M20 33l8 8 16-17"/></svg>
      <h2 class="q">${pending ? t('d_pending') : t('d_confirmed')}</h2><p class="soft">${pending ? t('ds_pending') : t('ds_confirmed')}</p></div>
    ${ticketHtml(r)}
    <div class="sendbox"><b>${t('sb_t')}</b><span class="soft" style="font-size:14px">${t('sb_s')}</span><div class="row"><a class="btn btn-blue btn-sm" href="${waLink(reqText(r))}" target="_blank" rel="noopener">${t('sendwa')}</a><a class="btn btn-line btn-sm" href="${TG}" target="_blank" rel="noopener" data-copyreq>${t('sendtg')}</a></div></div>
    <p class="soft" style="font-size:14px">${t('keepref')}</p>`;
}
function paintFoot() {
  const k = STEPS[S.i], s = S.svc, n = $('#next');
  const l1 = S.topic ? topicName(S.topic) : s ? svcTitle(s) : '';
  const l2 = [S.topic && s ? svcTitle(s) : '', S.day && S.slot ? `${S.sys === 'eth' ? fEth(S.day) : fGr(S.day)}, ${fTime(S.slot)}` : ''].filter(Boolean).join(' · ');
  $('#sum').innerHTML = l1 ? `<b>${esc(l1)}</b><span>${esc(l2 || (s ? `${t('min', { n: s.min })} · ${fPrice(s)}` : ''))}</span>` : `<b>${t('sum0')}</b><span>${t('sum0b')}</span>`;
  const cfg = { topic: [t('cont'), !S.topic], when: [t('cont'), !S.slot], you: [S.busy ? t('sending') : t('send'), S.busy], done: [t('close'), false] }[k];
  n.textContent = cfg[0]; n.disabled = cfg[1];
}
$('#sheet').addEventListener('input', (e) => { const k = e.target.dataset.f; if (!k) return; if (k === 'pin') e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); S.f[k] = e.target.value; });
$('#sheet').addEventListener('click', (e) => {
  const b = e.target.closest('button'); const cp = e.target.closest('[data-copyreq]');
  if (cp && S?.res) { try { navigator.clipboard.writeText(reqText(S.res)).then(() => toast(am() ? 'ተቀድቷል። በቴሌግራም ይለጥፉት።' : 'Copied. Paste it in Telegram.')); } catch {} return; }
  if (!b || !S) return; const d = b.dataset;
  if (d.pick) {
    S.topic = d.pick; S.fromStep0 = true;
    const r = TOPICS.find((x) => x[0] === d.pick); if (S.autoSvc || !S.svc) S.svc = svcById(r ? r[1] : 'personal');
    $$('#stage .tpick').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paintFoot();
    clearTimeout(S.adv); S.adv = setTimeout(() => goStep(1), 300); return;
  }
  if ('chsvc' in d) { S.showSvc = !S.showSvc; return renderStep('none'); }
  if (d.svc) { S.svc = svcById(d.svc); S.autoSvc = false; S.showSvc = false; S.slot = null; S.day = null; return renderStep('none'); }
  if (d.sys) { S.sys = d.sys; S.view = null; return renderStep('none'); }
  if ('cal' in d) { S.cal = !S.cal; return renderStep('none'); }
  if (d.mon) { const per = S.sys === 'eth' ? 13 : 12, i = S.view.y * per + S.view.m - 1 + Number(d.mon); S.view = { sys: S.sys, y: fdiv(i, per), m: mod(i, per) + 1 }; return renderStep('none'); }
  if (d.day) { S.day = d.day; S.slot = null; renderStep('none'); return requestAnimationFrame(() => $('#stage .times')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' })); }
  if (d.slot) { S.slot = Number(d.slot); $$('#stage .time').forEach((x) => x.setAttribute('aria-checked', String(x === b))); return paintFoot(); }
});
async function nextStep() {
  const k = STEPS[S.i];
  if (k === 'done') return closeSheet();
  if (k !== 'you') return goStep(S.i + 1);
  const f = S.f, e = {};
  if (f.name.trim().length < 2) e.name = t('e_name');
  if (f.phone.replace(/\D/g, '').length < 9) e.phone = t('e_phone');
  if (f.pin && !/^\d{4}$/.test(f.pin)) e.pin = t('e_pin');
  S.err = e; if (Object.keys(e).length) { renderStep('none'); return $('#stage .field.bad input, #stage .field.bad textarea')?.focus(); }
  if (!ONLINE) return toast(t('neterr'));
  S.busy = true; paintFoot();
  const s = S.svc, ref = newRef(), key = normPhone(f.phone);
  const data = {
    svc: s.id, svcTitle: s.title, svcTitleAm: s.titleAm || '', min: s.min, price: Number(s.price) || 0,
    start: S.slot, end: S.slot + s.min * 60000, blocks: blocksFor(S.slot, s.min),
    name: f.name.trim().slice(0, 80), phone: f.phone.trim().slice(0, 25), notes: f.notes.trim().slice(0, 1500),
    topic: S.topic && S.topic !== 'Something else' ? S.topic : 'General', status: s.approve || s.price > 0 ? 'pending' : 'confirmed',
    pay: s.price > 0 ? 'after' : 'free', created: Date.now(), lang: LANG, link: '',
  };
  const mineId = f.pin ? await sha(`zmg:${key}:${f.pin}`) : null;
  try {
    await api.book(ref, data, mineId);
    store.set('zmg-refs', [...new Set([ref, ...store.get('zmg-refs', [])])].slice(0, 30));
    store.set('zmg-name', data.name); store.set('zmg-phone', data.phone);
    data.blocks.forEach((x) => BUSY.add(x));
    S.res = { ...data, ref }; S.busy = false; goStep(3);
  } catch (err) {
    S.busy = false;
    if (err?.message === 'taken') { toast(t('taken')); await refreshBusy(); S.slot = null; return goStep(1); }
    console.error(err); toast(t('neterr')); paintFoot();
  }
}

/* ================= my bookings ================= */
const MB = { list: null, confirm: null, err: '', finding: false, loading: false };
async function loadMine(extra = []) {
  MB.loading = true; MB.repaint?.();
  const refs = [...new Set([...extra, ...store.get('zmg-refs', [])])];
  const got = await Promise.all(refs.map((r) => api.getBooking(r).catch(() => null)));
  MB.list = got.filter(Boolean).sort((a, b) => b.start - a.start); MB.loading = false;
}
function openMine() { MB.confirm = null; MB.err = ''; MB.list = null; openModal(paintMine); MB.repaint = paintMine; if (ONLINE) loadMine().then(paintMine); }
function paintMine() {
  const box = $('#mbox'); const list = MB.list || [];
  const up = list.filter((b) => (b.status === 'pending' || b.status === 'confirmed') && b.end > Date.now()), past = list.filter((b) => !up.includes(b));
  const card = (b) => { const d = dayOf(b.start);
    return `<article class="bk"><div class="top"><div><p class="soft" style="font-size:13px;font-weight:600">${esc(am() && b.svcTitleAm ? b.svcTitleAm : b.svcTitle)}</p><p class="when">${esc(fWd(d))}, ${esc(fEth(d))}</p><p class="soft" style="font-size:14px">${esc(fGr(d))} · ${esc(fTime(b.start))}</p></div><span class="badge b-${b.status}">${t('st_' + b.status)}</span></div>
      ${b.status === 'confirmed' && b.link ? `<a class="btn btn-blue btn-sm" href="${esc(b.link)}" target="_blank" rel="noopener" style="justify-self:start">${t('mb_join')}</a>` : ''}
      ${MB.confirm === b.ref ? `<div class="bk acts" style="padding:12px;background:var(--bad-bg);border:0"><b style="flex:1 1 100%">${t('mb_cancel_q')}</b><button type="button" class="btn btn-line btn-sm btn-danger" data-cxl="${b.ref}">${t('mb_yes')}</button><button type="button" class="btn btn-sm" data-keep>${t('mb_keep')}</button></div>`
      : `<div class="acts">${up.includes(b) ? `<button type="button" class="btn btn-line btn-sm" data-ask="${b.ref}">${t('mb_cancel')}</button>` : ''}<a class="btn btn-line btn-sm" href="${waLink((am() ? 'ሰላም ዞላ፣ ስለ ቀጠሮዬ ' : 'Hi Zolla, about my booking ') + b.ref)}" target="_blank" rel="noopener">${t('mb_msg')}</a><span class="tag">${esc(b.ref)}</span></div>`}</article>`; };
  box.innerHTML = `<div class="mhead"><b>${t('mb_title')}</b><button type="button" class="iconbtn" data-x aria-label="${t('close')}">✕</button></div>
    ${MB.loading || (ONLINE && MB.list === null) ? `<div class="loading"><span class="spin"></span></div>` : ''}
    ${!MB.loading && MB.list ? (list.length ? `${up.length ? `<p class="soft" style="font-size:13px;font-weight:700">${t('mb_up')}</p>${up.map(card).join('')}` : ''}${past.length ? `<p class="soft" style="font-size:13px;font-weight:700">${t('mb_past')}</p>${past.map(card).join('')}` : ''}` : `<div class="bk"><p>${t('mb_none')}</p></div>`) : ''}
    <button type="button" class="btn btn-blue btn-full" data-new>${t('mb_new')}</button>
    <form class="panel" id="findForm" style="background:var(--surface)"><b>${t('mb_find')}</b><span class="soft" style="font-size:14px">${t('mb_find_sub')}</span>
      <label class="field"><span>${t('phone')}</span><input id="fPhone" type="tel" inputmode="tel" placeholder="0911 234 567" value="${esc(store.get('zmg-phone', ''))}"></label>
      <label class="field"><span>${t('pinlabel')}</span><input id="fPin" class="pinin" type="password" inputmode="numeric" maxlength="4" placeholder="••••"></label>
      ${MB.err ? `<span class="err" role="alert">${MB.err}</span>` : ''}
      <button type="submit" class="btn btn-line" ${MB.finding ? 'disabled' : ''}>${MB.finding ? '<span class="spin"></span>' : t('mb_findbtn')}</button></form>`;
  $('#findForm').onsubmit = async (e) => {
    e.preventDefault(); const key = normPhone($('#fPhone').value), pin = $('#fPin').value.replace(/\D/g, '');
    if (key.length < 12 || pin.length !== 4) { MB.err = t('mb_notfound'); return paintMine(); }
    MB.finding = true; MB.err = ''; paintMine();
    try {
      const refs = await api.mineRefs(await sha(`zmg:${key}:${pin}`));
      if (!refs.length) MB.err = t('mb_notfound');
      else { store.set('zmg-refs', [...new Set([...refs, ...store.get('zmg-refs', [])])].slice(0, 30)); await loadMine(refs); }
    } catch { MB.err = t('neterr'); }
    MB.finding = false; paintMine();
  };
}
$('#mbox').addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  if ('x' in d) return closeModal();
  if (MOD.repaint !== paintMine) return;
  if ('new' in d) { closeModal(); return setTimeout(() => openSheet(null), 120); }
  if (d.ask) { MB.confirm = d.ask; return paintMine(); }
  if ('keep' in d) { MB.confirm = null; return paintMine(); }
  if (d.cxl) { try { await api.cancel(d.cxl); const x = MB.list.find((y) => y.ref === d.cxl); if (x) x.status = 'cancelled'; toast(t('mb_cancelled')); } catch { toast(t('neterr')); } MB.confirm = null; return paintMine(); }
});

/* ================= blog reader ================= */
function openPost(id) {
  const p = POSTS.find((x) => x.id === id); if (!p) return;
  openModal(() => {
    const d = p.created ? dayOf(p.created) : null;
    $('#mbox').innerHTML = `<div class="mhead"><b>${t('blog')}</b><button type="button" class="iconbtn" data-x aria-label="${t('close')}">✕</button></div>
      <article class="reader">${p.cover ? `<div class="cv"><img src="${esc(p.cover)}" alt=""></div>` : ''}<p class="soft" style="font-size:13px;font-weight:600">${d ? esc(fEth(d)) + ' · ' + esc(fGr(d)) : ''}</p>
      <h1 ${langAttr(p.title)}>${esc(p.title)}</h1><div class="body" ${langAttr(p.body)}>${(p.body || '').split(/\n{2,}|\r\n\r\n/).map((x) => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`).join('')}</div></article>
      <a class="btn btn-blue" href="${TG}" target="_blank" rel="noopener">${t('blogbtn')}</a>`;
  }, true);
}

/* ================= assistant (quick help in both languages) ================= */
const AI = { opened: false };
function bubble(who, text, acts = []) {
  const m = document.createElement('div'); m.className = 'msg ' + who; m.textContent = text;
  if (acts.length) { const box = document.createElement('div'); box.className = 'acts'; acts.forEach((a) => { const el = document.createElement(a.href ? 'a' : 'button'); el.textContent = a.label; if (a.href) { el.href = a.href; el.target = '_blank'; el.rel = 'noopener'; } else { el.type = 'button'; el.onclick = a.run; } box.appendChild(el); }); m.appendChild(box); }
  $('#aiBody').appendChild(m); $('#aiBody').scrollTop = $('#aiBody').scrollHeight;
}
const contactActs = () => [{ label: 'WhatsApp', href: waLink(t('wa_hello')) }, { label: 'Telegram', href: TG }];
const bookAct = (topic) => ({ label: t('open_book'), run: () => { closeAI(); setTimeout(() => openSheet(topic || null), 150); } });
function openAI() {
  $('#aiPanel').hidden = false; document.body.classList.add('modal-open');
  if (matchMedia('(max-width: 600px)').matches) document.body.style.overflow = 'hidden';
  if (!AI.opened) {
    AI.opened = true; $('#aiBody').innerHTML = '';
    $('#aiChips').innerHTML = ['c_book', 'c_price', 'c_mine', 'c_talk'].map((k) => `<button type="button" data-q="${k}">${t(k)}</button>`).join('');
    bubble('bot', t('ai_hi'));
  }
  $('#aiIn').placeholder = am() ? 'መልዕክት ይጻፉ…' : 'Type a message…';
}
function closeAI() { $('#aiPanel').hidden = true; if ($('#sheet').hidden && $('#modal').hidden) { document.body.classList.remove('modal-open'); document.body.style.overflow = ''; } }
$('#aiFab').onclick = openAI; $('#aiClose').onclick = closeAI;
$('#aiChips').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) answer(b.dataset.q, b.textContent); });
$('#aiForm').addEventListener('submit', (e) => { e.preventDefault(); const q = $('#aiIn').value.trim(); if (!q) return; $('#aiIn').value = ''; answer(null, q); });
function answer(key, text) {
  bubble('me', text);
  const q = (text || '').toLowerCase();
  if (!key) {
    if (/price|cost|pay|ዋጋ|ክፍያ|ብር/.test(q)) key = 'c_price';
    else if (/my booking|check|cancel|pin|ቀጠሮዬ|ሰርዝ/.test(q)) key = 'c_mine';
    else if (/talk|call|contact|whatsapp|telegram|phone|ስልክ|ደውል|ማናገር|ዋትስአፕ/.test(q)) key = 'c_talk';
    else if (/how|book|start|step|እንዴት|ቀጠሮ/.test(q)) key = 'c_book';
  }
  const say = (m, acts) => setTimeout(() => bubble('bot', m, acts), 380);
  if (key === 'c_book') return say(t('a_book'), [bookAct()]);
  if (key === 'c_price') return say(t('a_price', { list: SERVICES.map((s) => `• ${svcTitle(s)}: ${fPrice(s)} (${t('min', { n: s.min })})`).join('\n') }), [bookAct()]);
  if (key === 'c_mine') return say(t('a_mine'), [{ label: t('open_mine'), run: () => { closeAI(); setTimeout(openMine, 150); } }]);
  if (key === 'c_talk') return say(t('a_talk'), contactActs());
  const tp = TOPICS.find(([en, , a]) => q.includes(en.toLowerCase().split(/[ &]/)[0]) || (a && q.includes(a.split(' ')[0])));
  if (tp) return say(t('a_topic', { t: topicName(tp[0]) }), [bookAct(tp[0])]);
  return say(t('a_else'), [bookAct(), ...contactActs()]);
}

/* ================= admin ================= */
const AD = { user: null, page: 'overview', flt: 'pending', bookings: [], posts: [], services: [], settings: null, loaded: false, open: null, edit: null, err: '' };
const isAdmin = (u) => !!u && (u.email || '').toLowerCase() === ADMIN_EMAIL;
const initials = (n) => String(n || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const adDate = (ms) => { const d = dayOf(ms); return `${WD[wday(d)].slice(0, 3)}, ${fEth(d, 'en')} · ${fGr(d, 'en')}`; };
const live = (b) => b.status === 'pending' || b.status === 'confirmed';
function enterAdmin() {
  $('#site').hidden = true; $('#admin').hidden = false; document.body.classList.add('admin'); document.title = 'Admin · Zolla MG';
  $('#admin').innerHTML = `<div class="a-gate"><div class="loading"><span class="spin"></span></div></div>`;
  if (!ONLINE) { $('#admin').innerHTML = `<div class="a-gate"><div class="card"><h1>Admin</h1><p class="soft">Can’t reach the database. Check your internet and reload.</p></div></div>`; return; }
  api.onAuth(async (u) => {
    AD.user = u;
    if (isAdmin(u) && !AD.loaded) await loadAdmin();
    renderAdmin();
  });
}
async function loadAdmin() {
  try {
    const [bk, ps, sv, st] = await Promise.all([api.all('bookings'), api.all('posts'), api.all('services'), LOCAL ? Promise.resolve(LDB.load().settings) : DB.F.getDoc(DB.F.doc(DB.db, 'settings', 'main')).then((s) => (s.exists() ? s.data() : null))]);
    AD.bookings = bk; AD.posts = ps; AD.services = sv;
    AD.settings = st?.hours ? { ...DEFAULT_SETTINGS, ...st } : structuredClone(DEFAULT_SETTINGS);
    if (!AD.services.length) { for (const s of DEFAULT_SERVICES) { const { id, ...rest } = s; await api.put('services', id, rest); } AD.services = DEFAULT_SERVICES.map((s) => ({ ...s })); }
    if (!st?.hours) await api.put('settings', 'main', AD.settings);
    // free times held by bookings that visitors cancelled
    for (const b of AD.bookings.filter((x) => x.status === 'cancelled' && x.blocks?.length && !x.freed)) { await api.freeSlots(b.blocks).catch(() => {}); await api.patch('bookings', b.ref, { freed: true }).catch(() => {}); b.freed = true; }
    AD.loaded = true;
  } catch (e) { console.error(e); AD.err = 'Could not load your data. Reload the page to try again.'; }
}
function renderAdmin() {
  const box = $('#admin'), u = AD.user;
  if (!u) {
    box.innerHTML = `<div class="a-gate"><div class="card"><span class="mark">Zolla MG<i>.</i></span><h1>Admin</h1><p class="soft">Sign in with your Google account to manage bookings, blog and services.</p>
      <button type="button" class="gbtn" data-signin><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Sign in with Google</button>
      ${AD.err ? `<p class="err">${esc(AD.err)}</p>` : ''}<a class="linkbtn" href="./">← Back to website</a></div></div>`;
    return;
  }
  if (!isAdmin(u)) {
    box.innerHTML = `<div class="a-gate"><div class="card"><h1>Not allowed</h1><p class="soft">${esc(u.email)} is not the admin account. Sign in with ${ADMIN_EMAIL}.</p><button type="button" class="btn btn-line" data-signout>Sign out</button><a class="linkbtn" href="./">← Back to website</a></div></div>`;
    return;
  }
  const pend = AD.bookings.filter((b) => b.status === 'pending');
  const tabs = [['overview', 'Overview'], ['bookings', 'Bookings', pend.length], ['availability', 'Hours'], ['services', 'Services'], ['blog', 'Blog']];
  let m = AD.err ? `<div class="panel"><p class="err">${esc(AD.err)}</p></div>` : '';
  if (!AD.loaded && !AD.err) m = `<div class="loading"><span class="spin"></span>Loading…</div>`;
  else if (AD.page === 'overview') m += overviewHtml(pend);
  else if (AD.page === 'bookings') m += bookingsHtml();
  else if (AD.page === 'availability') m += hoursHtml();
  else if (AD.page === 'services') m += servicesHtml();
  else if (AD.page === 'blog') m += blogHtml();
  box.innerHTML = `<div class="a-top"><div class="wrap"><div class="row"><span class="mark">Zolla MG<i>.</i> <span class="soft" style="font-weight:600;font-size:14px">Admin</span></span>
      <span class="acts"><a class="btn btn-line btn-sm" href="./" target="_blank" rel="noopener">View website</a><button type="button" class="btn btn-sm" data-signout>Sign out</button></span></div>
      <nav class="a-tabs">${tabs.map(([k, l, n]) => `<button type="button" data-page="${k}" ${AD.page === k ? 'aria-current="page"' : ''}>${l}${n ? `<span class="dot">${n}</span>` : ''}</button>`).join('')}</nav></div></div>
    <div class="wrap a-main" id="amain">${m}</div>${AD.open ? detailHtml() : ''}${AD.edit ? editorHtml() : ''}`;
}
function rowHtml(b, quick) {
  return `<div class="row-item" style="cursor:pointer" data-ref="${esc(b.ref)}" role="button" tabindex="0"><span class="av">${esc(initials(b.name))}</span>
    <span class="who"><b>${esc(b.name)}</b><span>${esc(b.svcTitle)} · ${esc(adDate(b.start))} · ${esc(fIntl(b.start))}</span>${b.notes ? `<span>${esc(b.notes.slice(0, 90))}</span>` : ''}</span>
    <span class="r">${quick && b.status === 'pending' ? `<span class="req-acts"><button type="button" class="btn btn-blue btn-xs" data-q="confirmed" data-r="${esc(b.ref)}">Approve</button><button type="button" class="btn btn-line btn-xs" data-q="cancelled" data-r="${esc(b.ref)}">Decline</button></span>` : `<span class="badge b-${b.status}">${b.status}</span>`}</span></div>`;
}
function overviewHtml(pend) {
  const now = Date.now(), up = AD.bookings.filter((b) => live(b) && b.start > now).sort((a, b) => a.start - b.start);
  const wk = AD.bookings.filter((b) => live(b) && b.start > now && b.start < now + 7 * 86400000).length;
  const h = new Date(now + OFF * 60000).getUTCHours(), greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const next = up.find((b) => b.status === 'confirmed') || up[0];
  return `<div class="welcome"><img src="img/p1.jpg" alt=""><div><h1>${greet}, Zolla.</h1><p>${pend.length ? `${pend.length} ${pend.length === 1 ? 'person is' : 'people are'} waiting for your answer.` : 'You’re all caught up.'} Today is ${esc(fEth(today(), 'en'))} · ${esc(fGr(today(), 'en'))}.</p></div></div>
    <div class="stats"><button type="button" class="stat ${pend.length ? 'hot' : ''}" data-page="bookings" data-flt="pending"><b>${pend.length}</b><span>Waiting for you</span></button>
      <button type="button" class="stat" data-page="bookings" data-flt="upcoming"><b>${up.length}</b><span>Upcoming sessions</span></button>
      <div class="stat"><b>${wk}</b><span>In the next 7 days</span></div><button type="button" class="stat" data-page="bookings" data-flt="all"><b>${AD.bookings.length}</b><span>All bookings</span></button></div>
    <div class="cols"><div class="panel"><h3>Waiting for your answer ${pend.length > 4 ? '<button type="button" class="linkbtn" data-page="bookings" data-flt="pending">See all</button>' : ''}</h3>
      ${pend.length ? `<div class="list">${pend.sort((a, b) => a.start - b.start).slice(0, 4).map((b) => rowHtml(b, true)).join('')}</div>` : '<p class="empty">No requests waiting. New bookings appear here.</p>'}</div>
      <div class="panel"><h3>Next session</h3>${next ? `<div class="list">${rowHtml(next)}</div>` : '<p class="empty">Nothing booked yet.</p>'}
      <a class="btn btn-line btn-sm" href="./" target="_blank" rel="noopener" style="justify-self:start">Open your website</a></div></div>`;
}
function bookingsHtml() {
  const now = Date.now(), f = AD.flt;
  const rows = AD.bookings.filter((b) => f === 'all' || (f === 'upcoming' ? live(b) && b.start > now : f === 'past' ? b.status === 'completed' || (live(b) && b.start <= now) : b.status === f))
    .sort((a, b) => (f === 'past' || f === 'all' || f === 'cancelled' ? b.start - a.start : a.start - b.start));
  const F = [['pending', 'Waiting'], ['upcoming', 'Upcoming'], ['past', 'Past'], ['cancelled', 'Cancelled'], ['all', 'All']];
  return `<div class="a-head"><div><h1>Bookings</h1><p class="soft">Times are Addis Ababa time. Tap a booking to manage it.</p></div><button type="button" class="btn btn-line btn-sm" data-reload>Refresh</button></div>
    <div class="chips">${F.map(([k, l]) => `<button type="button" class="chip" aria-pressed="${f === k}" data-flt="${k}">${l}</button>`).join('')}</div>
    <div class="panel">${rows.length ? `<div class="list">${rows.map((b) => rowHtml(b, f === 'pending')).join('')}</div>` : '<p class="empty">Nothing here.</p>'}</div>`;
}
function detailHtml() {
  const b = AD.bookings.find((x) => x.ref === AD.open); if (!b) return '';
  const d = dayOf(b.start), phone = normPhone(b.phone), on = live(b);
  const msgs = {
    confirmed: b.lang === 'am' ? `ሰላም ${b.name}፣ የ${fEth(d, 'am')} (${fIntl(b.start)}) ቀጠሮዎ ተረጋግጧል። ${b.link ? 'የስብሰባ ሊንክ፦ ' + b.link : 'ዝርዝሩን በቅርቡ እልካለሁ።'} — ዞላ` : `Hi ${b.name}, your session on ${fEth(d, 'en')} (${fGr(d, 'en')}) at ${fIntl(b.start)} is confirmed. ${b.link ? 'Meeting link: ' + b.link : 'I will send the details soon.'} — Zolla`,
    other: b.lang === 'am' ? `ሰላም ${b.name}፣ ስለ ቀጠሮዎ (${b.ref})` : `Hi ${b.name}, about your booking (${b.ref})`,
  };
  return `<div class="adm-fixed" data-closeov><div class="box" role="dialog" aria-modal="true">
    <div class="mhead"><b>Booking ${esc(b.ref)}</b><button type="button" class="iconbtn" data-closeov aria-label="Close">✕</button></div>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><span class="av" style="width:52px;height:52px">${esc(initials(b.name))}</span><div style="flex:1"><h2 style="font-size:24px">${esc(b.name)}</h2><span class="soft">${esc(b.phone)}</span></div><span class="badge b-${b.status}">${b.status}</span></div>
    <div class="ticket"><p class="big">${esc(WD[wday(d)])}, ${esc(fEth(d, 'en'))}</p><dl class="kv"><div><dt>Gregorian</dt><dd>${esc(fGr(d, 'en'))}</dd></div><div><dt>Time (Addis)</dt><dd>${esc(fIntl(b.start))} – ${esc(fIntl(b.end))}</dd></div>
      <div><dt>Session</dt><dd>${esc(b.svcTitle)}</dd></div><div><dt>Price</dt><dd>${b.price ? 'ETB ' + Number(b.price).toLocaleString('en-US') : 'Free'} ${b.price ? `<span class="badge b-${b.pay}">${b.pay === 'paid' ? 'Paid' : 'Not paid yet'}</span>` : ''}</dd></div>
      <div><dt>Topic</dt><dd>${esc(b.topic)}</dd></div><div><dt>Language</dt><dd>${b.lang === 'am' ? 'Amharic' : 'English'}</dd></div>
      ${b.notes ? `<div style="grid-column:1/-1"><dt>Their note</dt><dd style="white-space:pre-wrap;font-weight:500">${esc(b.notes)}</dd></div>` : ''}</dl></div>
    <div class="panel"><b>${b.status === 'pending' ? 'Waiting for your answer' : 'Manage'}</b><div style="display:flex;flex-wrap:wrap;gap:8px">
      ${b.status === 'pending' ? '<button type="button" class="btn btn-blue btn-sm" data-act="confirmed">Approve</button>' : ''}
      ${b.status === 'confirmed' ? '<button type="button" class="btn btn-line btn-sm" data-act="completed">Mark completed</button>' : ''}
      ${on ? `<button type="button" class="btn btn-line btn-sm btn-danger" data-act="cancelled">${b.status === 'pending' ? 'Decline' : 'Cancel'}</button>` : ''}
      ${b.status === 'cancelled' && b.start > Date.now() ? '<button type="button" class="btn btn-line btn-sm" data-act="reopen">Reopen</button>' : ''}
      ${b.price && b.pay !== 'paid' && b.status !== 'cancelled' ? '<button type="button" class="btn btn-line btn-sm" data-paid>Mark as paid</button>' : ''}</div></div>
    <div class="panel"><b>Meeting link</b><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="linkin" type="url" placeholder="https://meet.google.com/…" value="${esc(b.link || '')}" style="flex:1 1 220px;min-height:44px;border-radius:14px;border:1.5px solid var(--hair);background:var(--surface);padding:0 14px"><button type="button" class="btn btn-blue btn-sm" data-savelink>Save link</button></div></div>
    <div class="panel"><b>Contact ${esc(b.name.split(' ')[0])}</b><div style="display:flex;gap:8px;flex-wrap:wrap">
      ${b.status === 'confirmed' ? `<a class="btn btn-blue btn-sm" href="${waLink(msgs.confirmed, phone)}" target="_blank" rel="noopener">Send confirmation on WhatsApp</a>` : ''}
      <a class="btn btn-line btn-sm" href="${waLink(msgs.other, phone)}" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn-line btn-sm" href="tel:+${phone}">Call</a></div></div>
    <p class="soft" style="font-size:12px">Booked ${b.created ? esc(new Date(b.created).toLocaleString('en-GB', { timeZone: TZ })) : ''}</p></div></div>`;
}
function hoursHtml() {
  const s = AD.settings, order = [1, 2, 3, 4, 5, 6, 0];
  const toHM = (m) => `${pad(fdiv(m, 60))}:${pad(m % 60)}`;
  return `<div class="a-head"><div><h1>Availability</h1><p class="soft">When people can book you, in Addis Ababa time.</p></div><button type="button" class="btn btn-blue btn-sm" data-savehours>Save changes</button></div>
    <div class="panel"><h3>Weekly hours</h3>${order.map((d) => { const w = s.hours[d] || [];
      return `<div class="hrow"><div class="dn"><button type="button" class="switch" role="switch" aria-checked="${w.length > 0}" data-dayon="${d}" aria-label="${WD[d]} open"></button>${WD[d]}</div>
        <div class="hwins">${w.length ? w.map((x, i) => `<div class="hwin"><input type="time" value="${toHM(x.s)}" data-hs="${d}:${i}"><span class="soft">to</span><input type="time" value="${toHM(x.e)}" data-he="${d}:${i}"><button type="button" class="btn btn-xs" data-hdel="${d}:${i}">Remove</button></div>`).join('') + `<button type="button" class="linkbtn" data-hadd="${d}">+ Add hours</button>` : '<span class="soft" style="padding-top:8px">Closed</span>'}</div></div>`; }).join('')}</div>
    <div class="panel"><h3>Booking rules</h3><div class="form2">
      <label class="field"><span>Minimum notice (hours)</span><input type="number" min="0" max="240" id="r-notice" value="${s.notice}"></label>
      <label class="field"><span>Book up to (days ahead)</span><input type="number" min="1" max="365" id="r-ahead" value="${s.ahead}"></label>
      <label class="field"><span>Start times every</span><select id="r-step">${[15, 30, 45, 60].map((n) => `<option value="${n}" ${s.step === n ? 'selected' : ''}>${n} minutes</option>`).join('')}</select></label>
      <label class="field"><span>Break between sessions</span><select id="r-buf">${[0, 15, 30].map((n) => `<option value="${n}" ${s.buf === n ? 'selected' : ''}>${n} minutes</option>`).join('')}</select></label></div></div>
    <div class="panel"><h3>Days off</h3><p class="soft" style="margin-top:-8px">Holidays or travel. Nobody can book these days.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><input type="date" id="offin" style="min-height:44px;border-radius:14px;border:1.5px solid var(--hair);background:var(--surface);padding:0 12px"><button type="button" class="btn btn-line btn-sm" data-offadd>Add day off</button></div>
      <div class="dlist">${(s.off || []).sort().map((d) => `<span>${esc(fEth(d, 'en'))} · ${esc(fGr(d, 'en'))}<button type="button" data-offdel="${d}" aria-label="Remove">✕</button></span>`).join('') || '<span class="soft" style="background:none;padding:0">No days off.</span>'}</div></div>
    <button type="button" class="btn btn-blue" data-savehours style="justify-self:start">Save changes</button>`;
}
function servicesHtml() {
  const list = AD.services.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  return `<div class="a-head"><div><h1>Services & packages</h1><p class="soft">What people can book. Changes show on the website right away.</p></div><button type="button" class="btn btn-blue btn-sm" data-svcnew>Add new</button></div>
    ${list.map((s, i) => `<div class="panel svc-card"><div><b style="font-size:17px">${esc(s.title)}</b> ${s.kind === 'vip' ? '<span class="badge b-completed">Package</span>' : ''} ${s.active === false ? '<span class="badge b-cancelled">Hidden</span>' : ''}
      <div class="meta">${esc(s.titleAm || '')}</div><div class="meta">${s.min} min · ${s.price ? 'ETB ' + Number(s.price).toLocaleString('en-US') : 'Free'} · ${s.approve ? 'You approve each booking' : 'Booked instantly'}</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end"><button type="button" class="btn btn-xs" data-svcup="${esc(s.id)}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button><button type="button" class="btn btn-xs" data-svcdown="${esc(s.id)}" ${i === list.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button><button type="button" class="btn btn-line btn-xs" data-svcedit="${esc(s.id)}">Edit</button></div></div>`).join('')}`;
}
function blogHtml() {
  const list = AD.posts.slice().sort((a, b) => (b.created || 0) - (a.created || 0));
  return `<div class="a-head"><div><h1>Blog</h1><p class="soft">Write in English or Amharic. Published posts show on your website.</p></div><button type="button" class="btn btn-blue btn-sm" data-postnew>Write a new post</button></div>
    <div class="panel">${list.length ? `<div class="list">${list.map((p) => `<button type="button" class="row-item" data-postedit="${esc(p.id)}"><span class="av">${esc((p.title || '?')[0])}</span><span class="who"><b>${esc(p.title || 'Untitled')}</b><span>${p.created ? esc(fGr(dayOf(p.created), 'en')) : ''}</span></span><span class="badge ${p.published ? 'b-confirmed' : 'b-free'}">${p.published ? 'Published' : 'Draft'}</span></button>`).join('')}</div>` : '<p class="empty">No posts yet. Write your first one.</p>'}</div>`;
}
function editorHtml() {
  const e = AD.edit;
  if (e.type === 'svc') {
    const s = e.data;
    return `<div class="adm-fixed" data-closeov><div class="box"><div class="mhead"><b>${e.isNew ? 'New service or package' : 'Edit service'}</b><button type="button" class="iconbtn" data-closeov aria-label="Close">✕</button></div>
      <div class="form2"><label class="field"><span>Name (English)</span><input id="e-title" value="${esc(s.title)}"></label><label class="field"><span>Name (Amharic)</span><input id="e-titleAm" lang="am" value="${esc(s.titleAm || '')}"></label>
      <label class="field full"><span>Short description (English)</span><input id="e-desc" value="${esc(s.desc || '')}"></label><label class="field full"><span>Short description (Amharic)</span><input id="e-descAm" lang="am" value="${esc(s.descAm || '')}"></label>
      <label class="field"><span>Length</span><select id="e-min">${[30, 45, 60, 90, 120].map((n) => `<option value="${n}" ${s.min === n ? 'selected' : ''}>${n} minutes</option>`).join('')}</select></label>
      <label class="field"><span>Price in ETB (0 = free)</span><input id="e-price" type="number" min="0" step="50" value="${Number(s.price) || 0}"></label>
      <label class="field"><span>Type</span><select id="e-kind"><option value="session" ${s.kind !== 'vip' ? 'selected' : ''}>Session</option><option value="vip" ${s.kind === 'vip' ? 'selected' : ''}>VIP package</option></select></label></div>
      <label class="checkrow"><button type="button" class="switch" role="switch" aria-checked="${!!s.approve}" id="e-approve"></button>I approve each booking first</label>
      <label class="checkrow"><button type="button" class="switch" role="switch" aria-checked="${s.active !== false}" id="e-active"></button>Show on website</label>
      ${e.err ? `<p class="err">${esc(e.err)}</p>` : ''}
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between"><button type="button" class="btn btn-blue" data-svcsave>Save</button>${e.isNew ? '' : e.confirmDel ? '<span style="display:flex;gap:8px"><button type="button" class="btn btn-line btn-danger" data-svcdel>Yes, delete</button><button type="button" class="btn" data-nodel>Keep</button></span>' : '<button type="button" class="btn btn-danger" data-askdel>Delete</button>'}</div></div></div>`;
  }
  const p = e.data;
  return `<div class="adm-fixed" data-closeov><div class="box"><div class="mhead"><b>${e.isNew ? 'New post' : 'Edit post'}</b><button type="button" class="iconbtn" data-closeov aria-label="Close">✕</button></div>
    <label class="field"><span>Title</span><input id="p-title" value="${esc(p.title || '')}"></label>
    <div class="field"><span>Cover photo (optional)</span>${p.cover ? `<img class="coverprev" src="${esc(p.cover)}" alt="">` : ''}<div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn btn-line btn-sm" style="cursor:pointer">${p.cover ? 'Change photo' : 'Add photo'}<input type="file" accept="image/*" id="p-cover" hidden></label>${p.cover ? '<button type="button" class="btn btn-sm" data-nocover>Remove photo</button>' : ''}</div></div>
    <label class="field"><span>Text</span><textarea id="p-body" rows="12" placeholder="Write your post. Leave an empty line between paragraphs.">${esc(p.body || '')}</textarea></label>
    <label class="checkrow"><button type="button" class="switch" role="switch" aria-checked="${!!p.published}" id="p-pub"></button>Published (visible on the website)</label>
    ${e.err ? `<p class="err">${esc(e.err)}</p>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:space-between"><button type="button" class="btn btn-blue" data-postsave>Save</button>${e.isNew ? '' : e.confirmDel ? '<span style="display:flex;gap:8px"><button type="button" class="btn btn-line btn-danger" data-postdel>Yes, delete</button><button type="button" class="btn" data-nodel>Keep</button></span>' : '<button type="button" class="btn btn-danger" data-askdel>Delete</button>'}</div></div></div>`;
}
function readHours() {
  const s = AD.settings, hm = (v) => { const [h, m] = String(v || '0:0').split(':').map(Number); return h * 60 + m; };
  $$('[data-hs]', $('#admin')).forEach((el) => { const [d, i] = el.dataset.hs.split(':').map(Number); s.hours[d][i].s = hm(el.value); });
  $$('[data-he]', $('#admin')).forEach((el) => { const [d, i] = el.dataset.he.split(':').map(Number); s.hours[d][i].e = hm(el.value); });
  const n = $('#r-notice'); if (n) { s.notice = Math.max(0, Number(n.value) || 0); s.ahead = Math.max(1, Number($('#r-ahead').value) || 60); s.step = Number($('#r-step').value); s.buf = Number($('#r-buf').value); }
}
function readEditor() {
  const e = AD.edit; if (!e) return;
  if (e.type === 'svc') {
    const s = e.data; if (!$('#e-title')) return;
    Object.assign(s, { title: $('#e-title').value.trim(), titleAm: $('#e-titleAm').value.trim(), desc: $('#e-desc').value.trim(), descAm: $('#e-descAm').value.trim(), min: Number($('#e-min').value), price: Math.max(0, Number($('#e-price').value) || 0), kind: $('#e-kind').value });
  } else if ($('#p-title')) { e.data.title = $('#p-title').value; e.data.body = $('#p-body').value; }
}
async function resizeImage(file) {
  const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
  const w = Math.min(1200, img.naturalWidth), h = Math.round(img.naturalHeight * (w / img.naturalWidth));
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
  let q = 0.82, out = c.toDataURL('image/jpeg', q); while (out.length > 700000 && q > 0.4) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
  return out;
}
async function setStatus(b, st) {
  const prev = b.status;
  try {
    if (st === 'reopen') { await api.takeSlots(b.blocks); await api.patch('bookings', b.ref, { status: 'pending', freed: false }); b.status = 'pending'; b.freed = false; return toast('Reopened. The time is held again.'); }
    await api.patch('bookings', b.ref, { status: st, ...(st === 'cancelled' ? { freed: true } : {}) });
    if (st === 'cancelled') { await api.freeSlots(b.blocks).catch(() => {}); b.freed = true; }
    b.status = st;
    toast({ confirmed: 'Approved. Send them a WhatsApp confirmation.', completed: 'Marked as completed', cancelled: prev === 'pending' ? 'Declined. The time is free again.' : 'Cancelled. The time is free again.' }[st]);
  } catch (e) { console.error(e); toast(st === 'reopen' ? 'That time has been booked by someone else.' : 'Could not save. Check your internet.'); }
}
$('#admin').addEventListener('click', async (e) => {
  if (e.target.classList?.contains('adm-fixed')) { AD.open = null; AD.edit = null; return renderAdmin(); }
  const el = e.target.closest('button, [data-ref]'); if (!el) return;
  const d = el.dataset;
  if (d.closeov !== undefined && (e.target === el || el.tagName === 'BUTTON')) { AD.open = null; AD.edit = null; return renderAdmin(); }
  if ('signin' in d) { AD.err = ''; try { await api.signIn(); } catch (err) { AD.err = err?.code === 'auth/popup-blocked' ? 'Your browser blocked the sign-in window. Allow pop-ups and try again.' : err?.code === 'auth/popup-closed-by-user' ? '' : 'Sign-in failed. Try again.'; renderAdmin(); } return; }
  if ('signout' in d) { AD.loaded = false; await api.signOut(); return; }
  if (d.q && d.r) { e.stopPropagation(); const b = AD.bookings.find((x) => x.ref === d.r); el.disabled = true; await setStatus(b, d.q); return renderAdmin(); }
  if (d.page) { AD.page = d.page; if (d.flt) AD.flt = d.flt; AD.open = null; renderAdmin(); return scrollTo({ top: 0 }); }
  if (d.flt) { AD.flt = d.flt; return renderAdmin(); }
  if ('reload' in d) { AD.loaded = false; renderAdmin(); await loadAdmin(); return renderAdmin(); }
  if (d.ref && !d.q) { AD.open = d.ref; return renderAdmin(); }
  /* booking detail */
  const b = AD.bookings.find((x) => x.ref === AD.open);
  if (d.act && b) { el.disabled = true; await setStatus(b, d.act); return renderAdmin(); }
  if ('paid' in d && b) { try { await api.patch('bookings', b.ref, { pay: 'paid' }); b.pay = 'paid'; toast('Payment recorded'); } catch { toast('Could not save'); } return renderAdmin(); }
  if ('savelink' in d && b) { const v = $('#linkin').value.trim(); if (v && !/^https?:\/\//.test(v)) return toast('Links start with https://'); try { await api.patch('bookings', b.ref, { link: v }); b.link = v; toast('Link saved. The client sees it under My bookings.'); } catch { toast('Could not save'); } return renderAdmin(); }
  /* availability */
  const s = AD.settings;
  if (d.dayon) { readHours(); const k = Number(d.dayon); s.hours[k] = s.hours[k]?.length ? [] : [{ s: 540, e: 720 }, { s: 840, e: 1020 }]; return renderAdmin(); }
  if (d.hadd) { readHours(); const k = Number(d.hadd), w = s.hours[k], last = w[w.length - 1]; w.push({ s: Math.min(last ? last.e + 60 : 540, 1320), e: Math.min((last ? last.e + 60 : 540) + 120, 1439) }); return renderAdmin(); }
  if (d.hdel) { readHours(); const [k, i] = d.hdel.split(':').map(Number); s.hours[k].splice(i, 1); return renderAdmin(); }
  if ('offadd' in d) { readHours(); const v = $('#offin').value; if (v && !s.off.includes(v)) s.off.push(v); return renderAdmin(); }
  if (d.offdel) { readHours(); s.off = s.off.filter((x) => x !== d.offdel); return renderAdmin(); }
  if ('savehours' in d) {
    readHours();
    for (const k of Object.keys(s.hours)) for (const w of s.hours[k]) if (!(w.e > w.s)) return toast(`${WD[k]}: end time must be after start time`);
    try { await api.put('settings', 'main', s); toast('Availability saved'); } catch { toast('Could not save. Check your internet.'); } return;
  }
  /* services */
  if ('svcnew' in d) { AD.edit = { type: 'svc', isNew: true, data: { title: '', titleAm: '', desc: '', descAm: '', min: 60, price: 0, approve: true, active: true, kind: 'session', order: AD.services.length + 1 } }; return renderAdmin(); }
  if (d.svcedit) { AD.edit = { type: 'svc', data: { ...AD.services.find((x) => x.id === d.svcedit) } }; return renderAdmin(); }
  if (d.svcup || d.svcdown) {
    const list = AD.services.slice().sort((a, b2) => (a.order || 0) - (b2.order || 0)), i = list.findIndex((x) => x.id === (d.svcup || d.svcdown)), j = d.svcup ? i - 1 : i + 1;
    [list[i], list[j]] = [list[j], list[i]]; list.forEach((x, k) => (x.order = k + 1));
    try { await Promise.all(list.map((x) => { const { id, ref, ...rest } = x; return api.put('services', id, rest); })); } catch { toast('Could not save'); }
    return renderAdmin();
  }
  if (el.id === 'e-approve' || el.id === 'e-active' || el.id === 'p-pub') { readEditor(); const k = { 'e-approve': 'approve', 'e-active': 'active', 'p-pub': 'published' }[el.id]; AD.edit.data[k] = el.getAttribute('aria-checked') !== 'true'; return renderAdmin(); }
  if ('askdel' in d) { readEditor(); AD.edit.confirmDel = true; return renderAdmin(); }
  if ('nodel' in d) { AD.edit.confirmDel = false; return renderAdmin(); }
  if ('svcsave' in d) {
    readEditor(); const x = AD.edit.data; if (x.title.length < 2) { AD.edit.err = 'Add a name in English.'; return renderAdmin(); }
    const id = x.id || x.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) + '-' + Math.random().toString(36).slice(2, 6);
    const { id: _i, ref: _r, ...rest } = x; rest.active = x.active !== false; rest.approve = !!x.approve;
    try { await api.put('services', id, rest); const i = AD.services.findIndex((y) => y.id === id); if (i >= 0) AD.services[i] = { ...rest, id }; else AD.services.push({ ...rest, id }); AD.edit = null; toast('Saved'); } catch { AD.edit.err = 'Could not save. Check your internet.'; }
    return renderAdmin();
  }
  if ('svcdel' in d) { const id = AD.edit.data.id; try { await api.remove('services', id); AD.services = AD.services.filter((y) => y.id !== id); AD.edit = null; toast('Deleted'); } catch { toast('Could not delete'); } return renderAdmin(); }
  /* blog */
  if ('postnew' in d) { AD.edit = { type: 'post', isNew: true, data: { title: '', body: '', cover: '', published: true } }; return renderAdmin(); }
  if (d.postedit) { AD.edit = { type: 'post', data: { ...AD.posts.find((x) => x.id === d.postedit) } }; return renderAdmin(); }
  if ('nocover' in d) { readEditor(); AD.edit.data.cover = ''; return renderAdmin(); }
  if ('postsave' in d) {
    readEditor(); const p = AD.edit.data; if ((p.title || '').trim().length < 2) { AD.edit.err = 'Add a title.'; return renderAdmin(); }
    const id = p.id || 'p' + Date.now().toString(36);
    const data = { title: p.title.trim(), body: (p.body || '').trim(), cover: p.cover || '', published: !!p.published, created: p.created || Date.now(), updated: Date.now() };
    el.disabled = true;
    try { await api.put('posts', id, data); const i = AD.posts.findIndex((y) => y.id === id); if (i >= 0) AD.posts[i] = { ...data, id }; else AD.posts.push({ ...data, id }); AD.edit = null; toast(data.published ? 'Published' : 'Saved as draft'); } catch (err) { console.error(err); AD.edit.err = 'Could not save. If you added a big photo, try a smaller one.'; }
    return renderAdmin();
  }
  if ('postdel' in d) { const id = AD.edit.data.id; try { await api.remove('posts', id); AD.posts = AD.posts.filter((y) => y.id !== id); AD.edit = null; toast('Deleted'); } catch { toast('Could not delete'); } return renderAdmin(); }
});
$('#admin').addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.row-item[data-ref]')) { e.preventDefault(); e.target.click(); } });
$('#admin').addEventListener('change', async (e) => {
  if (e.target.id === 'p-cover' && e.target.files[0]) { readEditor(); try { AD.edit.data.cover = await resizeImage(e.target.files[0]); } catch { toast('Could not read that photo'); } renderAdmin(); }
});

/* ================= boot ================= */
(async function boot() {
  setLang(LANG);
  const ok = await connect();
  if (location.hash === '#admin') return enterAdmin();
  if (ok) { try { applyPublic(await api.publicData()); } catch (e) { console.warn(e); } paintPosts(); paintTopics(); }
})();
addEventListener('hashchange', () => { if (location.hash === '#admin') enterAdmin(); else if (!$('#admin').hidden) location.reload(); });
