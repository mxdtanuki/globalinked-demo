import React from 'react';

const officials = [
  {
    name: "Felicitas C. Trinidad, MPsy, RPm, CHRA",
    role: "Director\nChief, Exchange and Study Program Section (concurrent)"
  },
  {
    name: "Zaila C. Decin, MP (Industrial)",
    role: "Chief, Partnership and Linkages Section\nChief, Special Internationalization Projects Section (concurrent)"
  },
  {
    name: "Rochelle S. Murao",
    role: "Administrative Aide VI"
  },
  {
    name: "Marianne P. Enguerra",
    role: "Emergency Administrative Aide III"
  }
];

export default function Officials() {
  return (
    <section className="officials-section">
      <div className="container">
        <h2>Officials and Staff</h2>
        <div className="officials-grid">
          {officials.map((person, idx) => (
            <div key={idx} className="official-card">
              <h4>{person.name}</h4>
              <p>{person.role.split('\n').map((line, i) => <div key={i}>{line}</div>)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
