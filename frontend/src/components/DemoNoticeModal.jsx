import React, { useState } from "react";
import "./DemoNoticeModal.css";

function DemoNoticeModal() {
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="demo-notice-overlay">
      <div
        className="demo-notice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-notice-title"
      >
        <div className="demo-notice-header">
          <h2 id="demo-notice-title">Demo Environment Notice</h2>
        </div>
        <div className="demo-notice-body">
          <p>
            Please be advised that you are currently accessing a{" "}
            <strong>demonstration version</strong> of this system. All data
            presented herein, including but not limited to records, figures, and
            institutional information, consists of{" "}
            <strong>simulated sample data</strong> generated solely for
            illustrative purposes.
          </p>
          <p>
            The information displayed does not reflect actual, current, or
            accurate records. It may be incomplete, outdated, or otherwise
            inconsistent with real-world data. This environment is intended
            exclusively for evaluation and testing purposes.
          </p>
          <p>
            Any actions taken within this demo environment will not affect live
            systems or produce real-world results.
          </p>
        </div>
        <div className="demo-notice-footer">
          <button className="demo-notice-btn" onClick={handleClose}>
            I Understand, Proceed to Demo
          </button>
        </div>
      </div>
    </div>
  );
}

export default DemoNoticeModal;
