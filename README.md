Course Manager – פרויקט פולסטאק MVC
אפליקציה END-TO-END לניהול קורסים, מטלות וסטודנטים. המערכת תומכת בשני תפקידי משתמש — מרצה וסטודנט.
המרצה יוצר ומנהל קורסים/מטלות וצופה בסטטיסטיקות ובהגשות; הסטודנט רואה קורסים אליהם נרשם ומגיש מטלות.
הפרויקט מדגים ארכיטקטורת MVC, אימות JWT, הרשאות לפי תפקיד, וממשק מודרני עם מודלי SweetAlert2.

יכולות עיקריות (TL;DR)
דשבורד מרצה עם חיפוש, מיון ו-limit, וקלפים עם ספירת מטלות לכל קורס

יצירת קורס במודל (SweetAlert2) + טוסטים להצלחות/שגיאות

עמוד פרטי קורס עם כותרת גדולה, תיאור קבוע למעלה, סטטיסטיקות צבעוניות, וטאבים: Assignments | Students

טעינות עצלות לטאבים, שלדי טעינה, הודעות ריק/שגיאה ו-Retry

Logout עם אישור במודל

הרשאות נאכפות בצד השרת: מרצה=בעלים, סטודנט=רשום

מה בנינו עד עכשיו
טכנולוגיות עיקריות
Frontend: React, React Router, Axios, React Icons, CSS רספונסיבי

State/Auth: React Context (login/register/logout), localStorage ל-token/user

Alerts/Modals: SweetAlert2 עם עטיפה ב-utils/alerts (confirm/toast/form)

Backend: Node.js + Express

DB: MongoDB + Mongoose

ארכיטקטורה: MVC – routes → controllers → services → models

אבטחה והרשאות: JWT (Bearer), authMiddleware, ו-requireRole('teacher')

מודלים עיקריים
User – { name, email, role }

Course – { title, description, createdBy, createdAt }

Enrollment – { studentId, courseId }

Assignment – { courseId, title, dueDate, … }

(בהמשך: Submission)

API קיים ועובד
GET /api/courses/list – רשימת קורסים “דקה” לפי תפקיד (מרצה/סטודנט)
פרמטרים: limit, q, sort (-createdAt|createdAt|title|-title)
מחזיר לכל קורס count = מספר מטלות (נספר בבת-אחת ב-service)

POST /api/courses – יצירת קורס (מרצה בלבד)

GET /api/courses/:id/details?include=stats – פרטי קורס לשני התפקידים
כולל permissions לפי תפקיד; stats אופציונלי: { assignments, students, upcoming }

צד לקוח – מה יש היום
AuthContext: login/register/logout + שמירת Token/User, useMemo לערך הקונטקסט

Login/Register: הרשמה עושה Auto-Login ומנתבת לדשבורד לפי תפקיד

TeacherDashboard

חיפוש, מיון, Limit, מצבי טעינה/שגיאה/ריק

Create Course במודל SweetAlert2, טוסטים להצלחות/שגיאות

Logout עם אישור במודל

Grid כרטיסי קורסים (כולל מספר מטלות)

CourseDetails

כותרת גדולה + תיאור ומידע כללי למעלה

סטטיסטיקות בשלושה צבעים (סגול/טורקיז/אמבר)

Tabs: Assignments | Students (Students למרצה בלבד)

טעינות עצלות, Skeleton/Spinner, הודעות ריק/שגיאה ו-Retry

עקרונות/תבניות שנקבעו
רשימות מחזירות פיילואדים דקים; פרטים מלאים ב-/details

הרחבות אופציונליות עם include=stats לשמירה על ביצועים

הרשאות בצד השרת (לא סומכים על הלקוח)

שגיאות בפורמט אחיד { error: "..." }, 404 אחרי הראוטים, ו-error handler בסוף

CORS עם רשימת מקורות מאושרים ו-Authorization בכותרות

מה הלאה
Assignments API לטאב (כולל submitted לכל מטלה)

Students API לטאב (רשימת נרשמים name/email)

פעולות ניהול בקורס: עריכה/מחיקה (מחיקה עם אישור במודל, מרצה בלבד)

דשבורד סטודנט + עמוד קורס מותאם להרשאות

הגשות וקבצים (Assignments + Submissions)

שיפורי UX/אבטחה (ולידציות נוספות, אולי Refresh Token)

הרצה (בקצרה)
Server: npm run dev (או node server.js)

Client: npm start

לוודא ש-BASE_URL בצד הלקוח מצביע ל-http://localhost:5000/api

משתמשים ב-SweetAlert2 לכל ההתראות/אישורים/טפסים (confirm/toast/form) דרך מודולים ב-utils/alerts, כדי לשמור אחידות עיצובית והתנהגותית בכל האפליקציה.