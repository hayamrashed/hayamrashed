const supabaseUrl = "https://bnmgxpkqjhhhccaroibc.supabase.co";
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWd4cGtxamhoaGNjYXJvaWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1ODksImV4cCI6MjA2MTI1OTU4OX0.tnIIQZWYr5NuZfjTWAdMgPYde6wTIFq08secQnqAnRs'; // استخدم مفتاح الـ API الخاص بك
const tableName = "immunohistochemistry_report";
const bucketName = "photo";

const params = new URLSearchParams(window.location.search);
const patientCode = params.get("code");

const fields = [
  "patient_name",
  "age",
  "sex",
  "specimen_received_date",
  "date_report_issued",
  "referred_by",
  "clinical_data",
  "specimen",
  "procedure",
  "results",
  "diagnosis",
  "code",
];

async function loadPatient() {
  const { data, error } = await fetchPatientByCode(patientCode);

  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    alert("لا توجد بيانات للمريض.");
    return;
  }

  fillPatientData(data[0]);
}

async function fetchPatientByCode(code) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?code=eq.${code}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });
  const data = await response.json();
  return { data };
}

function fillPatientData(patient) {
  document.getElementById("patient_name").innerText = patient.patient_name || "";
  document.getElementById("age").innerText = patient.age || "";
  document.getElementById("sex").innerText = patient.sex || "";
  document.getElementById("specimen_received_date").innerText = patient.specimen_received_date || "";
  document.getElementById("date_report_issued").innerText = patient.date_report_issued || "";
  document.getElementById("referred_by").innerText = patient.referred_by || "";
  document.getElementById("clinical_data").innerText = patient.clinical_data || "";
  document.getElementById("specimen").innerText = patient.specimen || "";
  document.getElementById("procedure").innerText = patient.procedure || "";
  
  document.getElementById("results").innerHTML = (patient.results || "")
    .split("\n").map(line => `<li>${line.trim()}</li>`).join("");

  document.getElementById("diagnosis").innerHTML = (patient.diagnosis || "")
    .split("\n").map(line => `<li>${line.trim()}</li>`).join("");

  document.getElementById("code").innerText = patient.code || "";
}

function printReport() {
  var content = document.getElementById('patientReport').innerHTML;
  var reportUrl = window.location.href; // رابط التقرير الحالي

  var printWindow = window.open('', '', 'height=800,width=800');

  printWindow.document.write(`
    <html>
      <head>
        <title>Patient Report</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            color: #2E5C20; 
            margin: 20px; 
          }
          .report-container { 
            width: 100%; 
          }
          .info-row, .info-column { 
            display: block; 
            margin-bottom: 15px; 
          }
          .info-row div, .info-column div { 
            margin-bottom: 10px; 
          }
          ul { 
            margin-left: 20px; 
          }
          hr { 
            margin: 30px 0; 
            border: 0; 
            border-top: 1px solid #ccc; 
          }
          .centered { 
            text-align: center; 
            margin-bottom: 20px; 
          }
          .bold-title { 
            font-weight: bold; 
            font-size: 16px; 
            color: #000000; 
            margin-bottom: 5px; 
          }
          h3.centered { 
            color: #3B4A6B; 
          }
          /* تعديل الباركود والتوقيع ليبقوا صغيرين ومترتبين */
          .barcode-signature-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            page-break-inside: avoid; /* مهم جدا عشان ما ينكسرش بين الصفحات */
          }
          #barcode {
            width: 80px;
            height: 80px;
          }
          .signature {
            font-weight: bold;
            font-size: 10px;
            color: #000;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          ${content}
          <div class="barcode-signature-container">
            <svg id="barcode"></svg>
            <div class="signature">
              PROF - DR HAYAM RASHED
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            JsBarcode("#barcode", "${reportUrl}", {
              format: "CODE128",
              lineColor: "#000",
              width: 1,  // تصغير الخط
              height: 40, // تقليل الارتفاع
              displayValue: false, // اخفاء الرقم تحت الباركود
              margin: 0
            });
          }
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
}

 


function saveAsImage() {
  import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js').then(() => {
    const patientReport = document.getElementById("patientReport");
    html2canvas(patientReport).then(canvas => {
      const link = document.createElement("a");
      link.download = "patient-report.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  });
}

async function loadVisualPhotos() {
  const photosSection = document.getElementById("photosSection");
  photosSection.innerHTML = "";

  const { data, error } = await listPhotos(patientCode);

  if (error || !data || data.length === 0) {
    photosSection.innerHTML = "<p>لا توجد صور إضافية.</p>";
    return;
  }

  data.forEach(photo => {
    const img = document.createElement("img");
    img.src = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${patientCode}/${photo.name}`;
    photosSection.appendChild(img);
  });
}

async function listPhotos(folder) {
  const { data, error } = await supabase
    .storage
    .from(bucketName)
    .list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    console.error('Error loading photos:', error.message);
    return { error: true };
  }
  
  return { data };
}


loadPatient();
function generateAndDownloadQR() {
  const reportUrl = window.location.href; // رابط التقرير الحالي

  // إنشاء عنصر مؤقت
  const tempDiv = document.createElement("div");
  document.body.appendChild(tempDiv);

  // إنشاء كود QR داخله
  const qr = new QRCode(tempDiv, {
    text: reportUrl,
    width: 256,
    height: 256,
  });

  // ننتظر شويه لما يتولد
  setTimeout(() => {
    const qrImg = tempDiv.querySelector("img");

    if (qrImg) {
      const link = document.createElement('a');
      link.href = qrImg.src;
      link.download = 'report-qr-code.png';
      link.click();
    }

    // تنظيف العنصر بعد التحميل
    document.body.removeChild(tempDiv);
  }, 500); // 0.5 ثانية انتظار
}
