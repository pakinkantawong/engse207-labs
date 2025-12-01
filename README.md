**Overview**
- **Project**: : Simple Express + static frontend demo and SQL schema.
- **Location**: `server.js`, `package.json`, `public/`, `database/schema.sql`.

**การติดตั้ง (Setup)**
- **Prerequisites**: ติดตั้ง `node` (v14+) และ `npm` หรือ `pnpm`/`yarn` ที่เครื่องของคุณ
- **ติดตั้ง dependencies**: รันคำสั่งด้านล่างจากโฟลเดอร์โปรเจค (`/home/labadmin/engse207-labs`)

```bash
npm install
```

```bash
npm start
```

- ถ้าไม่มี ให้รันโดยตรง:

```bash
node server.js
```

- หลังจากรันแล้ว ให้เปิดเบราว์เซอร์ที่ `http://localhost:3000` (หรือพอร์ตที่แอปกำหนด)

**วิธีการทำงาน (How It Works)**
- **`server.js`**: เป็นจุดเริ่มต้นของเซิร์ฟเวอร์ (Express หรือ HTTP server) ที่รับคำขอ HTTP และเสิร์ฟไฟล์สเตติกจากโฟลเดอร์ `public/` และอาจมี API route เล็กๆ สำหรับการสื่อสารกับฐานข้อมูล
- **`public/`**: เก็บไฟล์ฝั่งไคลเอ็นต์ เช่น `index.html`, `app.js`, `style.css` — ไฟล์เหล่านี้ถูกส่งให้ผู้ใช้เมื่อเข้าถึงหน้าเว็บ
- **`database/schema.sql`**: ไฟล์ SQL สำหรับสร้างหรืออธิบายโครงสร้างฐานข้อมูล (ตาราง/คอลัมน์) — นำไปใช้กับ SQLite/MySQL/Postgres ตามที่คุณเลือก
- **`package.json`**: จัดการ dependencies และสคริปต์ที่ช่วยเริ่มโปรเจค

การไหลของงานทั่วไป:
- เบราว์เซอร์ร้องขอหน้าเว็บ -> `server.js` เสิร์ฟ `public/index.html` -> ไฟล์ฝั่งไคลเอ็นต์ (เช่น `app.js`) ทำคำขอ AJAX/Fetch ไปยัง API ที่ `server.js` จัดการ -> หากต้องการเก็บข้อมูล/อ่านข้อมูล เซิร์ฟเวอร์จะคิวรีฐานข้อมูลตาม `database/schema.sql` ที่คุณเตรียมไว้


**ตรวจสอบปัญหาเบื้องต้น (Troubleshooting)**
- ถ้าไม่ได้รับการตอบจาก `http://localhost:3000` ตรวจสอบว่าเซิร์ฟเวอร์ทำงานหรือไม่ (`node server.js` หรือ `npm start`) และตรวจสอบพอร์ตใน `server.js`
- ถ้า dependency หาย ให้รัน `npm install` อีกครั้ง
- หากมีปัญหาเกี่ยวกับฐานข้อมูล ให้เปิด `database/schema.sql` และตรวจสอบไวยากรณ์ SQL หรือรีสโตร์ฐานข้อมูลใหม่

**คำแนะนำถัดไป (Next Steps)**
- ทดสอบแอปด้วยการรันและเปิดหน้าเว็บในเบราว์เซอร์
- ถ้าต้องการให้ช่วย ผมสามารถ: เพิ่มตัวอย่าง `npm start` ใน `package.json`, ตั้งค่า database connection, หรือเขียนตัวอย่าง API route ให้ได้

---

