import './Faq.css';

// Plain questions and answers about the site owner. The same text is in the FAQPage schema in index.html.
export const FAQ_ITEMS = [
  {
    q: 'Who is Shivmani Singh?',
    a: 'Shivmani Singh is a full stack developer from Varanasi, India, and a BCA final-year student. He builds web applications with React, Node.js, Express and MongoDB.',
  },
  {
    q: 'What does Shivmani Singh build?',
    a: 'Full stack products, from the interface to the API and the database. Projects include JS Arena, a Java practice platform with an AI tutor; HackWave Dispatch, an emergency dispatch prototype; and JRC Inter College, an online school portal in Hindi and English.',
  },
  {
    q: 'Which technologies does Shivmani Singh use?',
    a: 'React, Vite, GSAP, Three.js, Node.js, Express, MongoDB, Mongoose, JavaScript and Java.',
  },
  {
    q: 'Where is Shivmani Singh based?',
    a: 'Varanasi, India.',
  },
  {
    q: 'Is Shivmani Singh available for work?',
    a: 'Yes. Shivmani Singh is open to internships, full-time roles and freelance work. Use the contact form in the footer of this site.',
  },
  {
    q: 'How can I contact Shivmani Singh?',
    a: 'Use the contact form in the footer of this site, or email anshs9333@gmail.com. Social links for LinkedIn, GitHub, LeetCode and X are also in the footer.',
  },
];

export default function Faq() {
  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <p className="faq__kick">[ FAQ ]</p>
      <h2 className="faq__title" id="faq-title">About Shivmani Singh</h2>
      <div className="faq__list">
        {FAQ_ITEMS.map((item) => (
          <details className="faq__item" key={item.q}>
            <summary className="faq__q">{item.q}</summary>
            <p className="faq__a">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
