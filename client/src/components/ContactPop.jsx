import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import './ContactPop.css';

// A real mailbox: letters, digits and . _ % + - before the @, then a domain with a 2+ letter ending.
const EMAIL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,24}$/;
// Common throwaway mail services. Blocking them keeps the inbox for real people.
const DISPOSABLE = ['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com', 'trashmail.com'];

export function validate({ name, email, message }) {
  const e = {};
  if (name.trim().length < 2) e.name = 'Tell me your name (at least 2 letters).';
  const mail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(mail)) e.email = 'That does not look like a real email address.';
  else if (DISPOSABLE.includes(mail.split('@')[1])) e.email = 'Please use a permanent email, so I can reply.';
  if (message.trim().length < 10) e.message = 'Write a few more words (at least 10 characters).';
  return e;
}

// Small cartoon popup: pops in with a bounce, the cross spins on hover, and it closes itself after sending.
export default function ContactPop({ onClose }) {
  const boxRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [serverMsg, setServerMsg] = useState('');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cpop__box', { scale: 0.55, rotate: -6, opacity: 0, duration: 0.7, ease: 'back.out(1.6)' });
      gsap.from('.cpop__field', { y: 24, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out', delay: 0.15 });
      gsap.from('.cpop__blob', { scale: 0, duration: 0.9, ease: 'elastic.out(1, 0.6)', stagger: 0.1 });
    }, boxRef);
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    gsap.to(boxRef.current, { scale: 0.7, opacity: 0, rotate: 4, duration: 0.3, ease: 'power2.in', onComplete: onClose });
  };

  const change = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const eMap = validate(form);
    setErrors(eMap);
    if (Object.keys(eMap).length) {
      gsap.fromTo('.cpop__box', { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.25)' });
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), message: form.message.trim() }),
      });
      // Only trust a real JSON answer from the API. A static host would send HTML back with a 200.
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const data = isJson ? await res.json() : {};
      if (!isJson) throw new Error('Message service is offline right now. Please email me directly.');
      if (!res.ok) throw new Error(data.message || 'Message could not be sent. Please try again.');
      setStatus('sent');
      setServerMsg('Got it. I will reply soon.');
      setTimeout(close, 1400);
    } catch (err) {
      setStatus('error');
      setServerMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  return createPortal(
    <div className="cpop" role="dialog" aria-modal="true" aria-label="Send me a message" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="cpop__box" ref={boxRef}>
        <span className="cpop__blob cpop__blob--a" aria-hidden="true" />
        <button type="button" className="cpop__x" onClick={close} aria-label="Close">
          <span aria-hidden="true">✕</span>
        </button>

        <p className="cpop__eyebrow cpop__field">Say hi</p>
        <h3 className="cpop__title cpop__field">Send a message</h3>

        <form className="cpop__form" onSubmit={submit} noValidate>
          <label className="cpop__field">
            <span>Name</span>
            <input value={form.name} onChange={change('name')} placeholder="Your name" autoComplete="name" />
            {errors.name && <em>{errors.name}</em>}
          </label>
          <label className="cpop__field">
            <span>Email</span>
            <input value={form.email} onChange={change('email')} placeholder="you@example.com" inputMode="email" autoComplete="email" />
            {errors.email && <em>{errors.email}</em>}
          </label>
          <label className="cpop__field">
            <span>Message</span>
            <textarea rows={4} value={form.message} onChange={change('message')} placeholder="What do you want to build?" />
            {errors.message && <em>{errors.message}</em>}
          </label>

          <p className="cpop__note cpop__field">Fastest reply? Email me directly, I read those first.</p>

          <button type="submit" className={`cpop__send cpop__field cpop__send--${status}`} disabled={status === 'sending' || status === 'sent'}>
            {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent ✓' : 'Send message'}
          </button>
          {serverMsg && <p className={`cpop__status cpop__status--${status}`} role="status">{serverMsg}</p>}
        </form>
      </div>
    </div>,
    document.body
  );
}
