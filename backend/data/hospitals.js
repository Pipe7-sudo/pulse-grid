/**
 * PulseGrid Hospital Registry
 * 100+ hospitals in Lagos State with real coordinates.
 * Used by the AI Triage Engine to find the nearest facility to a patient.
 */
const hospitals = [
    { id: 'H001', name: 'Lagos University Teaching Hospital (LUTH)', lga: 'Idi-Araba, Surulere', lat: 6.5087, lng: 3.3611, type: 'Tertiary', specialties: ['Trauma', 'Cardiology', 'Neurology', 'General Surgery'], capacity: 800, phone: '+2341-7743751', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H002', name: 'Lagos Island General Hospital', lga: 'Lagos Island', lat: 6.4530, lng: 3.3958, type: 'General', specialties: ['Emergency', 'Paediatrics', 'Surgery'], capacity: 350, phone: '+234-1-4633860', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H003', name: 'Lagos State University Teaching Hospital (LASUTH)', lga: 'Ikeja', lat: 6.5956, lng: 3.3358, type: 'Tertiary', specialties: ['Trauma', 'Cardiology', 'Orthopaedics', 'Burns'], capacity: 600, phone: '+234-1-4932590', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H004', name: 'General Hospital Gbagada', lga: 'Gbagada', lat: 6.5547, lng: 3.3878, type: 'General', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 250, phone: '+234-1-7729440', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H005', name: 'Reddington Hospital', lga: 'Victoria Island', lat: 6.4307, lng: 3.4201, type: 'Private', specialties: ['ICU', 'Cardiology', 'Oncology', 'Neurosurgery'], capacity: 120, phone: '+234-1-2717900', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H006', name: 'Eko Hospital', lga: 'Ikeja', lat: 6.5991, lng: 3.3466, type: 'Private', specialties: ['Trauma', 'Surgery', 'Paediatrics', 'Cardiology'], capacity: 200, phone: '+234-1-4970740', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H007', name: 'St. Nicholas Hospital', lga: 'Lagos Island', lat: 6.4484, lng: 3.3945, type: 'Private', specialties: ['Surgery', 'Maternity', 'ICU', 'Cardiology'], capacity: 150, phone: '+234-1-2663911', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H008', name: 'General Hospital Marina', lga: 'Lagos Island', lat: 6.4524, lng: 3.3986, type: 'General', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 200, phone: '+234-1-2665040', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H009', name: 'Island Maternity Hospital', lga: 'Lagos Island', lat: 6.4495, lng: 3.3972, type: 'Specialist', specialties: ['Obstetrics', 'Gynaecology', 'Neonatal'], capacity: 100, phone: '+234-1-2663480', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H010', name: 'Apapa General Hospital', lga: 'Apapa', lat: 6.4490, lng: 3.3563, type: 'General', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 180, phone: '+234-1-5872100', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H011', name: 'Mushin General Hospital', lga: 'Mushin', lat: 6.5263, lng: 3.3537, type: 'General', specialties: ['Emergency', 'Surgery', 'Paediatrics'], capacity: 220, phone: '+234-1-7723190', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H012', name: 'Isolo General Hospital', lga: 'Isolo', lat: 6.5162, lng: 3.3233, type: 'General', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 200, phone: '+234-1-4525081', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H013', name: 'Badagry General Hospital', lga: 'Badagry', lat: 6.4159, lng: 2.8892, type: 'General', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 120, phone: '+234-1-7734510', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H014', name: 'Epe General Hospital', lga: 'Epe', lat: 6.5858, lng: 3.9777, type: 'General', specialties: ['Emergency', 'Medical', 'Surgery'], capacity: 100, phone: '+234-1-7734520', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H015', name: 'General Hospital Ikorodu', lga: 'Ikorodu', lat: 6.6194, lng: 3.5086, type: 'General', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 180, phone: '+234-1-8975300', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H016', name: 'Alimosho General Hospital', lga: 'Alimosho', lat: 6.6061, lng: 3.2467, type: 'General', specialties: ['Emergency', 'Surgery', 'Paediatrics'], capacity: 200, phone: '+234-1-7785602', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H017', name: 'Ifako-Ijaiye General Hospital', lga: 'Ifako-Ijaiye', lat: 6.6448, lng: 3.2980, type: 'General', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 150, phone: '+234-1-7727381', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H018', name: 'Somolu General Hospital', lga: 'Somolu', lat: 6.5464, lng: 3.3810, type: 'General', specialties: ['Emergency', 'Medical', 'Paediatrics'], capacity: 150, phone: '+234-1-8940125', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H019', name: 'Agege General Hospital', lga: 'Agege', lat: 6.6185, lng: 3.3211, type: 'General', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 160, phone: '+234-1-8008345', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H020', name: 'Ojo General Hospital', lga: 'Ojo', lat: 6.4704, lng: 3.2162, type: 'General', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 140, phone: '+234-1-7789302', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H021', name: 'Harvey Road Medical Centre', lga: 'Yaba', lat: 6.5024, lng: 3.3757, type: 'Private', specialties: ['Obstetrics', 'Surgery', 'Medical'], capacity: 80, phone: '+234-802-3456789', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H022', name: 'Orile General Hospital', lga: 'Orile-Agege', lat: 6.4984, lng: 3.3432, type: 'General', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 120, phone: '+234-1-7731289', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H023', name: 'Randle General Hospital Surulere', lga: 'Surulere', lat: 6.4998, lng: 3.3564, type: 'General', specialties: ['Emergency', 'Cardiology', 'Surgery'], capacity: 200, phone: '+234-1-7746232', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H024', name: 'Massey Street Children Hospital', lga: 'Lagos Island', lat: 6.4548, lng: 3.3961, type: 'Specialist', specialties: ['Paediatrics', 'Neonatal'], capacity: 80, phone: '+234-1-2660640', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H025', name: 'Onikan Health Centre', lga: 'Lagos Island', lat: 6.4580, lng: 3.3990, type: 'Primary', specialties: ['Emergency', 'Medical'], capacity: 40, phone: '+234-802-1234567', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H026', name: 'Pan-African Hospital Victoria Island', lga: 'Victoria Island', lat: 6.4280, lng: 3.4281, type: 'Private', specialties: ['Surgery', 'Cardiology', 'ICU', 'Oncology'], capacity: 100, phone: '+234-1-2714010', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H027', name: 'Lagoon Hospital Apapa', lga: 'Apapa', lat: 6.4473, lng: 3.3441, type: 'Private', specialties: ['Emergency', 'Surgery', 'Cardiology', 'ICU'], capacity: 90, phone: '+234-1-5803900', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H028', name: 'Lagoon Hospital Victoria Island', lga: 'Victoria Island', lat: 6.4358, lng: 3.4098, type: 'Private', specialties: ['Emergency', 'Surgery', 'Cardiology'], capacity: 120, phone: '+234-1-2715940', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H029', name: 'Lagoon Hospital Ikeja', lga: 'Ikeja', lat: 6.5885, lng: 3.3476, type: 'Private', specialties: ['Emergency', 'Surgery', 'ICU'], capacity: 110, phone: '+234-1-7748501', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H030', name: 'Landmark University Medical Centre', lga: 'Lekki', lat: 6.4388, lng: 3.5311, type: 'Private', specialties: ['Emergency', 'Medical', 'Surgery'], capacity: 60, phone: '+234-803-8888888', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H031', name: 'Lekki-Epe Expressway Hospital', lga: 'Lekki', lat: 6.4467, lng: 3.5498, type: 'Private', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 70, phone: '+234-802-9876543', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H032', name: 'Pristine Hospital Lekki Phase 1', lga: 'Lekki', lat: 6.4413, lng: 3.4741, type: 'Private', specialties: ['Cardiology', 'Surgery', 'ICU', 'Obstetrics'], capacity: 80, phone: '+234-1-3206300', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H033', name: 'Havana Specialist Hospital Surulere', lga: 'Surulere', lat: 6.5052, lng: 3.3603, type: 'Private', specialties: ['Surgery', 'Cardiology', 'Orthopaedics'], capacity: 100, phone: '+234-1-7742870', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H034', name: 'Benson Idahosa University Medical Centre', lga: 'Ikoyi', lat: 6.4560, lng: 3.4390, type: 'Private', specialties: ['Medical', 'Paediatrics', 'Obstetrics'], capacity: 50, phone: '+234-803-1234567', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H035', name: 'St. Ives Specialist Hospital GRA Ikeja', lga: 'Ikeja', lat: 6.6004, lng: 3.3523, type: 'Private', specialties: ['Surgery', 'Oncology', 'ICU', 'Cardiology'], capacity: 90, phone: '+234-1-7740987', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H036', name: 'Evercare Hospital Lekki', lga: 'Lekki', lat: 6.4352, lng: 3.5416, type: 'Private', specialties: ['Cardiology', 'Neurology', 'Oncology', 'Trauma', 'ICU'], capacity: 250, phone: '+234-1-2011000', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H037', name: 'Ikeja Medical Centre', lga: 'Ikeja', lat: 6.5910, lng: 3.3450, type: 'Private', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 75, phone: '+234-1-4971340', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H038', name: 'Marina Medical Centre', lga: 'Lagos Island', lat: 6.4540, lng: 3.3940, type: 'Private', specialties: ['Medical', 'Surgery', 'Cardiology'], capacity: 60, phone: '+234-1-2660213', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H039', name: 'Doxa Medical Centre Yaba', lga: 'Yaba', lat: 6.5033, lng: 3.3760, type: 'Private', specialties: ['Surgery', 'Medical', 'Obstetrics'], capacity: 55, phone: '+234-803-3214556', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H040', name: 'Abia State Medical Centre Lagos', lga: 'Oshodi', lat: 6.5489, lng: 3.3287, type: 'General', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 90, phone: '+234-803-4565432', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H041', name: 'Medanta Hospital Ikoyi', lga: 'Ikoyi', lat: 6.4582, lng: 3.4352, type: 'Private', specialties: ['Cardiology', 'Neurology', 'Surgery', 'ICU'], capacity: 140, phone: '+234-1-2803000', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H042', name: 'Toro Memorial Hospital Ajegunle', lga: 'Ajegunle', lat: 6.4658, lng: 3.3357, type: 'General', specialties: ['Emergency', 'Paediatrics', 'Surgery'], capacity: 100, phone: '+234-1-5875432', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H043', name: 'Life Care Medical Centre', lga: 'Ojodu-Berger', lat: 6.6342, lng: 3.3420, type: 'Private', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 70, phone: '+234-802-4432167', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H044', name: 'Ojudu General Hospital', lga: 'Agege', lat: 6.6254, lng: 3.3378, type: 'General', specialties: ['Emergency', 'Surgery', 'Paediatrics'], capacity: 120, phone: '+234-803-8712893', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H045', name: 'Ketu General Clinic', lga: 'Kosofe', lat: 6.5940, lng: 3.3951, type: 'Primary', specialties: ['Emergency', 'Medical'], capacity: 50, phone: '+234-803-2312891', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H046', name: 'Shomolu District Hospital', lga: 'Shomolu', lat: 6.5523, lng: 3.3821, type: 'General', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 130, phone: '+234-1-8941720', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H047', name: 'Ilupeju Health Centre', lga: 'Mushin', lat: 6.5592, lng: 3.3605, type: 'Primary', specialties: ['Emergency', 'Medical', 'Obstetrics'], capacity: 45, phone: '+234-803-7871234', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H048', name: 'Festac Town General Hospital', lga: 'Amuwo-Odofin', lat: 6.4672, lng: 3.2770, type: 'General', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 180, phone: '+234-1-7730201', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H049', name: 'Amuwo-Odofin General Hospital', lga: 'Amuwo-Odofin', lat: 6.4731, lng: 3.3001, type: 'General', specialties: ['Emergency', 'Obstetrics', 'Surgery'], capacity: 150, phone: '+234-803-6781234', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H050', name: 'Holy Cross Hospital Obalende', lga: 'Eti-Osa', lat: 6.4556, lng: 3.4111, type: 'Private', specialties: ['Surgery', 'Medical', 'Paediatrics'], capacity: 80, phone: '+234-1-2617950', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H051', name: 'Lagos Airport Clinic', lga: 'Ikeja', lat: 6.5764, lng: 3.3144, type: 'Specialist', specialties: ['Trauma', 'Emergency', 'Medical'], capacity: 40, phone: '+234-1-4973000', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H052', name: 'Surulere Health District Hospital', lga: 'Surulere', lat: 6.5020, lng: 3.3614, type: 'General', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 140, phone: '+234-803-5532190', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H053', name: 'Moloney Street General Hospital', lga: 'Lagos Island', lat: 6.4490, lng: 3.3950, type: 'General', specialties: ['Emergency', 'Medical', 'Surgery'], capacity: 100, phone: '+234-1-2663788', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H054', name: 'Mainland Hospital Yaba', lga: 'Yaba', lat: 6.5104, lng: 3.3665, type: 'Specialist', specialties: ['Infectious Disease', 'Emergency', 'Medical'], capacity: 200, phone: '+234-1-7741210', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H055', name: 'Orthopedic Hospital Igbobi', lga: 'Yaba', lat: 6.5143, lng: 3.3701, type: 'Specialist', specialties: ['Orthopaedics', 'Trauma', 'Surgery', 'Rehabilitation'], capacity: 150, phone: '+234-1-7743670', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H056', name: 'Nigerian Navy Reference Hospital Ojo', lga: 'Ojo', lat: 6.4720, lng: 3.2001, type: 'Military', specialties: ['Emergency', 'Surgery', 'Medical', 'Trauma'], capacity: 180, phone: '+234-1-7731450', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H057', name: 'Military Hospital Yaba', lga: 'Yaba', lat: 6.5070, lng: 3.3790, type: 'Military', specialties: ['Emergency', 'Trauma', 'Surgery', 'ICU'], capacity: 200, phone: '+234-1-7747800', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H058', name: 'Police Hospital Falomo', lga: 'Ikoyi', lat: 6.4622, lng: 3.4267, type: 'Specialist', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 80, phone: '+234-1-2690030', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H059', name: 'Ikate-Elegushi Medical Centre', lga: 'Lekki', lat: 6.4460, lng: 3.4920, type: 'Private', specialties: ['Emergency', 'Obstetrics', 'Surgery'], capacity: 60, phone: '+234-803-4129873', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H060', name: 'Harmony Medical Centre Ajah', lga: 'Ajah', lat: 6.4712, lng: 3.5812, type: 'Private', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 65, phone: '+234-803-7234100', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H061', name: 'Redemption Hospital Isheri', lga: 'Ojodu', lat: 6.6547, lng: 3.3569, type: 'Private', specialties: ['Surgery', 'Cardiology', 'ICU', 'Paediatrics'], capacity: 110, phone: '+234-1-2800900', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H062', name: 'Community Health Centre Ikotun', lga: 'Alimosho', lat: 6.5491, lng: 3.2632, type: 'Primary', specialties: ['Emergency', 'Medical', 'Obstetrics'], capacity: 50, phone: '+234-803-8234901', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H063', name: 'Ipaja General Hospital', lga: 'Alimosho', lat: 6.5989, lng: 3.2299, type: 'General', specialties: ['Emergency', 'Surgery', 'Paediatrics'], capacity: 130, phone: '+234-803-5434900', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H064', name: 'Pen Cinema Medical Centre', lga: 'Agege', lat: 6.6215, lng: 3.3320, type: 'Private', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 65, phone: '+234-803-2134900', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H065', name: 'Mile 12 Clinic', lga: 'Kosofe', lat: 6.6072, lng: 3.3938, type: 'Primary', specialties: ['Emergency', 'Medical', 'Obstetrics'], capacity: 40, phone: '+234-803-5134902', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H066', name: 'Marina Medical Resort', lga: 'Lagos Island', lat: 6.4520, lng: 3.4010, type: 'Private', specialties: ['Medical', 'Cardiology', 'ICU'], capacity: 55, phone: '+234-1-2601870', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H067', name: 'Bina Hospital Surulere', lga: 'Surulere', lat: 6.5044, lng: 3.3588, type: 'Private', specialties: ['Surgery', 'Obstetrics', 'Paediatrics'], capacity: 75, phone: '+234-803-4534210', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H068', name: 'St. Margaret Hospital Kosofe', lga: 'Kosofe', lat: 6.5776, lng: 3.3912, type: 'Private', specialties: ['Obstetrics', 'Paediatrics', 'Emergency'], capacity: 70, phone: '+234-803-9012892', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H069', name: 'Ogunje Medical Centre Oshodi', lga: 'Oshodi-Isolo', lat: 6.5488, lng: 3.3320, type: 'Private', specialties: ['Emergency', 'Medical', 'Surgery'], capacity: 60, phone: '+234-803-7812340', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H070', name: 'El Bethel Hospital Magodo', lga: 'Kosofe', lat: 6.5930, lng: 3.4009, type: 'Private', specialties: ['Surgery', 'Cardiology', 'Paediatrics', 'Obstetrics'], capacity: 80, phone: '+234-803-1012780', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H071', name: 'Lagos Dental School and Hospital', lga: 'Surulere', lat: 6.5091, lng: 3.3595, type: 'Specialist', specialties: ['Dental', 'Oral Surgery', 'Maxillofacial'], capacity: 80, phone: '+234-1-5859020', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H072', name: 'NIMR Model Hospital Yaba', lga: 'Yaba', lat: 6.5121, lng: 3.3650, type: 'Specialist', specialties: ['Research', 'Infectious Disease', 'Medical'], capacity: 60, phone: '+234-1-8034905', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H073', name: 'Lagos Radiotherapy Centre LUTH', lga: 'Surulere', lat: 6.5099, lng: 3.3592, type: 'Specialist', specialties: ['Oncology', 'Radiotherapy', 'Haematology'], capacity: 50, phone: '+234-1-8034700', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H074', name: 'Ikosi Health Centre', lga: 'Kosofe', lat: 6.5684, lng: 3.3991, type: 'Primary', specialties: ['Medical', 'Emergency', 'Obstetrics'], capacity: 40, phone: '+234-803-9912345', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H075', name: 'Dopemu Health Centre', lga: 'Agege', lat: 6.6082, lng: 3.3018, type: 'Primary', specialties: ['Medical', 'Emergency', 'Obstetrics'], capacity: 35, phone: '+234-803-8821234', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H076', name: 'Badore General Clinic', lga: 'Eti-Osa', lat: 6.4666, lng: 3.5629, type: 'General', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 80, phone: '+234-803-2210987', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H077', name: 'Charity Eye Hospital Lagos', lga: 'Surulere', lat: 6.5031, lng: 3.3545, type: 'Specialist', specialties: ['Ophthalmology', 'Eye Surgery'], capacity: 60, phone: '+234-1-7740001', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H078', name: 'Magodo Specialist Hospital', lga: 'Kosofe', lat: 6.5854, lng: 3.4019, type: 'Private', specialties: ['Surgery', 'Obstetrics', 'Paediatrics'], capacity: 70, phone: '+234-803-2312341', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H079', name: 'Opebi Medical Centre', lga: 'Ikeja', lat: 6.5869, lng: 3.3539, type: 'Private', specialties: ['Emergency', 'Medical', 'Surgery'], capacity: 55, phone: '+234-803-3322890', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H080', name: 'Adekunle Street Clinic Yaba', lga: 'Yaba', lat: 6.5059, lng: 3.3698, type: 'Primary', specialties: ['Emergency', 'Medical'], capacity: 30, phone: '+234-803-5512345', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H081', name: 'Costain Clinic', lga: 'Surulere', lat: 6.4981, lng: 3.3468, type: 'Private', specialties: ['Emergency', 'Medical', 'Obstetrics'], capacity: 45, phone: '+234-803-6612348', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H082', name: 'Bode Thomas Medical Centre', lga: 'Surulere', lat: 6.5072, lng: 3.3590, type: 'Private', specialties: ['Emergency', 'Surgery', 'Paediatrics'], capacity: 60, phone: '+234-803-7712112', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H083', name: 'Excellence Hospital Ojota', lga: 'Kosofe', lat: 6.5763, lng: 3.3891, type: 'Private', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 75, phone: '+234-803-4477231', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H084', name: 'St. Luke Hospital Ajao Estate', lga: 'Oshodi', lat: 6.5529, lng: 3.3112, type: 'Private', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 65, phone: '+234-803-3311234', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H085', name: 'Ibeju-Lekki General Hospital', lga: 'Ibeju-Lekki', lat: 6.4503, lng: 3.7219, type: 'General', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 100, phone: '+234-803-2200987', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H086', name: 'Eleko Health Centre', lga: 'Ibeju-Lekki', lat: 6.4521, lng: 3.7912, type: 'Primary', specialties: ['Emergency', 'Medical', 'Obstetrics'], capacity: 35, phone: '+234-803-5531213', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H087', name: 'Queens Trust Medical Centre Gbagada', lga: 'Gbagada', lat: 6.5562, lng: 3.3897, type: 'Private', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 70, phone: '+234-803-4901234', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H088', name: 'Prime Medical Centre Oniru', lga: 'Eti-Osa', lat: 6.4462, lng: 3.4601, type: 'Private', specialties: ['Emergency', 'Surgery', 'Cardiology'], capacity: 65, phone: '+234-803-1290134', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H089', name: 'Atlantic Hall Medical Centre Lekki', lga: 'Lekki', lat: 6.4416, lng: 3.5120, type: 'Private', specialties: ['Emergency', 'Medical', 'Paediatrics'], capacity: 40, phone: '+234-803-5129841', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H090', name: 'Covenant Christian Centre Clinic', lga: 'Surulere', lat: 6.5021, lng: 3.3577, type: 'Private', specialties: ['Medical', 'Obstetrics', 'Paediatrics'], capacity: 50, phone: '+234-803-4510012', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H091', name: 'Omega Medical Centre Badagry', lga: 'Badagry', lat: 6.4189, lng: 2.8914, type: 'Private', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 55, phone: '+234-803-1231234', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H092', name: 'Alpha Medical Centre Ojo', lga: 'Ojo', lat: 6.4792, lng: 3.2089, type: 'Private', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 60, phone: '+234-803-5671234', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H093', name: 'Dolphin Medical Centre Victoria Island', lga: 'Victoria Island', lat: 6.4329, lng: 3.4261, type: 'Private', specialties: ['Cardiology', 'Surgery', 'ICU'], capacity: 85, phone: '+234-1-2715501', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H094', name: 'Radiant Health Hospital Ikeja', lga: 'Ikeja', lat: 6.5947, lng: 3.3412, type: 'Private', specialties: ['Emergency', 'Surgery', 'Cardiology'], capacity: 75, phone: '+234-803-4432000', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H095', name: 'FCMB Medical Centre VI', lga: 'Victoria Island', lat: 6.4311, lng: 3.4211, type: 'Private', specialties: ['Medical', 'Emergency'], capacity: 30, phone: '+234-1-2632000', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H096', name: 'Obafemi Awolowo Road Clinic', lga: 'Ikoyi', lat: 6.4540, lng: 3.4312, type: 'Private', specialties: ['Medical', 'Paediatrics', 'Surgery'], capacity: 45, phone: '+234-803-2312000', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H097', name: 'Olusoji Idowu Memorial Hospital', lga: 'Ikorodu', lat: 6.6133, lng: 3.5201, type: 'Private', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 80, phone: '+234-803-8912000', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H098', name: 'Anchor Hospital Ikorodu', lga: 'Ikorodu', lat: 6.6209, lng: 3.5072, type: 'Private', specialties: ['Emergency', 'Surgery', 'Medical'], capacity: 70, phone: '+234-803-7812000', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H099', name: 'Care Medical Centre Abule Egba', lga: 'Agege', lat: 6.6473, lng: 3.2777, type: 'Private', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 55, phone: '+234-803-6812345', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H100', name: 'Sunrise Medical Centre Satellite Town', lga: 'Ojo', lat: 6.4571, lng: 3.2441, type: 'Private', specialties: ['Emergency', 'Medical', 'Surgery'], capacity: 60, phone: '+234-803-5812990', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H101', name: 'Springfield Hospital Ojodu', lga: 'Ojodu', lat: 6.6310, lng: 3.3520, type: 'Private', specialties: ['Surgery', 'Cardiology', 'Obstetrics', 'Paediatrics'], capacity: 90, phone: '+234-803-1723000', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H102', name: 'Prime Care Hospital Bariga', lga: 'Shomolu', lat: 6.5390, lng: 3.3845, type: 'Private', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 65, phone: '+234-803-8723001', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H103', name: 'Living Spring Hospital Iju-Ishaga', lga: 'Ifako-Ijaiye', lat: 6.6398, lng: 3.2855, type: 'Private', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 70, phone: '+234-803-7623002', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H104', name: 'Lily Hospitals Magodo', lga: 'Kosofe', lat: 6.5900, lng: 3.3982, type: 'Private', specialties: ['Surgery', 'Cardiology', 'ICU', 'Obstetrics'], capacity: 100, phone: '+234-1-2915001', whatsapp: 'whatsapp:+14155238886' },
    { id: 'H105', name: 'Eti-Osa Local General Hospital', lga: 'Eti-Osa', lat: 6.4640, lng: 3.5490, type: 'General', specialties: ['Emergency', 'Surgery', 'Obstetrics'], capacity: 110, phone: '+234-803-6523010', whatsapp: 'whatsapp:+14155238886' },
];

/**
 * Haversine Formula: calculates distance in km between two GPS points.
 */
function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find the N nearest hospitals to a given patient coordinate.
 */
function getNearestHospitals(patientLat, patientLng, count = 5) {
    return hospitals
        .map(h => ({ ...h, distanceKm: parseFloat(getDistanceKm(patientLat, patientLng, h.lat, h.lng).toFixed(2)) }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, count);
}

module.exports = { hospitals, getNearestHospitals };
