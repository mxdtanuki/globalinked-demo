import React from "react";
import { Link } from "react-router-dom"; // Import Link
import Header from "./Header"; // Corrected import path
import Footer from "./Footer"; // Corrected import path
import "./styles/FacultyLoginPage.css"; // Corrected import path for its own CSS

const FacultyLoginPage = () => {
  return (
    <div className="faculty-login-wrapper">
      <Header />
      <main className="faculty-login-main">
        <div className="faculty-login-container">
          <h1 className="faculty-login-title">Globalinked</h1>
          <p className="faculty-login-message">
            This section is exclusively for registered faculty members of the{" "}
            <br />
            PUP OIA. To access the Globalinked system and its resources, <br />
            please proceed to the login page. <br />
          </p>
          <p className="faculty-login-instruction">
            If you are a faculty member, kindly log in using your official
            credentials.
          </p>
          <Link to="/login" className="faculty-login-button">
            Proceed to Login
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FacultyLoginPage;
