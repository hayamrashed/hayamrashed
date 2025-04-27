import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://bnmgxpkqjhhhccaroibc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWd4cGtxamhoaGNjYXJvaWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2ODM1ODksImV4cCI6MjA2MTI1OTU4OX0.tnIIQZWYr5NuZfjTWAdMgPYde6wTIFq08secQnqAnRs'; // استخدم مفتاح الـ API الخاص بك
const supabase = createClient(supabaseUrl, supabaseKey)

const searchBtn = document.getElementById('searchBtn')
const searchName = document.getElementById('searchName')
const patientsList = document.getElementById('patientsList')
const patientDetails = document.getElementById('patientDetails')
const patientImages = document.getElementById('patientImages')

searchBtn.addEventListener('click', async () => {
    const name = searchName.value.trim()
    if (!name) return

    const { data, error } = await supabase
        .from('immunohistochemistry_report')
        .select('*')
        .ilike('patient_name', `${name}%`)

    if (error) {
        console.error(error)
        return
    }

    patientsList.innerHTML = ''

    if (data.length === 0) {
        patientsList.innerHTML = '<p>لا يوجد مرضى بنفس هذا الاسم</p>'
        return
    }

    data.forEach(patient => {
        const card = document.createElement('div')
        card.className = 'patient-card'

        const photoUrl = patient.photo_url ? patient.photo_url : 'default-avatar.png'

        card.innerHTML = `
            <img src="${photoUrl}" alt="صورة المريض">
            <div class="patient-info">
                <p><strong>الاسم:</strong> ${patient.patient_name}</p>
                <button onclick="viewPatient('${patient.code}')">عرض الملف</button>
            </div>
        `

        patientsList.appendChild(card)
    })
})

window.viewPatient = async (code) => {
    const { data, error } = await supabase
        .from('immunohistochemistry_report')
        .select('*')
        .eq('code', code)
        .single()

    if (error || !data) {
        console.error(error)
        return
    }

    patientDetails.classList.remove('hidden')
    patientDetails.innerHTML = `
        <div id="patientDataToPrint">
            <h2>👤 ملف المريض</h2>
            <div class="field"><strong>الكود:</strong> ${data.code}</div>
            <div class="field"><strong>الاسم:</strong> ${data.patient_name}</div>
            <div class="field"><strong>الجنس:</strong> ${data.sex}</div>
            <div class="field"><strong>العمر:</strong> ${data.age}</div>
            <div class="field"><strong>تاريخ استلام العينة:</strong> ${data.specimen_received_date}</div>
            <div class="field"><strong>تاريخ إصدار التقرير:</strong> ${data.date_report_issued}</div>
            <div class="field"><strong>أُحيل بواسطة:</strong> ${data.referred_by}</div>
            <div class="field"><strong>البيانات السريرية:</strong> ${data.clinical_data}</div>
            <div class="field"><strong>العينة:</strong> ${data.specimen}</div>
            <div class="field"><strong>الإجراء:</strong> ${data.procedure}</div>
            <div class="field"><strong>النتائج:</strong> ${data.results}</div>
            <div class="field"><strong>التشخيص:</strong> ${data.diagnosis}</div>
        </div>

        <div class="action-buttons">
            <button onclick="printAsPDF()">تحميل كملف PDF</button>
            <button onclick="printAsImage()">تحميل كصورة</button>
            <button onclick="loadVisualImages('${data.code}')">عرض الصور البصرية 📷</button>
        </div>
    `
}

window.printAsPDF = () => {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    html2canvas(document.getElementById('patientDataToPrint')).then(canvas => {
        const imgData = canvas.toDataURL('image/png')
        const imgProps = doc.getImageProperties(imgData)
        const pdfWidth = doc.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        doc.save('patient_file.pdf')
    })
}

window.printAsImage = () => {
    html2canvas(document.getElementById('patientDataToPrint')).then(canvas => {
        const link = document.createElement('a')
        link.download = 'patient_file.png'
        link.href = canvas.toDataURL()
        link.click()
    })
}

window.loadVisualImages = async (code) => {
    const { data, error } = await supabase.storage.from('visual_data').list(`${code}/`, { limit: 100 })

    patientImages.innerHTML = ''
    if (error || !data.length) {
        patientImages.innerHTML = '<p>لا توجد صور بصرية متاحة</p>'
        return
    }

    data.forEach(file => {
        const { data: publicUrl } = supabase
            .storage
            .from('visual_data')
            .getPublicUrl(`${code}/${file.name}`)

        const img = document.createElement('img')
        img.src = publicUrl.publicUrl
        img.style.width = '100px'
        img.style.margin = '5px'
        patientImages.appendChild(img)
    })

    patientImages.classList.remove('hidden')
}
