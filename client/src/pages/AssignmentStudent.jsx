// src/pages/AssignmentDetailsStudent.jsx
import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getAssignment, getSubmissions, createSubmission, downloadSubmissionFile, openSubmissionFile } from "../services/submissionsApi";

const AssignmentStudent = () => {
  const { assignmentId } = useParams(); // לוודא ש-route הוא /assignments/:assignmentId
  const { user } = useContext(AuthContext);

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setErr("");
      try {
        // משיכת פרטי המשימה
        const a = await getAssignment(assignmentId);
        setAssignment(a);

        // משיכת ההגשות של הסטודנט הנוכחי בלבד
        const subs = await getSubmissions(assignmentId, { student: user._id });
        setSubmissions(subs);
      } catch (e) {
        setErr(e?.message || "שגיאה בטעינת הנתונים");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assignmentId, user._id]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return alert("נא לבחור קובץ לפני ההעלאה");

    try {
      await createSubmission(assignmentId, user._id, file);
      alert("הקובץ הועלה בהצלחה ✅");

      // רענון ההגשות
      const subs = await getSubmissions(assignmentId, { student: user._id });
      setSubmissions(subs);
      setFile(null);
    } catch (e) {
      console.error(e);
      alert("שגיאה בהעלאת הקובץ ❌");
    }
  };

  const handleView = (sub) => {
    if (!sub.fileUrl) return alert("אין קובץ להצגה");
    openSubmissionFile(sub._id);
  };

  const handleDownload = (sub) => {
    if (!sub.fileUrl) return alert("אין קובץ להורדה");
    downloadSubmissionFile(sub._id);
  };

  if (loading) return <p>טוען נתונים...</p>;
  if (err) return <p className="error">{err}</p>;
  if (!assignment) return <p>לא נמצאה משימה</p>;

  return (
    <div className="assignment-details">
      <h2>{assignment.title}</h2>
      <p>{assignment.description}</p>
      <p>תאריך הגשה: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "-"}</p>

      <h3>ההגשות שלי</h3>
      {submissions.length === 0 ? (
        <p>אין עדיין הגשות</p>
      ) : (
        submissions.map((sub) => (
          <div key={sub._id} className="submission">
            <p>
              קובץ: <button onClick={() => handleView(sub)}>צפה</button>{" "}
              <button onClick={() => handleDownload(sub)}>הורד</button>
            </p>
            <p>ציון: {sub.grade ?? "טרם נבדק"}</p>
            <p>הערות: {sub.feedback ?? "-"}</p>
          </div>
        ))
      )}

      <div className="upload-section">
        <h3>העלה הגשה חדשה</h3>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={!file}>העלה</button>
      </div>
    </div>
  );
};

export default AssignmentStudent;
