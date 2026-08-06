/* Конфіг Firebase для спільного лобі (необов'язково).
   Поки тут null — сайт працює в автономному режимі (localStorage),
   рівно як раніше: лобі показує лише вас, СТАРТ діє на цьому пристрої.

   Щоб увімкнути спільне лобі та синхронний старт:
   1. console.firebase.google.com → Create a project (Analytics не потрібен).
   2. Build → Realtime Database → Create Database (locked mode) → вкладка
      Rules → вставити правила з README → Publish.
   3. Project settings → Your apps → Web (</>) → скопіювати firebaseConfig.
   4. Вставити об'єкт нижче замість null (важливо, щоб був databaseURL):

   window.FIREBASE_CONFIG = {
     apiKey: "AIza…",
     authDomain: "….firebaseapp.com",
     databaseURL: "https://….europe-west1.firebasedatabase.app",
     projectId: "…",
     storageBucket: "….appspot.com",
     messagingSenderId: "…",
     appId: "…",
   };

   Цей конфіг публічний за дизайном Firebase — тримати його у відкритому
   коді нормально, доступ обмежують правила бази (Rules). */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyD0tnXqXUhN8nQlVyXY1kqWcqsQQ5lC89E",
  authDomain: "quezdetective003.firebaseapp.com",
  databaseURL: "https://quezdetective003-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quezdetective003",
  storageBucket: "quezdetective003.firebasestorage.app",
  messagingSenderId: "803161228251",
  appId: "1:803161228251:web:2f3cfb9cff2741c6e0ddfe",
};
