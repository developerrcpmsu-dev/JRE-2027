/**
 * Default Data for JRE-2027
 */

export const DEFAULT_TEAM_MEMBERS = [
  // 1-3 MSU (มหาวิทยาลัยมหาสารคาม)
  {
    id: 'team-msu-1',
    name: 'นาย สมชาย รัตนวิชัย',
    role: 'ประธานโครงการและผู้อำนวยการฝึก',
    institution: 'ชมรมกู้ภัยราชพฤกษ์ มมส',
    tag: 'มมส 1',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'team-msu-2',
    name: 'นางสาว กัญญารัตน์ สุขสวัสดิ์',
    role: 'หัวหน้าฝ่ายพยาบาลและเวชศาสตร์ฉุกเฉิน',
    institution: 'ชมรมกู้ภัยราชพฤกษ์ มมส',
    tag: 'มมส 2',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'team-msu-3',
    name: 'นาย ภัทรพล เจริญสุข',
    role: 'หัวหน้าชุดปฏิบัติการเคลื่อนที่เร็ว',
    institution: 'ชมรมกู้ภัยราชพฤกษ์ มมส',
    tag: 'มมส 3',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  // 4-7 KKU (มหาวิทยาลัยขอนแก่น)
  {
    id: 'team-kku-1',
    name: 'นาย อานนท์ วงศ์สว่าง',
    role: 'ผู้บัญชาการเหตุการณ์ร่วม (มข)',
    institution: 'อาสาสมัครปฏิบัติการพิเศษ มข',
    tag: 'มข 4',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'team-kku-2',
    name: 'นางสาว ณิชากร แก้วพิลา',
    role: 'หัวหน้าฝ่ายสื่อสารและควบคุมข่ายวิทยุ',
    institution: 'อาสาสมัครสืบสวนพิเศษ มข',
    tag: 'มข 5',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'team-kku-3',
    name: 'นาย ศิริชัย พรหมมา',
    role: 'ผู้เชี่ยวชาญการกู้ภัยในที่อับอากาศ',
    institution: 'เครือข่ายกู้ภัย มข',
    tag: 'มข 6',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'team-kku-4',
    name: 'นาย ธนกฤต ทวีโชค',
    role: 'หัวหน้าฝ่ายสนับสนุนโลจิสติกส์และยานพาหนะ',
    institution: 'เครือข่ายกู้ภัย มข',
    tag: 'มข 7',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80'
  }
];

export const DEFAULT_SPEAKERS = [
  {
    id: 'spk-1',
    num: 1,
    name: 'รศ.ดร. นพดล เชี่ยวชาญ',
    title: 'แพทย์เฉพาะทางเวชศาสตร์ฉุกเฉิน (Emergency Medicine)',
    org: 'โรงพยาบาลศูนย์และอาจารย์แพทย์',
    topic: 'ระบบการแพทย์ฉุกเฉินและการคัดแยกผู้บาดเจ็บหมู่ (Triage)',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-2',
    num: 2,
    name: 'อ. สุรพล รวดเร็ว',
    title: 'ผู้เชี่ยวชาญการกู้ภัยทางน้ำและประดาน้ำสากล',
    org: 'สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)',
    topic: 'เทคนิคการช่วยเหลือทางน้ำและการดำน้ำค้นหาใต้น้ำ',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-3',
    num: 3,
    name: 'ว่าที่ ร.ต. สมเกียรติ ปลอดภัย',
    title: 'ครูฝึกสอนการใช้ระบบเชือกกู้ภัยในที่สูง (Rope Rescue)',
    org: 'ศูนย์ฝึกบรรเทาสาธารณภัยภาคตะวันออกเฉียงเหนือ',
    topic: 'Rope Rescue System & การลำเลียงทางดิ่ง',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-4',
    num: 4,
    name: 'นาง สาวิตรี ดีเยี่ยม',
    title: 'พยาบาลวิชาชีพชำนาญการพิเศษ กู้ชีพชั้นสูง (ACLS)',
    org: 'ศูนย์อุบัติเหตุและวิกฤตบำบัด',
    topic: 'การช่วยฟื้นคืนชีพขั้นสูงและการใช้เครื่อง AED ในที่เกิดเหตุ',
    photo: 'https://images.unsplash.com/photo-1594824813583-b26a63666d96?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-5',
    num: 5,
    name: 'นาย สมบูรณ์ พูนสุข',
    title: 'ผู้เชี่ยวชาญการตัดถ่างและกู้ภัยอุบัติเหตุทางถนน (Extrication)',
    org: 'มูลนิธิกู้ภัยสว่างและวิทยากรป้องกันภัยฝ่ายพลเรือน',
    topic: 'Vehicle Extrication การตัดถ่างซากยานพาหนะอย่างปลอดภัย',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-6',
    num: 6,
    name: 'พ.ต.ท. คุ้มครอง ประชา',
    title: 'ผู้บัญชาการค้นหาและกู้ภัยในเขตเมือง (USAR Specialist)',
    org: 'กองบัญชาการตำรวจตระเวนชายแดน',
    topic: 'ระบบบัญชาการในภาวะวิกฤต (Incident Command System - ICS)',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
  }
];

export const SCHEDULE_DAYS = [
  {
    dayNumber: 1,
    dateThai: "วันเสาร์ที่ 14 พฤศจิกายน 2569",
    theme: "วันแรก: ภาคทฤษฎีเข้มข้น ฐานปฏิบัติการ และการจำลองเหตุการณ์กลางคืน",
    events: [
      {
        time: "08:00 - 09:00",
        title: "ลงทะเบียนรายงานตัว และรับอุปกรณ์ป้ายชื่อประจำตัว",
        location: "ลานโถงหน้าอาคารพัฒนานิสิต กองกิจการนิสิต มมส",
        category: "reg",
        desc: "ตรวจสอบรายชื่อ รับป้ายชื่อประจำตัว สายคล้องคอ และสมุดคู่มือการฝึกอบรม"
      },
      {
        time: "09:00 - 10:00",
        title: "พิธีเปิดโครงการฝึกอบรมเชิงปฏิบัติการ JRE 2027",
        location: "ห้องประชุมใหญ่ ชั้น 2 อาคารบรมราชกุมารี มหาวิทยาลัยมหาสารคาม",
        category: "ceremony",
        desc: "โดยมี รองศาสตราจารย์ ดร.นิตยา วรรณกิตร์ รองอธิการบดีฝ่ายพัฒนานิสิตและภาพลักษณ์องค์กร มมส เป็นประธานในพิธี"
      },
      {
        time: "10:00 - 12:00",
        title: "บรรยายรวม: ระบบบัญชาการเหตุการณ์ (ICS) และการคัดแยกผู้บาดเจ็บหมู่ (Triage)",
        location: "ห้องประชุมใหญ่ ชั้น 2 อาคารบรมราชกุมารี",
        category: "lecture",
        desc: "วิทยากรโดย รศ.ดร. นพดล เชี่ยวชาญ และ พ.ต.ท. คุ้มครอง ประชา"
      },
      {
        time: "12:00 - 13:00",
        title: "พักรับประทานอาหารกลางวัน",
        location: "โรงอาหารกลาง (ตลาดน้อย มมส)",
        category: "break",
        desc: "บริการอาหารกล่องและเครื่องดื่มสำหรับผู้เข้าร่วมอบรมทุกคน"
      },
      {
        time: "13:00 - 17:00",
        title: "ฝึกภาคปฏิบัติหมุนเวียน 4 ฐานทักษะกู้ภัยฉุกเฉิน",
        location: "สนามหญ้าส่วนกลาง และ ลานฝึกอาคารพลศึกษา มมส",
        category: "drill",
        desc: "แบ่งเป็น 4 ฐาน: ฐาน 1 ดามกระดูกและปฐมพยาบาล (สนามหญ้าโซน A), ฐาน 2 เชือกกู้ภัยในที่สูง (หอฝึกจำลอง), ฐาน 3 กู้ชีพทางน้ำ (สระว่ายน้ำ มมส), ฐาน 4 เครื่องตัดถ่างอุบัติเหตุทางถนน (ลานจอดรถทดสอบ)"
      },
      {
        time: "17:00 - 18:30",
        title: "พักผ่อน รับประทานอาหารเย็น และเตรียมความพร้อมอุปกรณ์ประจำกาย",
        location: "โรงอาหารกลาง มมส",
        category: "break",
        desc: "ตรวจเช็คไฟฉาย, ถุงมือ, รองเท้าเซฟตี้ และวิทยุสื่อสาร"
      },
      {
        time: "19:00 - 22:30",
        title: "จำลองสถานการณ์เผชิญเหตุเวลากลางคืน (Night Mass Casualty Simulation)",
        location: "ลานกิจกรรมกลางแจ้งและป่าจำลองด้านหลังมหาวิทยาลัย",
        category: "night-drill",
        desc: "ซ้อมค้นหาผู้ประสบภัยในความมืด การลำเลียงผู้ป่วยในพื้นที่ยากลำบาก และการจัดตั้งศูนย์คัดแยกผู้บาดเจ็บ"
      },
      {
        time: "23:00 เป็นต้นไป",
        title: "สรุปผลการฝึกช่วงค่ำและแยกย้ายเข้าห้องพัก",
        location: "เรือนนอน 1 (ชาย) และ เรือนนอน 2 (หญิง) หอพักนิสิต มมส",
        category: "sleep",
        desc: "ผู้เข้าร่วมพักผ่อนตามห้องพักที่ได้รับการจัดสรรจากแอดมิน"
      }
    ]
  },
  {
    dayNumber: 2,
    dateThai: "วันอาทิตย์ที่ 15 พฤศจิกายน 2569",
    theme: "วันที่สอง: ซ้อมแผนเผชิญเหตุเต็มรูปแบบระดับเครือข่ายกู้ภัยนักศึกษาทั่วประเทศ และมอบวุฒิบัตร",
    events: [
      {
        time: "06:00 - 07:00",
        title: "รวมพลตรวจความพร้อม ยืดเหยียดร่างกาย และวิ่งปรับสภาพ",
        location: "ลู่วิ่งและสนามฟุตบอล 1 มหาวิทยาลัยมหาสารคาม",
        category: "drill",
        desc: "ตรวจนับยอดกำลังพล และเตรียมพร้อมกล้ามเนื้อก่อนเริ่มปฏิบัติการใหญ่"
      },
      {
        time: "07:00 - 08:30",
        title: "รับประทานอาหารเช้า",
        location: "โรงอาหารกลาง มมส",
        category: "break",
        desc: "เติมพลังงานด้วยอาหารเช้าและเครื่องดื่มร้อน"
      },
      {
        time: "09:00 - 12:00",
        title: "การฝึกซ้อมแผนเผชิญเหตุระดับเครือข่ายเต็มรูปแบบ (Full Scale Joint Exercise)",
        location: "พื้นที่จำลองเหตุการณ์ฉุกเฉินและอาคารฝึกกู้ภัยหลัง มมส",
        category: "drill",
        desc: "บูรณาการร่วมกันระหว่าง เครือข่ายกู้ภัยมหาวิทยาลัยทั่วประเทศ (มมส, มข, มก และสถาบันอุดมศึกษาทุกภาค) ในสถานการณ์เพลิงไหม้อาคารร่วมกับสารเคมีรั่วไหล"
      },
      {
        time: "12:00 - 13:30",
        title: "พักรับประทานอาหารกลางวัน",
        location: "โรงอาหารกลาง มมส",
        category: "break",
        desc: "พักฟื้นและชำระร่างกาย"
      },
      {
        time: "13:30 - 15:30",
        title: "After Action Review (AAR) สรุปบทเรียน และพิธีมอบวุฒิบัตร",
        location: "ห้องประชุมใหญ่ ชั้น 2 อาคารบรมราชกุมารี",
        category: "ceremony",
        desc: "วิพากษ์ผลการฝึกโดยคณะวิทยากร มอบวุฒิบัตรแก่ผู้ผ่านการฝึกอบรม และพิธีปิดโครงการ JRE 2027"
      },
      {
        time: "16:00",
        title: "ถ่ายภาพที่ระลึกเครือข่ายกู้ภัยนักศึกษา และเดินทางกลับโดยสวัสดิภาพ",
        location: "ลานหน้าอาคารบรมราชกุมารี มหาวิทยาลัยมหาสารคาม",
        category: "farewell",
        desc: "กระชับความสัมพันธ์เครือข่ายอาสาสมัครกู้ชีพกู้ภัยนักศึกษาทั่วประเทศ (ทุกภูมิภาค)"
      }
    ]
  }
];

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    title: '🚨 เตรียมพบกับ โครงการ Joint Response Exercise (JRE 2027) 🚨',
    content: `📢 ขออนุญาตประชาสัมพันธ์

🚨 เตรียมพบกับ โครงการ Joint Response Exercise (JRE 2027) 🚨

การฝึกผสมเพื่อเตรียมความพร้อมในการตอบโต้เหตุฉุกเฉินและสาธารณภัย โดยเปิดโอกาสให้ผู้เข้าร่วมได้ เรียนรู้จริง ฝึกจริง และจำลองสถานการณ์เสมือนจริง พร้อมเรียนรู้การทำงานร่วมกันระหว่างทีมและภาคีเครือข่าย

🤝 พิเศษ! การฝึกครั้งนี้เป็นการฝึกร่วมระหว่างภาคีเครือข่ายจากหลายมหาวิทยาลัย เพื่อแลกเปลี่ยนความรู้ ประสบการณ์ และฝึกการประสานงานร่วมกันในสถานการณ์จำลองที่ใกล้เคียงกับการปฏิบัติงานจริง

🗓 เปิดรับสมัครผู้เข้าร่วมโครงการ
วันที่ 15 ตุลาคม 2569

📍 กำหนดจัดกิจกรรม
วันที่ 14–15 พฤศจิกายน 2569

💰 ค่าลงทะเบียนเข้าร่วมโครงการ
650 บาท / ท่าน

ค่าลงทะเบียนประกอบด้วย
✅ เสื้อโครงการ
✅ อาหารและอาหารว่าง
✅ เกียรติบัตรผ่านการเข้าร่วมโครงการ
(โดยมีการรับรองการฝึกจากสำนักงานป้องกันและบรรเทาสาธารณภัยจังหวัดมหาสารคาม)

⚠️ รับสมัครจำนวนจำกัด ⚠️

หากคุณกำลังมองหาประสบการณ์การฝึกที่ได้ทั้ง ความรู้ ทักษะ และประสบการณ์จากการลงมือปฏิบัติจริง พร้อมเรียนรู้การทำงานร่วมกับเครือข่ายจากต่างมหาวิทยาลัย

ห้ามพลาด!

🚑🚒⛑️ แล้วพบกันใน
Joint Response Exercise (JRE 2027)
“เรียนรู้จริง • ฝึกจริง • ทำงานร่วมกันจริง”`,
    category: 'pr',
    pinned: true,
    action_url: 'https://jre-2027.vercel.app/register',
    action_label: 'สมัครเข้าร่วมโครงการ JRE 2027',
    created_at: '2026-10-02T21:00:00Z',
    images: [],
    pdf_url: '',
    pdf_name: ''
  },
  {
    id: 'ann-1',
    title: '📢 ประกาศแจ้งกำหนดการชำระค่าลงทะเบียนและอุปกรณ์ฝึกซ้อม JRE 2027',
    content: 'ขอให้ผู้สมัครที่ได้รับการยืนยันสิทธิ์ ดำเนินการชำระค่าลงทะเบียนเข้าร่วมโครงการ จำนวน 650 บาท (รวมเสื้อโครงการ อาหารและอาหารว่าง และเกียรติบัตรรับรองโดยสำนักงานป้องกันและบรรเทาสาธารณภัยจังหวัดมหาสารคาม) ภายในวันที่ 31 ตุลาคม 2569 เวลา 23:59 น. ผ่านบัญชีโครงการ ชมรมกู้ภัยราชพฤกษ์ ธนาคารกรุงไทย พร้อมส่งสลิปในระบบหรือกลุ่มไลน์',
    category: 'payment',
    pinned: true,
    action_url: 'https://line.me',
    action_label: 'ส่งหลักฐานการโอนเงิน',
    created_at: '2026-10-01T10:00:00Z'
  },
  {
    id: 'ann-2',
    title: '💬 ประกาศลิงก์เข้าร่วม Line OpenChat ประจำรุ่น JRE 2027',
    content: 'สำหรับผู้สมัครทุกคน โปรดเข้าร่วมกลุ่ม Line OpenChat "JRE 2027 เครือข่ายกู้ภัยนักศึกษาทั่วประเทศ (ทุกภูมิภาค)" เพื่อรับการแจ้งเตือนด่วน สรุปเอกสารการฝึก และประสานงานเรื่องการเดินทางและที่พัก',
    category: 'line_group',
    pinned: true,
    action_url: 'https://line.me',
    action_label: 'กดเพื่อเข้าร่วมกลุ่ม Line',
    created_at: '2026-10-01T11:00:00Z'
  },
  {
    id: 'ann-3',
    title: '📋 ประกาศคำสั่งโครงการและรายการอุปกรณ์ประจำกายที่ต้องจัดเตรียม',
    content: 'ผู้เข้าร่วมอบรมต้องจัดเตรียม: 1. กางเกงขายาวผ้าหนาสำหรับฝึก 2. รองเท้าหุ้มส้นหรือรองเท้าเซฟตี้ 3. ถุงมือผ้าหรือถุงมือหนัง 4. ไฟฉายส่องสว่างส่วนบุคคล 5. ยาประจำตัวและของใช้ส่วนตัวสำหรับพักค้างแรม 1 คืน',
    category: 'order',
    pinned: false,
    action_url: '',
    action_label: '',
    created_at: '2026-10-02T09:00:00Z'
  },
  {
    id: 'ann-4',
    title: '⚡ ประกาศการเปลี่ยนแปลงจุดรวมพลพิธีเปิด (Update)',
    content: 'แจ้งเปลี่ยนแปลงจุดรวมพลพิธีเปิดในวันที่ 7 พ.ย. 2569 จากเดิมโถงชั้น 1 ปรับเป็นห้องประชุมใหญ่ ชั้น 2 อาคารบรมราชกุมารี เพื่อความสะดวกรวดเร็วในการลงทะเบียนและรับฟังการบรรยาย',
    category: 'change',
    pinned: false,
    action_url: '',
    action_label: '',
    created_at: '2026-10-02T15:30:00Z'
  }
];

export const DEFAULT_FORMS_CONFIG = {
  pretest: {
    title: 'แบบทดสอบก่อนการฝึกอบรม (Pre-Test JRE 2027)',
    url: 'https://docs.google.com/forms',
    enabled: false,
    description: 'ประเมินความรู้พื้นฐานด้านการกู้ภัย การปฐมพยาบาล และระบบบัญชาการเหตุการณ์ก่อนเข้ารับการฝึก'
  },
  posttest: {
    title: 'แบบทดสอบหลังการฝึกอบรม (Post-Test JRE 2027)',
    url: 'https://docs.google.com/forms',
    enabled: false,
    description: 'ทดสอบวัดผลสัมฤทธิ์และทักษะความรู้หลังเสร็จสิ้นการฝึกปฏิบัติการจริง'
  },
  evaluation: {
    title: 'แบบประเมินความพึงพอใจโครงการ JRE 2027',
    url: 'https://docs.google.com/forms',
    enabled: false,
    description: 'โปรดร่วมให้คะแนนและข้อเสนอแนะเพื่อนำไปพัฒนาโครงการในรุ่นถัดไป'
  }
};

export const DEFAULT_PAYMENT_CONFIG = {
  fee_total: 650,
  bank_name: 'ธนาคารกรุงไทย',
  bank_account_number: '984-0-12345-6',
  bank_account_name: 'ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม',
  bank_promptpay: '098-765-4321',
  allow_installments: true,
  installment_round1_amount: 350,
  installment_round1_due: '15 ตุลาคม 2569 (วันเปิดรับสมัคร)',
  installment_round2_amount: 300,
  installment_round2_due: '1 หรือ 5 พฤศจิกายน 2569 (ตามที่ผู้ดูแลกำหนด)',
  notes: 'สามารถเลือกชำระเต็มจำนวน 650 บาท หรือขอทำเรื่องแบ่งจ่าย 2 งวดได้'
};

export const DEFAULT_MERCHANDISE_CONFIG = {
  google_form: {
    enabled: true,
    url: 'https://docs.google.com/forms',
    title: 'สั่งซื้อเสื้อ/กางเกงโครงการผ่าน Google Form (ช่องทางสำรอง)',
    description: 'กรณีระบบขัดข้องหรือไม่สะดวกสั่งซื้อผ่านเว็บ สามารถกรอกสั่งซื้อผ่าน Google Forms ได้ตลอด 24 ชม.'
  },
  payment: {
    bank_name: 'ธนาคารกรุงไทย',
    account_number: '984-0-12345-6',
    account_name: 'ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม',
    promptpay: '098-765-4321',
    note: 'กรุณาโอนเงินตามยอดที่ระบุและแนบหลักฐานสลิปโอนเงินทุกครั้ง'
  },
  products: [
    {
      id: 'prod_tshirt',
      name: 'เสื้อยืดที่ระลึก JRE 2027 (Official Rescue T-Shirt)',
      category: 'shirt',
      base_price: 250,
      description: 'เสื้อยืดสกรีนลายสัญลักษณ์ JRE 2027 และชมรมกู้ภัยราชพฤกษ์ มมส เนื้อผ้า Micro Polyester เกรดพรีเมียม แห้งไว ระบายอากาศยอดเยี่ยม เหมาะสำหรับฝึกภาคสนามและสวมใส่ทำกิจกรรม',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80'
      ],
      colors: ['สีกรมท่า (Navy Blue)', 'สีดำเข้ม (Midnight Black)', 'สีส้มกู้ภัย (Rescue Orange)'],
      sizes: [
        { name: 'S', chest: '36 นิ้ว', length: '26 นิ้ว', extra_price: 0 },
        { name: 'M', chest: '38 นิ้ว', length: '27 นิ้ว', extra_price: 0 },
        { name: 'L', chest: '40 นิ้ว', length: '28 นิ้ว', extra_price: 0 },
        { name: 'XL', chest: '42 นิ้ว', length: '29 นิ้ว', extra_price: 0 },
        { name: '2XL', chest: '44 นิ้ว', length: '30 นิ้ว', extra_price: 30, is_special: true },
        { name: '3XL', chest: '46 นิ้ว', length: '31 นิ้ว', extra_price: 50, is_special: true },
        { name: '4XL', chest: '48 นิ้ว', length: '32 นิ้ว', extra_price: 70, is_special: true },
        { name: '5XL', chest: '52 นิ้ว', length: '33 นิ้ว', extra_price: 100, is_special: true }
      ]
    },
    {
      id: 'prod_polo',
      name: 'เสื้อโปโลปฏิบัติการกู้ภัย JRE 2027 (Rescue Polo Shirt)',
      category: 'shirt',
      base_price: 350,
      description: 'เสื้อโปโลปกทอ ปักตราสัญลักษณ์กู้ภัยราชพฤกษ์อกซ้าย แขนติดแถบสะท้อนแสง 3M เพิ่มความปลอดภัยในเวลากลางคืน เนื้อผ้าทนทาน นุ่มใส่สบาย ระบายเหงื่อดีเยี่ยม',
      image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80'
      ],
      colors: ['สีกรมท่าปักทอง', 'สีดำปักเงิน'],
      sizes: [
        { name: 'S', chest: '38 นิ้ว', length: '26 นิ้ว', extra_price: 0 },
        { name: 'M', chest: '40 นิ้ว', length: '27 นิ้ว', extra_price: 0 },
        { name: 'L', chest: '42 นิ้ว', length: '28 นิ้ว', extra_price: 0 },
        { name: 'XL', chest: '44 นิ้ว', length: '29 นิ้ว', extra_price: 0 },
        { name: '2XL', chest: '46 นิ้ว', length: '30 นิ้ว', extra_price: 30, is_special: true },
        { name: '3XL', chest: '48 นิ้ว', length: '31 นิ้ว', extra_price: 50, is_special: true },
        { name: '4XL', chest: '50 นิ้ว', length: '32 นิ้ว', extra_price: 70, is_special: true }
      ]
    },
    {
      id: 'prod_pants_tactical',
      name: 'กางเกงฝึกยุทธวิธีกู้ภัย JRE Tactical Rescue Pants',
      category: 'pants',
      base_price: 490,
      description: 'กางเกงขายาวผ้าตาราง Ripstop กันละอองน้ำ กระเป๋าข้างยุทธวิธี 6 ช่อง เสริมความแข็งแรงบริเวณหัวเข่าและเป้ากางเกง ออกแบบเพื่อความคล่องตัวในการฝึกซ้อมกู้ภัย ลุยน้ำ ลุยป่า',
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80'
      ],
      colors: ['สีดำยุทธวิธี (Tactical Black)', 'สีกรมท่ากู้ภัย (Rescue Navy)', 'สีกากี (Khaki)'],
      sizes: [
        { name: 'S', waist: '28-30 นิ้ว', length: '39 นิ้ว', extra_price: 0 },
        { name: 'M', waist: '31-33 นิ้ว', length: '40 นิ้ว', extra_price: 0 },
        { name: 'L', waist: '34-36 นิ้ว', length: '41 นิ้ว', extra_price: 0 },
        { name: 'XL', waist: '37-39 นิ้ว', length: '42 นิ้ว', extra_price: 0 },
        { name: '2XL', waist: '40-42 นิ้ว', length: '43 นิ้ว', extra_price: 40, is_special: true },
        { name: '3XL', waist: '43-45 นิ้ว', length: '44 นิ้ว', extra_price: 60, is_special: true },
        { name: '4XL', waist: '46-48 นิ้ว', length: '45 นิ้ว', extra_price: 80, is_special: true }
      ]
    },
    {
      id: 'prod_shorts_training',
      name: 'กางเกงขาสั้นฝึกภาคสนาม JRE Training Shorts',
      category: 'pants',
      base_price: 250,
      description: 'กางเกงขาสั้นผ้าร่มระบายอากาศ มีกระเป๋าซิปข้าง 2 ฝั่ง และสายผูกเอว สำหรับการฝึกกิจกรรมทางน้ำ ปฐมพยาบาล หรือวิ่งออกกำลังกาย',
      image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80'
      ],
      colors: ['สีดำขอบส้ม', 'สีกรมท่าขอบขาว'],
      sizes: [
        { name: 'S', waist: '26-29 นิ้ว', extra_price: 0 },
        { name: 'M', waist: '30-32 นิ้ว', extra_price: 0 },
        { name: 'L', waist: '33-35 นิ้ว', extra_price: 0 },
        { name: 'XL', waist: '36-38 นิ้ว', extra_price: 0 },
        { name: '2XL', waist: '39-42 นิ้ว', extra_price: 30, is_special: true },
        { name: '3XL', waist: '43-46 นิ้ว', extra_price: 50, is_special: true }
      ]
    }
  ]
};

export const DEFAULT_MERCHANDISE_ORDERS = [
  {
    id: 'order_jre_01',
    order_number: 'JRE-SHIRT-78210',
    user_email: 'thanakorn.k@msu.ac.th',
    customer_name: 'ธนากรณ์ เกียรติอนันต์',
    customer_phone: '0812345678',
    pickup_method: 'pickup',
    shipping_address: '',
    items: [
      {
        product_id: 'prod_tshirt',
        product_name: 'เสื้อยืดที่ระลึก JRE 2027 (Official Rescue T-Shirt)',
        size: '2XL',
        color: 'สีกรมท่า (Navy Blue)',
        unit_price: 280,
        extra_price: 30,
        quantity: 1
      },
      {
        product_id: 'prod_shorts_training',
        product_name: 'กางเกงขาสั้นฝึกภาคสนาม JRE Training Shorts',
        size: 'L',
        color: 'สีดำขอบส้ม',
        unit_price: 250,
        extra_price: 0,
        quantity: 1
      }
    ],
    total_amount: 530,
    payment_status: 'paid_verified',
    slip_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    slip_uploaded_at: '2026-10-02T16:30:00Z',
    slip_admin_notes: 'ตรวจสอบยอดเงิน 530 บาท เข้าบัญชีกรุงไทยแล้ว',
    pickup_status: 'ready',
    pickup_at: null,
    pickup_by_admin: null,
    created_at: '2026-10-02T16:20:00Z'
  },
  {
    id: 'order_jre_02',
    order_number: 'JRE-SHIRT-78211',
    user_email: 'chutima.p@msu.ac.th',
    customer_name: 'ชุติมา พรประสิทธิ์',
    customer_phone: '0898765432',
    pickup_method: 'pickup',
    shipping_address: '',
    items: [
      {
        product_id: 'prod_polo',
        product_name: 'เสื้อโปโลปฏิบัติการกู้ภัย JRE 2027 (Rescue Polo Shirt)',
        size: 'M',
        color: 'สีกรมท่าปักทอง',
        unit_price: 350,
        extra_price: 0,
        quantity: 1
      }
    ],
    total_amount: 350,
    payment_status: 'pending_verification',
    slip_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    slip_uploaded_at: '2026-10-02T17:15:00Z',
    slip_admin_notes: '',
    pickup_status: 'pending',
    pickup_at: null,
    pickup_by_admin: null,
    created_at: '2026-10-02T17:05:00Z'
  }
];

