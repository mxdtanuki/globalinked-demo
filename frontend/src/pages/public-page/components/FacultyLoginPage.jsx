import React, { useEffect } from "react"; 
import { Link, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./styles/FacultyLoginPage.css";

const FacultyLoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="faculty-login-wrapper">
      <Header />
      <main className="faculty-login-main" id="faculty-top">
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
          <div className="faculty-login-buttons">
            <Link to="/login" className="faculty-login-button">
              Proceed to Login
            </Link>
            <button 
              className="faculty-go-back-button"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FacultyLoginPage;
