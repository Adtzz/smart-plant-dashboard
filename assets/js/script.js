// Import koneksi Firebase
import { db } from "./firebase.js";

// Import fungsi Realtime Database
import {
    ref,
    set,
    onValue
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";

/* Smart Plant Dashboard V1
 * Saat ini menggunakan data simulasi. Integrasi ESP32 akan mengganti fungsi demo
 * dengan pemanggilan HTTP API pada tahap berikutnya.
 */
const state = { moisture: 42, pumpOn: false, mode: 'sensor', threshold: 35, interval: 5, duration: 5 };
const $ = (id) => document.getElementById(id);
const toastEl = $('appToast');
const appToast = window.bootstrap ? new bootstrap.Toast(toastEl, { delay: 2600 }) : null;

function notify(message) {
  $('toastMessage').textContent = message;
  if (appToast) appToast.show();
}
function updateTime() {
  $('lastUpdate').textContent = new Date().toLocaleTimeString('id-ID');
  $('todayLabel').textContent = new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).toUpperCase();
}
function moistureLabel(value) {
  if (value < state.threshold) return ['Perlu disiram', 'tag-warning'];
  if (value < 65) return ['Cukup lembap', 'tag-neutral'];
  return ['Tanah basah', 'tag-neutral'];
}
function render() {
  const value = state.moisture;
  $('moistureValue').textContent = value;
  $('monitorMoisture').textContent = value;
  $('moistureBar').style.width = `${value}%`;
  $('monitorMoistureBar').style.width = `${value}%`;
  const [label, tagClass] = moistureLabel(value);
  $('moistureCondition').textContent = label;
  $('moistureCondition').className = `metric-tag ${tagClass}`;
  $('pumpValue').textContent = state.pumpOn ? 'ON' : 'OFF';
  $('monitorPumpValue').textContent = state.pumpOn ? 'ON' : 'OFF';
  $('pumpBadge').textContent = state.pumpOn ? 'Menyiram' : 'Standby';
  $('pumpBadge').className = `metric-tag ${state.pumpOn ? 'tag-warning' : 'tag-neutral'}`;
  $('monitorPumpBadge').textContent = state.pumpOn ? 'Menyiram' : 'Standby';
  $('monitorPumpBadge').className = `metric-tag ${state.pumpOn ? 'tag-warning' : 'tag-neutral'}`;
  $('pumpDescription').textContent = state.pumpOn ? 'Pompa sedang aktif (simulasi).' : 'Pompa tidak sedang menyiram.';
  $('monitorPumpDescription').textContent = state.pumpOn ? 'Pompa sedang aktif (simulasi).' : 'Pompa tidak sedang menyiram.';
  $('manualPumpState').textContent = state.pumpOn ? 'Pompa ON' : 'Pompa OFF';
  $('pumpToggle').classList.toggle('is-on', state.pumpOn);
  $('pumpToggle').setAttribute('aria-pressed', String(state.pumpOn));
  $('pumpToggle').innerHTML = `<i class="bi ${state.pumpOn ? 'bi-power' : 'bi-power'}"></i>`;
  $('thresholdSummary').textContent = `${state.threshold}%`;
  $('intervalSummary').textContent = `${state.interval} jam`;
  $('durationSummary').textContent = `${state.duration} detik`;
  $('controlThreshold').textContent = `${state.threshold}%`;
  $('controlInterval').textContent = `${state.interval} jam`;
  $('controlDuration').textContent = `${state.duration} detik`;
  $('activeModeSummary').textContent = modeLabel(state.mode);
  $('modeName').textContent = `${modeLabel(state.mode)} Mode`;
  $('modeDescription').textContent = modeDescription(state.mode);
  $('summaryModeIcon').className = `bi ${modeIcon(state.mode)}`;
  $('pumpToggle').disabled = state.mode !== 'manual';
  $('manualPumpHint').textContent = state.mode === 'manual' ? 'Tekan tombol untuk mengubah status pompa.' : 'Pilih mode Manual untuk mengaktifkan kontrol.';
  document.querySelectorAll('.mode-card').forEach(btn => btn.classList.toggle('selected', btn.dataset.mode === state.mode));
}
function modeLabel(mode) { return ({sensor:'Sensor', schedule:'Schedule', manual:'Manual'})[mode]; }
function modeDescription(mode) {
  return ({sensor:'Menggunakan pembacaan sensor kelembapan.', schedule:'Penyiraman berjalan berdasarkan interval waktu.', manual:'Pompa dikendalikan langsung oleh pengguna.'})[mode];
}
function modeIcon(mode) { return ({sensor:'bi-moisture', schedule:'bi-clock-history', manual:'bi-hand-index-thumb'})[mode]; }

// Navigasi halaman tunggal
function showSection(section) {
  document.querySelectorAll('.page-section').forEach(el => el.classList.toggle('active-section', el.id === section));
  document.querySelectorAll('[data-section]').forEach(el => el.classList.toggle('active', el.dataset.section === section));
  $('pageTitle').textContent = section.charAt(0).toUpperCase() + section.slice(1);
  window.location.hash = section;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('[data-section]').forEach(link => link.addEventListener('click', e => {
  e.preventDefault(); showSection(link.dataset.section);
}));
document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.go)));

document.querySelectorAll('.mode-card').forEach(btn => {
    btn.addEventListener('click', () => {
        state.mode = btn.dataset.mode;

        render();

        notify(`Mode ${modeLabel(state.mode)} dipilih.`);
    });
});
// $('pumpToggle').addEventListener('click', () => {
//   if (state.mode !== 'manual') return;
//   state.pumpOn = !state.pumpOn; render();
//   notify(state.pumpOn ? 'Pompa dinyalakan (simulasi).' : 'Pompa dimatikan (simulasi).');
// });

$('pumpToggle').addEventListener('click', () => {
    if (state.mode !== 'manual') return;

    setPumpCommand(!state.pumpOn);
});

function syncSettingsInputs() {
  $('thresholdInput').value = state.threshold;
  $('intervalInput').value = state.interval;
  $('durationInput').value = state.duration;
}
$('settingsForm').addEventListener('submit', e => {
  e.preventDefault();
  const threshold = Number($('thresholdInput').value);
  const interval = Number($('intervalInput').value);
  const duration = Number($('durationInput').value);
  if (![threshold, interval, duration].every(Number.isFinite) || threshold < 5 || threshold > 90 || interval < 1 || interval > 24 || duration < 1 || duration > 60) {
    notify('Periksa kembali nilai pengaturan.'); return;
  }
  state.threshold = threshold; state.interval = interval; state.duration = duration;
  render(); notify('Pengaturan demo berhasil disimpan.');
});
$('resetSettings').addEventListener('click', () => setTimeout(() => {
  $('thresholdInput').value = 35; $('intervalInput').value = 5; $('durationInput').value = 5;
}, 0));

// Grafik contoh menggunakan Chart.js
let moistureChart;
function initChart() {
  const canvas = $('moistureChart');
  if (!canvas || !window.Chart) return;
  moistureChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['07.00','09.00','11.00','13.00','15.00','17.00','19.00'],
      datasets: [{ label:'Kelembapan', data:[58,55,51,47,44,40,42], borderColor:'#4b9bba',
        backgroundColor:'rgba(75,155,186,.10)', fill:true, tension:.38, borderWidth:2.5,
        pointRadius:3, pointHoverRadius:5, pointBackgroundColor:'#fff', pointBorderColor:'#4b9bba' }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{displayColors:false, callbacks:{label:ctx=>` ${ctx.parsed.y}%`}} },
      scales:{
        x:{grid:{display:false},ticks:{color:'#9aa69d',font:{size:10}}},
        y:{min:0,max:100,grid:{color:'#eef2ee',drawBorder:false},ticks:{stepSize:25,color:'#9aa69d',font:{size:10},callback:v=>`${v}%`}}
      }
    }
  });
}

// Simulasi kecil agar tampilan terasa hidup. Tidak mewakili perilaku sensor sesungguhnya.
function demoTick() {
  if (state.mode === 'sensor' && !state.pumpOn && state.moisture < state.threshold) {
    state.pumpOn = true;
    setTimeout(() => { state.pumpOn = false; state.moisture = Math.min(75, state.moisture + 12); render(); }, state.duration * 1000);
  }
  render(); updateTime();
}
updateTime(); render(); syncSettingsInputs(); initChart();
setInterval(updateTime, 1000);

// PWA: service worker aktif bila situs dijalankan melalui localhost atau HTTPS.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(err => console.warn('Service worker gagal:', err)));
}


function updateTheme() {
    const hour = new Date().getHours();

    let theme;

    if (hour >= 5 && hour < 11) {
        theme = "morning";
    } else if (hour >= 11 && hour < 15) {
        theme = "afternoon";
    } else if (hour >= 15 && hour < 18) {
        theme = "evening";
    } else {
        theme = "night";
    }

    document.documentElement.setAttribute(
        "data-theme",
        theme
    );
}

// Jalankan saat website dibuka
updateTheme();

// Periksa kembali setiap satu menit
setInterval(updateTheme, 60000);


// ===================================
// SMART PLANT - FIREBASE REALTIME
// ===================================

// Referensi data sensor
const sensorRef = ref(db, "smartPlant/sensorData");

// Referensi status perangkat
const deviceRef = ref(db, "smartPlant/device");

// Membaca data sensor secara realtime
onValue(sensorRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) return;

    // Update Soil Moisture
    if (Number.isFinite(data.soilMoisture)) {
        state.moisture = data.soilMoisture;
        render();
    }

    // Update Temperature
    if (Number.isFinite(data.temperature)) {
        $("monitorTemperature").textContent = data.temperature;
    }

    // Update Humidity
    if (Number.isFinite(data.humidity)) {
        $("monitorHumidity").textContent = data.humidity;
    }

    // Update waktu pembacaan terakhir
    if (data.updatedAt) {
        $("lastUpdate").textContent =
            new Date(data.updatedAt).toLocaleTimeString("id-ID");
    }

    console.log("Data sensor diterima:", data);
});

// Membaca status perangkat
onValue(deviceRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) return;

    const isOnline = data.status === "online";

    $("deviceStatus").textContent = isOnline
        ? "Terhubung"
        : "Tidak terhubung";

    $("deviceBadge").textContent = isOnline
        ? "Online"
        : "Offline";

    $("apiStatus").textContent = "Terhubung ke Firebase";

    console.log("Status perangkat:", data.status);
});

const pumpRef = ref(db, "smartPlant/control/pumpCommand");

// Mengirim perintah pompa ke Firebase
async function setPumpCommand(value) {
    try {
        await set(pumpRef, value);

        notify(
            value
                ? "Perintah pompa ON dikirim."
                : "Perintah pompa OFF dikirim."
        );

    } catch (error) {
        console.error("Gagal mengirim perintah pompa:", error);
        notify("Gagal mengirim perintah pompa ke Firebase.");
    }
}

// Membaca status pompa dari Firebase
onValue(pumpRef, (snapshot) => {
    const pumpCommand = snapshot.val();

    if (typeof pumpCommand === "boolean") {
        state.pumpOn = pumpCommand;
        render();
    }

    console.log("Status pompa:", pumpCommand);
});