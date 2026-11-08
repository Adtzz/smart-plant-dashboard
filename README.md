# Smart Plant Dashboard V1

Frontend prototype untuk proyek penyiram tanaman otomatis berbasis ESP32.

## Menjalankan
1. Ekstrak folder proyek.
2. Buka folder `smart-plant-v1` di VS Code.
3. Jalankan `index.html` menggunakan ekstensi Live Server.

Alternatif: jalankan server lokal dari folder proyek:
```bash
python -m http.server 8000
```
Lalu buka `http://localhost:8000`.

## Catatan
- Data kelembapan, status pompa, dan interaksi masih simulasi.
- Bootstrap 5, Bootstrap Icons, Chart.js, dan Google Fonts dimuat melalui CDN sehingga membutuhkan internet.
- PWA membutuhkan localhost atau HTTPS untuk Service Worker. Untuk instalasi di HP melalui jaringan lokal, gunakan hosting HTTPS atau siapkan konfigurasi lokal yang sesuai.
- Belum ada komunikasi nyata dengan ESP32. Endpoint HTTP akan ditambahkan pada tahap integrasi.
- Mode Sensor/ Schedule/ Manual saat ini baru mengubah state antarmuka; jangan sambungkan ke pompa sungguhan sebelum logika keselamatan dan API diuji.
