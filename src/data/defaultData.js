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

export const SPEAKER_CATEGORIES = [
  {
    id: 'president',
    label: 'ประธานในพิธี',
    fullLabel: 'ประธานในพิธี (Ceremony President & Guest of Honor)',
    description: 'ประธานในพิธีเปิดโครงการ JRE 2027 และพิธีมอบเกียรติบัตรวุฒิบัตรปิดการฝึกอบรม',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    headerColor: 'text-amber-400',
    dotColor: 'bg-amber-400'
  },
  {
    id: 'advisor',
    label: 'ที่ปรึกษาโครงการ',
    fullLabel: 'คณะที่ปรึกษาโครงการ (Project Advisors & Mentors)',
    description: 'อาจารย์ที่ปรึกษาชมรม และผู้ทรงคุณวุฒิภาคีเครือข่ายนักศึกษา',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    headerColor: 'text-indigo-400',
    dotColor: 'bg-indigo-400'
  },
  {
    id: 'speaker',
    label: 'วิทยากรประจำโครงการ',
    fullLabel: 'วิทยากรประจำโครงการ (Keynote Instructors & Trainers)',
    description: 'อาจารย์ผู้บรรยายภาคทฤษฎี และครูฝึกสอนประจำฐานการฝึกปฏิบัติ',
    badgeClass: 'bg-emergency-500/20 text-emergency-300 border-emergency-500/40',
    headerColor: 'text-emergency-400',
    dotColor: 'bg-emergency-400'
  }
];

export const getSpeakerCategory = (spk) => {
  if (spk?.category) return spk.category;
  const str = `${spk?.name || ''} ${spk?.title || ''} ${spk?.topic || ''} ${spk?.role || ''}`.toLowerCase();
  if (
    str.includes('ประธาน') || 
    str.includes('อธิการบดี') || 
    str.includes('นิตยา') || 
    str.includes('เปิดโครงการ') || 
    str.includes('พิธีเปิด') || 
    str.includes('พิธีปิด')
  ) {
    return 'president';
  }
  if (
    str.includes('ที่ปรึกษา') || 
    str.includes('กฤษฎา') || 
    str.includes('พนัส') || 
    str.includes('ประเสริฐ') || 
    str.includes('advisor')
  ) {
    return 'advisor';
  }
  return 'speaker';
};

export const DEFAULT_SPEAKERS = [
  // 1. ประธานในพิธี (Ceremony President & Guest of Honor)
  {
    id: 'spk-pres-1',
    num: 1,
    category: 'president',
    name: 'รองศาสตราจารย์ ดร.นิตยา วรรณกิตร์',
    title: 'รองอธิการบดีฝ่ายพัฒนานิสิตและภาพลักษณ์องค์กร',
    org: 'มหาวิทยาลัยมหาสารคาม (มมส)',
    topic: 'ประธานในพิธีเปิดโครงการ JRE 2027 และพิธีมอบเกียรติบัตรวุฒิบัตรปิดการฝึกอบรม',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },

  // 2. คณะที่ปรึกษาโครงการ (Project Advisors & Mentors)
  {
    id: 'spk-adv-1',
    num: 1,
    category: 'advisor',
    name: 'ว่าที่ร้อยตรีกฤษฎา ศักดิ์คำดวง',
    title: 'อาจารย์ที่ปรึกษาชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม',
    org: 'กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม',
    topic: 'ที่ปรึกษาด้านการฝึกอบรมและประสานงานภาคีเครือข่ายนักศึกษาทั่วประเทศ',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-adv-2',
    num: 2,
    category: 'advisor',
    name: 'นายพนัส ปรีวาสนา',
    title: 'ที่ปรึกษาชมรมกู้ภัยราชพฤกษ์ / หัวหน้างานกิจกรรมนิสิต',
    org: 'กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม',
    topic: 'ที่ปรึกษาฝ่ายอำนวยการโครงการและการบริหารจัดการเครือข่ายสถาบัน',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-adv-3',
    num: 3,
    category: 'advisor',
    name: 'นายประเสริฐ ชุ่มอภัย',
    title: 'ผู้เชี่ยวชาญงานป้องกันและบรรเทาสาธารณภัย',
    org: 'ที่ปรึกษาพิเศษโครงการ Joint Response Exercise (JRE)',
    topic: 'ที่ปรึกษาด้านยุทธวิธีการตอบโต้เหตุฉุกเฉินและมาตรฐานความปลอดภัยสากล',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
  },

  // 3. วิทยากรประจำโครงการ (Keynote Instructors & Trainers)
  {
    id: 'spk-ins-1',
    num: 1,
    category: 'speaker',
    name: 'อ.ดร.กัลยา หาญพิชาญชัย',
    title: 'รองคณบดีฝ่ายพัฒนานิสิตและโครงสร้างพื้นฐาน อาจารย์ประจำหลักสูตรอาชีวอนามัยและความปลอดภัย',
    org: 'คณะสาธารณสุขศาสตร์ มหาวิทยาลัยมหาสารคาม',
    topic: 'อบรมความรู้การกู้ภัยเบื้องต้นและความปลอดภัยในการปฏิบัติงาน',
    photo: 'https://images.unsplash.com/photo-1594824813583-b26a63666d96?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-ins-2',
    num: 2,
    category: 'speaker',
    name: 'นายเสนีย์ ดรศรีโยเพชร',
    title: 'นักวิชาการ ตำแหน่งงานป้องกันและบรรเทาสาธารณภัย',
    org: 'องค์การบริหารส่วนตำบลหัวขวาง อำเภอโกสุมพิสัย จังหวัดมหาสารคาม',
    topic: 'อบรมความรู้ระบบบัญชาการและจัดการสถานการณ์ Incident Command System (ICS)',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-ins-3',
    num: 3,
    category: 'speaker',
    name: 'นายแสวง สิทธิบุ่น',
    title: 'หัวหน้างานป้องกันและบรรเทาสาธารณภัย',
    org: 'กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม',
    topic: 'สาธิตและฝึกปฏิบัติฐาน (การติดตั้งและสวมใส่อุปกรณ์บุคคล SCBA & ค้นหาในอาคารควันทัศนวิสัยต่ำ)',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-ins-4',
    num: 4,
    category: 'speaker',
    name: 'นายวาทิต จบศรี',
    title: 'พนักงานป้องกันและบรรเทาสาธารณภัย',
    org: 'กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม',
    topic: 'สาธิตและฝึกปฏิบัติฐาน (อุปกรณ์ดับเพลิงและเครื่องมือรถดับเพลิง & ดับเพลิงเบื้องต้นจากไฟแต่ละประเภท)',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'spk-ins-5',
    num: 5,
    category: 'speaker',
    name: 'นายนพรัตน์ ศรีสมภาร',
    title: 'พนักงานป้องกันและบรรเทาสาธารณภัย',
    org: 'กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม',
    topic: 'สาธิตและฝึกปฏิบัติฐาน (กู้ภัยทางสูงและระบบเชือก การโรยตัวและอพยพผู้บาดเจ็บจากอาคารสูง)',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  }
];

export const SCHEDULE_DAYS = [
  {
    dayNumber: 1,
    dateThai: "วันเสาร์ที่ 14 พฤศจิกายน 2569",
    theme: "วันแรก: ภาคเช้าบรรยายทฤษฎี & ภาคบ่าย-ค่ำฝึกปฏิบัติการและสถานการณ์จำลอง",
    events: [
      {
        time: "07.30 – 08.00",
        title: "ลงทะเบียนเข้าร่วมโครงการ",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม",
        category: "reg",
        desc: "ผู้เข้าร่วมโครงการรายงานตัว รับเอกสาร และอุปกรณ์ประจำตัว"
      },
      {
        time: "08.00 – 08.10",
        title: "พักรับประทานอาหารว่าง",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม",
        category: "break",
        desc: "บริการอาหารว่างและเครื่องดื่มช่วงเช้า"
      },
      {
        time: "08.10 – 08.30",
        title: "พิธีเปิดโครงการ JRE 2027",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม",
        category: "ceremony",
        desc: "พิธีเปิดโดย ว่าที่ร้อยตรีกฤษฎา ศักดิ์คำดวง อาจารย์ที่ปรึกษาชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม"
      },
      {
        time: "08.30 – 09.30",
        title: "อบรม 'ความรู้การกู้ภัยเบื้องต้น ความปลอดภัยในการปฏิบัติงาน'",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม",
        category: "lecture",
        desc: "โดยวิทยากร รองคณบดีฝ่ายพัฒนานิสิตและโครงสร้างพื้นฐาน อ.ดร.กัลยา หาญพิชาญชัย หลักสูตรอาชีวอนามัยและความปลอดภัย คณะสาธารณสุขศาสตร์ มหาวิทยาลัยมหาสารคาม"
      },
      {
        time: "09.30 – 09.45",
        title: "พักรับประทานอาหารว่าง",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "break",
        desc: "พักเบรกอาหารว่างช่วงเช้า"
      },
      {
        time: "09.45 – 11.45",
        title: "อบรม 'ความรู้ระบบบัญชาการและจัดการสถานการณ์ ICS'",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม",
        category: "lecture",
        desc: "โดยวิทยากร นายเสนีย์ ดรศรีโยเพชร นักวิชาการ ตำแหน่งงานป้องกันและบรรเทาสาธารณภัย องค์การบริหารส่วนตำบลหัวขวาง อำเภอโกสุมพิสัย จังหวัดมหาสารคาม"
      },
      {
        time: "12.00 – 13.00",
        title: "รับประทานอาหารกลางวัน",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "lunch",
        desc: "พักรับประทานอาหารกลางวันร่วมกัน"
      },
      {
        time: "13.00 – 13.30",
        title: "กิจกรรมสาธิตและฝึกปฏิบัติฐาน (การติดตั้งและสวมใส่อุปกรณ์บุคคล SCBA)",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "drill",
        desc: "โดยวิทยากร นายแสวง สิทธิบุ่น หัวหน้างานป้องกันและบรรเทาสาธารณภัย กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม"
      },
      {
        time: "13.30 – 14.00",
        title: "กิจกรรมสาธิตและฝึกปฏิบัติฐาน (อุปกรณ์ดับเพลิงและเครื่องมือรถดับเพลิง)",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "drill",
        desc: "โดยวิทยากร นายวาทิต จบศรี พนักงานป้องกันและบรรเทาสาธารณภัย กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม"
      },
      {
        time: "14.00 – 14.30",
        title: "กิจกรรมสาธิตและฝึกปฏิบัติฐาน (กู้ภัยทางสูงและระบบเชือก อพยพจากอาคารสูง)",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "drill",
        desc: "โดยวิทยากร นายนพรัตน์ ศรีสมภาร พนักงานป้องกันและบรรเทาสาธารณภัย กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม"
      },
      {
        time: "14.30 – 16.00",
        title: "กิจกรรมสาธิตและฝึกปฏิบัติ (บัญชาการเหตุการณ์และการค้นหาในอาคารที่มีควันหรือทัศนวิสัยต่ำ)",
        location: "ณ อาคารพัฒนานิสิต ชั้น 3 กองกิจการนิสิต",
        category: "drill",
        desc: "โดยวิทยากร นายแสวง สิทธิบุ่น (หัวหน้างานป้องกันและบรรเทาสาธารณภัย กองอาคารสถานที่ มมส) และ นายเสนีย์ ดรศรีโยเพชร (นักวิชาการป้องกันและบรรเทาสาธารณภัย อบต.หัวขวาง)"
      },
      {
        time: "16.00 – 17.30",
        title: "กิจกรรมสาธิตและฝึกปฏิบัติ (การโรยตัวด้วยระบบเชือกและลำเลียงผู้บาดเจ็บ อพยพจากอาคารสูง)",
        location: "ดาดฟ้า ชั้น 4 อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "drill",
        desc: "โดยวิทยากร นายแสวง สิทธิบุ่น หัวหน้างานป้องกันและบรรเทาสาธารณภัย กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม"
      },
      {
        time: "17.30 – 18.00",
        title: "พักตามอัธยาศัย",
        location: "อาคารพัฒนานิสิต",
        category: "break",
        desc: "เตรียมความพร้อมสำหรับกิจกรรมภาคค่ำ"
      },
      {
        time: "18.00 – 19.00",
        title: "รับประทานอาหารเย็น",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "dinner",
        desc: "รับประทานอาหารเย็นร่วมกัน"
      },
      {
        time: "19.00 – 19.20",
        title: "เข้ารับฟังการบรรยายความปลอดภัยเบื้องต้นก่อนฝึกปฏิบัติการดับเพลิง",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "lecture",
        desc: "ชี้แจงมาตรการความปลอดภัย ขั้นตอนการเข้าระงับเหตุ และการใช้อุปกรณ์ดับเพลิงอย่างถูกต้อง"
      },
      {
        time: "19.20 – 20.30",
        title: "กิจกรรมสาธิตและฝึกปฏิบัติการดับเพลิงเบื้องต้น จากไฟแต่ละประเภท",
        location: "ลานฝึกอาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "night-drill",
        desc: "โดยวิทยากร นายวาทิต จบศรี พนักงานป้องกันและบรรเทาสาธารณภัย กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม"
      },
      {
        time: "20.30 – 21.00",
        title: "พักตามอัธยาศัย / สรุปประจำวัน",
        location: "อาคารพัฒนานิสิต",
        category: "break",
        desc: "เตรียมความพร้อมสัมภาระและเดินทางเข้าที่พัก"
      },
      {
        time: "21.00",
        title: "เข้าพักค้างแรม",
        location: "ณ หอใน กุดรัง กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม",
        category: "rest",
        desc: "ผู้เข้าร่วมโครงการเข้าพักผ่อน ณ หอพักในกุดรัง มหาวิทยาลัยมหาสารคาม"
      }
    ]
  },
  {
    dayNumber: 2,
    dateThai: "วันอาทิตย์ที่ 15 พฤศจิกายน 2569",
    theme: "วันที่สอง: ละลายพฤติกรรม ถอดบทเรียน AAR แลกเปลี่ยนเรียนรู้ มอบวุฒิบัตร และปิดโครงการ",
    events: [
      {
        time: "06.00 – 06.30",
        title: "ทำธุระส่วนตัว",
        location: "หอใน กุดรัง กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม",
        category: "rest",
        desc: "ตื่นนอนและเตรียมความพร้อมสำหรับกิจกรรมวันที่สอง"
      },
      {
        time: "06.30 – 07.30",
        title: "รับประทานอาหารเช้า",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "breakfast",
        desc: "บริการอาหารเช้าสำหรับผู้เข้าร่วมโครงการ"
      },
      {
        time: "07.30 – 08.30",
        title: "กิจกรรมเล่นเกมละลายพฤติกรรม",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม",
        category: "activity",
        desc: "สร้างความสัมพันธ์ เสริมสร้างการทำงานเป็นทีม และกระชับความร่วมมือระหว่างเครือข่ายนักศึกษาอาสาสมัคร"
      },
      {
        time: "08.30 – 09.30",
        title: "ถอดบทเรียนหลังการฝึก (After Action Review: AAR)",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม",
        category: "aar",
        desc: "ทบทวนการฝึกซ้อม วิเคราะห์จุดแข็ง จุดที่ต้องพัฒนา และแลกเปลี่ยนประสบการณ์ตรงจากการฝึกปฏิบัติ"
      },
      {
        time: "09.30 – 10.00",
        title: "กิจกรรมแลกเปลี่ยนความรู้ภาคีเครือข่ายนักศึกษาอาสาฯ",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม",
        category: "network",
        desc: "แลกเปลี่ยนองค์ความรู้ และสร้างแนวทางความร่วมมือระหว่างชมรมกู้ภัยระดับสถาบันอุดมศึกษาทั่วประเทศ"
      },
      {
        time: "10.00 – 10.30",
        title: "พิธีมอบใบประกาศนียบัตร ผู้เข้าร่วมโครงการ",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม",
        category: "cert",
        desc: "พิธีมอบเกียรติบัตรและวุฒิบัตรรับรองการผ่านการฝึกอบรมแก่ผู้เข้าร่วมโครงการทุกคน"
      },
      {
        time: "10.30 – 11.00",
        title: "พิธีปิดโครงการ JRE 2027",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม",
        category: "ceremony",
        desc: "พิธีปิดโดย รองศาสตราจารย์ ดร.นิตยา วรรณกิตร์ รองอธิการบดีฝ่ายพัฒนานิสิตและภาพลักษณ์องค์กร มหาวิทยาลัยมหาสารคาม"
      },
      {
        time: "11.00 – 11.20",
        title: "รับประทานอาหารว่าง",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "break",
        desc: "บริการอาหารว่างและเครื่องดื่ม"
      },
      {
        time: "11.20 – 12.00",
        title: "เสร็จสิ้นกิจกรรม & บันทึกภาพที่ระลึกร่วมกัน",
        location: "อาคารพัฒนานิสิต กองกิจการนิสิต",
        category: "ceremony",
        desc: "บันทึกภาพร่วมกันระหว่างผู้เข้าร่วม คณะทำงาน และวิทยากร"
      },
      {
        time: "12.00",
        title: "เดินทางกลับสถานศึกษาโดยสวัสดิภาพ",
        location: "มหาวิทยาลัยมหาสารคาม",
        category: "travel",
        desc: "เสร็จสิ้นโครงการ JRE 2027 เดินทางกลับสถานศึกษาโดยสวัสดิภาพ"
      }
    ]
  }
];

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'payment',
    short_id: 'n1',
    title: '📢 แจ้งสมาชิกภาคีเครือข่ายทุกสถาบัน: เรื่อง การสมัครและกำหนดการชำระค่าใช้จ่าย JRE 2027',
    content: `📢 แจ้งสมาชิกภาคีเครือข่ายทุกสถาบัน

เรื่อง การสมัครเข้าร่วมโครงการ Joint Response Exercise (JRE 2027)
ณ มหาวิทยาลัยมหาสารคาม

ขอแจ้งให้สมาชิกภาคีเครือข่ายทุกมหาวิทยาลัยที่ประสงค์จะส่งสมาชิกเข้าร่วมการฝึก JRE 2027 ทราบเกี่ยวกับกำหนดการสมัครและการชำระค่าใช้จ่าย โดยแบ่งชำระเป็น 2 รอบ ดังนี้

🔹 รอบที่ 1 — วันที่ 15–20 ตุลาคม 2569
ชำระจำนวน 400 บาท พร้อมการสมัคร
เพื่อใช้สำหรับการจัดทำและสั่งซื้อเสื้อโครงการ แบบพรีออเดอร์ (เสื้อฝึกรูปแบบ คอเต่าซิป แขนสั้น โทนสี เทา–ดำ)

🔹 รอบที่ 2 — วันที่ 1–5 พฤศจิกายน 2569
* ต่างมหาวิทยาลัย: ชำระเพิ่มเติมจำนวน 450 บาท (สำหรับค่าใช้จ่ายด้าน ที่พักหอพักกุดรังและอาหาร)
* นิสิตมหาวิทยาลัยมหาสารคาม (มมส): ชำระเพิ่มเติมจำนวน 250 บาท (สำหรับค่าอาหารและกิจกรรม)

💰 สรุปค่าใช้จ่าย:
* สถาบันภายนอก / ต่างมหาวิทยาลัย: รวม 850 บาท/คน (รวมค่าที่พักหอพักกุดรัง มมส)
* นิสิตมหาวิทยาลัยมหาสารคาม (มมส): รวม 650 บาท/คน (เนื่องจากไม่มีค่าใช้จ่ายด้านที่พัก)

🏦 บัญชีสำหรับโอนเงินค่าลงทะเบียน:
ธนาคารไทยพาณิชย์ (SCB)
เลขที่บัญชี: 594-264865-5
ชื่อบัญชี: นางสาวมัญชุพร ยังเหล็ก
☎️ สอบถามรายละเอียดเพิ่มเติม: 098-329-6762

จึงขอความร่วมมือ ผู้ประสานงานของแต่ละมหาวิทยาลัย แจ้งรายละเอียดดังกล่าวให้สมาชิกที่ประสงค์เข้าร่วมโครงการทราบ และเตรียมดำเนินการสมัครและชำระค่าใช้จ่ายตามกำหนดเวลาข้างต้น 🚑🔥`,
    category: 'payment',
    pinned: true,
    action_url: 'https://jre-2027.vercel.app/register',
    action_label: 'สมัครเข้าร่วมโครงการ JRE 2027',
    created_at: '2026-10-04T12:00:00Z',
    images: [],
    pdf_url: '',
    pdf_name: ''
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    slug: 'curriculum',
    short_id: 'n2',
    title: '🚨 หัวข้อการเรียนรู้และการฝึกอบรม JRE 2027 (Learning & Training Curriculum)',
    content: `🚨 หัวข้อการเรียนรู้และการฝึกอบรม

เรียนรู้จริง ฝึกจริง จำลองสถานการณ์จริง
การฝึก Joint Response Exercise (JRE 2027) ออกแบบหลักสูตรให้ผู้เข้าร่วมได้พัฒนาทักษะทั้ง ภาคทฤษฎีและภาคปฏิบัติ โดยได้รับการถ่ายทอดความรู้จาก อาจารย์ประจำหลักสูตรอาชีวอนามัยและความปลอดภัย คณะสาธารณสุขศาสตร์ มหาวิทยาลัยมหาสารคาม ร่วมกับ เจ้าหน้าที่งานป้องกันและบรรเทาสาธารณภัยจากกระทรวงมหาดไทย และงานป้องกันและบรรเทาสาธารณภัย มหาวิทยาลัยมหาสารคาม

เนื้อหาการฝึกครอบคลุมตั้งแต่พื้นฐานการทำงานอย่างปลอดภัย ไปจนถึงการปฏิบัติการในสถานการณ์ฉุกเฉินที่ต้องอาศัย การตัดสินใจ การสื่อสาร การทำงานเป็นทีม และการบัญชาการเหตุการณ์

📚 ภาคทฤษฎีและการเรียนรู้

1. 🦺 ความปลอดภัยในการปฏิบัติงาน
เรียนรู้หลักความปลอดภัยในการเข้าปฏิบัติงาน การประเมินความเสี่ยง การใช้อุปกรณ์ป้องกันส่วนบุคคล และการทำงานในพื้นที่เกิดเหตุอย่างเป็นระบบ

2. 🎯 ระบบบัญชาการเหตุการณ์และการจัดการสถานการณ์
เรียนรู้หลักการ Incident Command System (ICS) การแบ่งหน้าที่ การสื่อสาร การประสานงาน การวางแผน และการตัดสินใจภายใต้สถานการณ์ฉุกเฉิน

3. 🧰 ฐานเรียนรู้ทักษะเฉพาะด้าน

🔹 ฐานที่ 1 — ระบบเชือกและการลำเลียงผู้บาดเจ็บทางสูง
เรียนรู้พื้นฐานระบบเชือก การผูกเงื่อน การจัดระบบลำเลียง และการใช้อุปกรณ์สำหรับการช่วยเหลือผู้ประสบภัยในพื้นที่สูง

🔹 ฐานที่ 2 — อุปกรณ์ดับเพลิงและอุปกรณ์ประจำรถดับเพลิง
ทำความรู้จักอุปกรณ์ดับเพลิง เครื่องมือกู้ภัย และอุปกรณ์ประจำรถดับเพลิง พร้อมเรียนรู้หลักการเลือกใช้อุปกรณ์ให้เหมาะสมกับสถานการณ์

🔹 ฐานที่ 3 — การติดตั้งและสวมใส่ SCBA
เรียนรู้ส่วนประกอบ การตรวจสอบ การติดตั้ง และการสวมใส่ SCBA (Self-Contained Breathing Apparatus) เพื่อเตรียมความพร้อมสำหรับการปฏิบัติงานในพื้นที่ที่มีควันหรือสภาพแวดล้อมที่เป็นอันตราย

🔥 ภาคปฏิบัติ — จากห้องเรียนสู่สถานการณ์จำลอง

ผู้เข้าร่วมจะนำความรู้จากภาคทฤษฎีมาประยุกต์ใช้ผ่าน สถานการณ์จำลองเหตุฉุกเฉิน โดยแบ่งบทบาทและปฏิบัติการเป็นทีม ตั้งแต่การรับแจ้งเหตุ การประเมินสถานการณ์ การจัดตั้งระบบบัญชาการเหตุการณ์ ไปจนถึงการเข้าช่วยเหลือผู้ประสบภัย

🚒 จำลองเหตุเพลิงไหม้และการค้นหาภายในอาคาร
ฝึกการเข้าค้นหาและช่วยเหลือผู้ประสบภัยในพื้นที่อาคารที่เกิดเหตุ โดยคำนึงถึงความปลอดภัยของผู้ปฏิบัติงานเป็นสำคัญ

🧗 การโรยตัวและอพยพออกจากอาคาร
ฝึกทักษะการเคลื่อนย้ายและอพยพออกจากพื้นที่สูงภายใต้สถานการณ์จำลอง

🛟 การลำเลียงผู้บาดเจ็บทางสูง
ประยุกต์ใช้ระบบเชือกและ เปลม้วน (Roll-up Stretcher) ในการลำเลียงผู้บาดเจ็บจากพื้นที่สูงอย่างเป็นระบบ

🔥 การระงับเหตุอัคคีภัย
ฝึกการใช้อุปกรณ์และเครื่องมือดับเพลิง รวมถึงการประยุกต์ใช้อุปกรณ์ขั้นสูงในการควบคุมและระงับเหตุภายใต้สถานการณ์จำลอง

⚡ ไฮไลต์ของการฝึก

“ไม่ใช่เพียงเรียนรู้ว่าต้องทำอะไร แต่ได้ฝึกว่าต้องทำอย่างไรเมื่อเกิดเหตุจริง”`,
    category: 'training',
    pinned: true,
    action_url: 'https://jre-2027.vercel.app/schedule',
    action_label: 'ดูกำหนดการและหลักสูตรการฝึก',
    created_at: '2026-10-04T12:30:00Z',
    images: [],
    pdf_url: '',
    pdf_name: ''
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    slug: 'accommodation',
    short_id: 'n3',
    title: '🏢 ข้อมูลหอพักและตัวอย่างรูปห้องพัก: หอพักกุดรัง มหาวิทยาลัยมหาสารคาม (มมส)',
    content: `🏢 ข้อมูลที่พักค้างแรมและสิ่งอำนวยความสะดวก

หอพัก กุดรัง มมส (มหาวิทยาลัยมหาสารคาม)
ที่พักค้างแรมอย่างเป็นทางการสำหรับผู้เข้าร่วมโครงการ Joint Response Exercise (JRE 2027)

✨ สิ่งอำนวยความสะดวกภายในห้องพัก:
1. 🚿 เครื่องทำน้ำอุ่น
2. ❄️ แอร์ (เครื่องปรับอากาศ)
3. 📝 โต๊ะเขียนงาน
4. 🚪 ตู้เสื้อผ้า
5. 🛏️ หมอน
6. 🧶 ผ้าห่ม

💡 ข้อแนะนำสำหรับผู้เข้าร่วมโครงการ:
ภายในห้องพักมี หมอน และ ผ้าห่ม จัดเตรียมไว้ให้พร้อมใช้งานเรียบร้อยแล้ว ไม่จำเป็นต้องนำเครื่องนอนมาเอง โดยขอให้ผู้เข้าร่วมโครงการเตรียมเพียงของใช้ส่วนตัวที่จำเป็น เช่น สบู่ ยาสระผม แปรงสีฟัน และผ้าเช็ดตัว`,
    category: 'activity',
    pinned: true,
    action_url: 'https://jre-2027.vercel.app/schedule',
    action_label: 'ดูรายละเอียดที่พักและกำหนดการ',
    created_at: '2026-10-04T13:50:00Z',
    images: ['/images/accommodation/kudrang_room.jpg'],
    pdf_url: '',
    pdf_name: ''
  },
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    slug: 'pr',
    short_id: 'n4',
    title: '🚨 เตรียมพบกับ โครงการ Joint Response Exercise (JRE 2027) 🚨',
    content: `📢 ขออนุญาตประชาสัมพันธ์

🚨 เตรียมพบกับ โครงการ Joint Response Exercise (JRE 2027) 🚨

การฝึกผสมเพื่อเตรียมความพร้อมในการตอบโต้เหตุฉุกเฉินและสาธารณภัย โดยเปิดโอกาสให้ผู้เข้าร่วมได้ เรียนรู้จริง ฝึกจริง และจำลองสถานการณ์เสมือนจริง พร้อมเรียนรู้การทำงานร่วมกันระหว่างทีมและภาคีเครือข่าย

🤝 พิเศษ! การฝึกครั้งนี้เป็นการฝึกร่วมระหว่างภาคีเครือข่ายจากหลายมหาวิทยาลัย เพื่อแลกเปลี่ยนความรู้ ประสบการณ์ และฝึกการประสานงานร่วมกันในสถานการณ์จำลองที่ใกล้เคียงกับการปฏิบัติงานจริง

🗓 เปิดรับสมัครผู้เข้าร่วมโครงการ
วันที่ 15 ตุลาคม 2569

📍 กำหนดจัดกิจกรรม
วันที่ 14–15 พฤศจิกายน 2569

💰 รวมค่าใช้จ่ายทั้งสิ้น 850 บาท/คน (แบ่งชำระเป็น 2 รอบ)
รอบที่ 1: 15 ต.ค. 2569 — 400 บาท (ค่าเสื้อโครงการพรีออเดอร์ คอจีน/คอซิป)
รอบที่ 2: 5 พ.ย. 2569 — 450 บาท (ค่าที่พักและอาหารตลอดโครงการ)

ค่าลงทะเบียนประกอบด้วย
✅ เสื้อโครงการแบบพรีออเดอร์ (คอจีน/คอซิป)
✅ อาหารและอาหารว่างตลอดการฝึก
✅ ที่พักค้างแรม 1 คืน ณ หอพักนิสิต มมส
✅ เกียรติบัตรผ่านการเข้าร่วมโครงการ (รับรองการฝึกจากสำนักงานป้องกันและบรรเทาสาธารณภัย)

⚠️ รับสมัครจำนวนจำกัด ⚠️`,
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
    id: 'ann-2',
    slug: 'line-group',
    short_id: 'n5',
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
    slug: 'gear-list',
    short_id: 'n6',
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
    slug: 'venue',
    short_id: 'n7',
    title: '⚡ ประกาศการเปลี่ยนแปลงจุดรวมพลพิธีเปิด (Update)',
    content: 'แจ้งเปลี่ยนแปลงจุดรวมพลพิธีเปิดในวันที่ 14 พ.ย. 2569 ณ อาคารพัฒนานิสิต กองกิจการนิสิต มหาวิทยาลัยมหาสารคาม เพื่อความสะดวกรวดเร็วในการลงทะเบียนและรับฟังการบรรยาย',
    category: 'change',
    pinned: false,
    action_url: '',
    action_label: '',
    created_at: '2026-10-02T15:30:00Z'
  }
];

export const DEFAULT_FORMS_CONFIG = {
  pretest: {
    title: 'แบบทดสอบก่อนเรียน (Pre-Test) 2027',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSeG8XzDhnXpWOySVmLCFfmMaHtuDW5rnaZB9qHkdbyLtCg-gQ/closedform',
    banner: '/images/banner/banner_pretest.png',
    enabled: true,
    description: 'แบบทดสอบวัดความรู้พื้นฐานด้านการกู้ภัย การปฐมพยาบาล และระบบบัญชาการเหตุก่อนเข้ารับการฝึก'
  },
  posttest: {
    title: 'แบบทดสอบหลังเรียน (Post-Test)',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSeg27uayAmN3KSjFlpCf7g_RYQB-HhKSjqriVLOBNuNyH2D_Q/formResponse',
    banner: '/images/banner/banner_posttest.png',
    enabled: true,
    description: 'แบบทดสอบวัดผลสัมฤทธิ์และทักษะความรู้หลังเสร็จสิ้นการฝึกปฏิบัติการจริง'
  },
  evaluation: {
    title: 'แบบประเมินความพึงพอใจ (JRE 2027)',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSeRvFFvOTmFqO8MXRagJyfX0FUQ9ws_NqLmxcYga7RFLClPeA/viewform',
    banner: '/images/banner/banner_evaluation.png',
    enabled: true,
    description: 'แบบประเมินผลความพึงพอใจและข้อเสนอแนะในการพัฒนาโครงการ JRE 2027'
  }
};

export const STAFF_SHIRT_FEE = 280;

export const DEFAULT_PAYMENT_CONFIG = {
  fee_total: 850,
  fee_total_msu: 650,
  fee_total_external: 850,
  fee_staff_shirt: 280,
  bank_name: 'ธนาคารไทยพาณิชย์',
  bank_account_number: '594-264865-5',
  bank_account_name: 'นางสาวมัญชุพร ยังเหล็ก',
  bank_promptpay: '',
  contact_phone: '098-329-6762',
  allow_installments: true,
  installment_round1_amount: 400,
  installment_round1_due: '15-20 ตุลาคม 2569 (สำหรับการสมัครและดำเนินการจัดทำเสื้อโครงการแบบพรีออเดอร์)',
  installment_round2_amount: 450,
  installment_round2_amount_msu: 250,
  installment_round2_amount_external: 450,
  installment_round2_due: '1-5 พฤศจิกายน 2569 (สำหรับค่าใช้จ่ายด้านที่พักและอาหาร / นิสิต มมส 250 บ. ต่างสถาบัน 450 บ.)',
  notes: 'ต่างมหาวิทยาลัย 850 บาท (รวมค่าที่พักหอพักกุดรัง มมส) / นิสิต มมส 650 บาท (ไม่มีค่าที่พัก) / Staff โครงการ 280 บาท (ค่าเสื้อฝึก) • แบ่งชำระ 2 รอบ (รอบ 1: 400 บาท [15-20 ต.ค. 2569], รอบ 2: 450/250 บาท [1-5 พ.ย. 2569])',
  // Registration Schedule & Live Countdown Settings:
  reg_open_datetime: '2026-10-15T08:30:00',
  reg_close_datetime: '2026-10-20T23:59:59',
  reg_status_override: 'auto',
  reg_closed_message: 'โครงการ JRE 2027 ได้ปิดรับสมัครผู้เข้าร่วมการฝึกอบรมอย่างเป็นทางการแล้ว สำหรับผู้ที่ได้ลงทะเบียนไว้แล้ว สามารถเข้าสู่ระบบเพื่อตรวจสอบสถานะห้องนอน กลุ่มฝึก และชำระเงินงวดที่ 2 ได้ตามปกติ'
};

export const SHIRT_SIZE_OPTIONS = [
  { value: 'S', label: 'S (รอบอก 36 นิ้ว / ยาว 26 นิ้ว)' },
  { value: 'M', label: 'M (รอบอก 38 นิ้ว / ยาว 27 นิ้ว)' },
  { value: 'L', label: 'L (รอบอก 40 นิ้ว / ยาว 28 นิ้ว)' },
  { value: 'XL', label: 'XL (รอบอก 42 นิ้ว / ยาว 29 นิ้ว)' },
  { value: 'XXL', label: 'XXL (รอบอก 44 นิ้ว / ยาว 30 นิ้ว)' },
  { value: '3XL', label: '3XL (รอบอก 46 นิ้ว / ยาว 31 นิ้ว)' },
  { value: '4XL', label: '4XL (รอบอก 48 นิ้ว / ยาว 32 นิ้ว)' },
  { value: '5XL', label: '5XL (รอบอก 50 นิ้ว / ยาว 32 นิ้ว)' },
  { value: 'อื่นๆ ติดต่อ 098-329-6762', label: 'อื่นๆ ติดต่อ 098-329-6762' }
];

export const isMsuInstitution = (inst) => {
  if (!inst) return false;
  const raw = typeof inst === 'object'
    ? `${inst.institution || ''} ${inst.affiliation || ''} ${inst.institution_abbr_th || ''} ${inst.full_name_affiliation || ''}`
    : String(inst);
  const s = raw.toLowerCase().trim();
  return (
    s.includes('มหาสารคาม') ||
    s.includes('มมส') ||
    s.includes('msu') ||
    s.includes('ราชพฤกษ์') ||
    s.includes('rcpmsu') ||
    s.includes('mahasarakham') ||
    s.includes('mahasarakam')
  );
};

/**
 * ตรวจสอบว่าผู้สมัครเป็น Staff โครงการ (โอน 280 บาท ค่าเสื้อ) หรือไม่
 * รองรับทั้งการติ๊กเลือก is_staff และการตรวจจับอัตโนมัติจากยอดโอน 280 บาท
 */
export const isStaffRegistration = (reg) => {
  if (!reg) return false;
  if (typeof reg === 'boolean') return reg;
  if (reg.is_staff === true || reg.is_staff === 'true') return true;
  if (reg.registration_type === 'staff' || reg.applicant_role === 'staff' || reg.payment_plan === 'staff') return true;

  // ตรวจจากยอดสลิป OCR หรือยอดเงินที่บันทึกว่าเป็น 280 บาท
  const ocrFullAmt = Number(reg.slip_ocr_full?.amount || 0);
  const ocrR1Amt = Number(reg.slip_ocr_round1?.amount || 0);
  const paymentAmt = Number(reg.payment_amount || 0);
  if (Math.abs(ocrFullAmt - STAFF_SHIRT_FEE) <= 0.01) return true;
  if (Math.abs(ocrR1Amt - STAFF_SHIRT_FEE) <= 0.01) return true;
  if (Math.abs(paymentAmt - STAFF_SHIRT_FEE) <= 0.01) return true;

  // ตรวจจากหมายเหตุการโอนเงิน
  const notesStr = `${reg.payment_notes || ''} ${reg.installment_1_notes || ''} ${reg.special_notes || ''}`.toLowerCase();
  if (notesStr.includes('staff') || notesStr.includes('สตาฟ') || notesStr.includes('280')) {
    if (notesStr.includes('280') || notesStr.includes('ค่าเสื้อ staff') || notesStr.includes('สตาฟ')) {
      return true;
    }
  }

  return false;
};

/**
 * แยกเพศ (ชาย / หญิง) จากข้อมูลที่กรอกหรือคำนำหน้าชื่อ
 * เพื่อใช้แยกชาย-หญิงในแต่ละมหาวิทยาลัยสำหรับจัดห้องพัก (Dormitory Room Allocation)
 */
export const resolveGender = (reg) => {
  if (!reg) return 'ไม่ระบุ';

  const explicit = String(reg.gender || '').trim().toLowerCase();
  if (explicit === 'ชาย' || explicit === 'male' || explicit === 'm') return 'ชาย';
  if (explicit === 'หญิง' || explicit === 'female' || explicit === 'f') return 'หญิง';

  const titleTh = String(reg.title_th || reg.title || '').trim();
  const titleOtherTh = String(reg.title_other_th || '').trim();
  const titleEn = String(reg.title_en || '').trim().toLowerCase();
  const fullStr = `${titleTh} ${titleOtherTh} ${reg.full_name_affiliation || ''} ${reg.first_name || ''} ${reg.customer_name || ''}`.trim();

  // ตรวจคำนำหน้าหญิงก่อน (เพราะ 'นางสาว' / 'ว่าที่ร้อยตรีหญิง' มีคำซ้อน)
  if (
    titleTh === 'นางสาว' ||
    titleTh === 'นาง' ||
    titleTh === 'ว่าที่ร้อยตรีหญิง' ||
    titleTh.includes('หญิง') ||
    titleOtherTh.includes('หญิง') ||
    titleOtherTh.includes('น.ส.') ||
    titleOtherTh.includes('นาง') ||
    titleEn === 'miss' ||
    titleEn === 'mrs.' ||
    titleEn === 'ms.' ||
    titleEn.includes('(w)') ||
    /(นางสาว|น\.ส\.|ด\.ญ\.|เด็กหญิง|ว่าที่ร้อยตรีหญิง|ว่าที่\s*ร\.ต\.หญิง|\bMiss\b|\bMrs\.|\bMs\.)/i.test(fullStr) ||
    /^นาง\s*[ก-ฮ]/.test(fullStr)
  ) {
    return 'หญิง';
  }

  if (
    titleTh === 'นาย' ||
    titleTh === 'ว่าที่ร้อยตรี' ||
    titleOtherTh.includes('นาย') ||
    titleOtherTh.includes('ชาย') ||
    titleEn === 'mr.' ||
    titleEn === 'act.2nd lt.' ||
    /(^|\s|-)(นาย|ด\.ช\.|เด็กชาย|ว่าที่ร้อยตรี|ว่าที่\s*ร\.ต\.|พระ|สามเณร|\bMr\.)/i.test(fullStr)
  ) {
    return 'ชาย';
  }

  return 'ไม่ระบุ';
};

export const THAI_HONORIFIC_PREFIXES = [
  'ว่าที่ร้อยตรีหญิง',
  'ว่าที่ร้อยตรี',
  'ว่าที่ ร.ต.หญิง',
  'ว่าที่ ร.ต.',
  'นางสาว',
  'นาย',
  'นาง',
  'เด็กชาย',
  'เด็กหญิง',
  'ด.ช.',
  'ด.ญ.',
  'นพ.',
  'พญ.',
  'ทพ.',
  'ภก.',
  'ส.ต.ต.',
  'ส.ต.ท.',
  'ส.ต.อ.',
  'ร.ต.ต.',
  'ร.ต.ท.',
  'ร.ต.อ.',
  'พ.ต.ต.',
  'พ.ต.ท.',
  'พ.ต.อ.',
  'พล.ต.ต.',
  'Mr.',
  'Ms.',
  'Mrs.',
  'Miss',
  'Dr.'
];

const TITLE_PREFIX_REGEX = /^(?:ว่าที่ร้อยตรีหญิง|ว่าที่ร้อยตรี|ว่าที่\s*ร\.ต\.หญิง|ว่าที่\s*ร\.ต\.|นางสาว|นาย|นาง|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นพ\.|พญ\.|ทพ\.|ภก\.|ส\.ต\.ต\.|ส\.ต\.ท\.|ส\.ต\.อ\.|ร\.ต\.ต\.|ร\.ต\.ท\.|ร\.ต\.อ\.|พ\.ต\.ต\.|พ\.ต\.ท\.|พ\.ต\.อ\.|พล\.ต\.ต\.|Mr\.?|Ms\.?|Mrs\.?|Miss|Dr\.?)\s*/i;

/**
 * Resolves person's title, first name, last name, and full name with guaranteed prefix
 * and strictly PREVENTS any duplicate prefix (e.g. "นาย นาย...", "นางสาว นางสาว...").
 */
export function resolvePersonFullNameWithTitle(person) {
  if (!person) {
    return {
      title: '',
      firstName: '',
      lastName: '',
      fullName: '-'
    };
  }

  // 1. Gather raw fields
  let rawFirstName = (
    person.first_name_th ||
    person.first_name ||
    person.rawRegistration?.first_name_th ||
    person.rawRegistration?.first_name ||
    ''
  ).trim();

  let rawLastName = (
    person.last_name_th ||
    person.last_name ||
    person.rawRegistration?.last_name_th ||
    person.rawRegistration?.last_name ||
    ''
  ).trim();

  // If first and last name are both empty, try customer_name or full_name_affiliation
  if (!rawFirstName && !rawLastName) {
    const rawAlt = (
      person.customer_name ||
      person.full_name_affiliation ||
      person.rawRegistration?.full_name_affiliation ||
      ''
    ).trim();
    if (rawAlt) {
      const cleanAlt = rawAlt.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
      const parts = cleanAlt.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        rawFirstName = parts[0];
        rawLastName = parts.slice(1).join(' ');
      } else if (parts.length === 1) {
        rawFirstName = parts[0];
      }
    }
  }

  // 2. Extract leading title from rawFirstName and eliminate ANY duplicate consecutive titles
  // e.g. "นาย นายปฏิภาณ" or "นาย ปฏิภาณ"
  let detectedTitle = '';
  let cleanFirst = rawFirstName;

  while (cleanFirst) {
    const match = cleanFirst.match(TITLE_PREFIX_REGEX);
    if (match) {
      if (!detectedTitle) {
        detectedTitle = match[0].trim();
      }
      cleanFirst = cleanFirst.slice(match[0].length).trim();
    } else {
      break;
    }
  }

  // Also clean rawLastName if it accidentally starts with a title
  let cleanLast = rawLastName;
  while (cleanLast) {
    const match = cleanLast.match(TITLE_PREFIX_REGEX);
    if (match && cleanLast.length > match[0].length) {
      cleanLast = cleanLast.slice(match[0].length).trim();
    } else {
      break;
    }
  }

  // 3. If no title detected in first name, look at explicit title fields
  let finalTitle = detectedTitle;
  if (!finalTitle) {
    const explicitTitle = (
      person.title_th && person.title_th !== 'อื่นๆ' ? person.title_th :
      person.title_other_th ? person.title_other_th :
      person.title ? person.title :
      person.rawRegistration?.title_th && person.rawRegistration?.title_th !== 'อื่นๆ' ? person.rawRegistration.title_th :
      person.rawRegistration?.title_other_th ? person.rawRegistration.title_other_th :
      person.rawRegistration?.title ? person.rawRegistration.title :
      ''
    ).trim();

    if (explicitTitle) {
      finalTitle = explicitTitle;
    }
  }

  // 4. If still no title, infer from Gender (ชาย -> นาย, หญิง -> นางสาว)
  if (!finalTitle) {
    const gender = person.gender || resolveGender(person.rawRegistration || person);
    if (gender === 'ชาย') {
      finalTitle = 'นาย';
    } else if (gender === 'หญิง') {
      finalTitle = 'นางสาว';
    } else {
      finalTitle = 'นาย';
    }
  }

  // 5. Clean finalTitle of any duplicate words (e.g. "นาย นาย" -> "นาย")
  finalTitle = finalTitle.replace(/^(นาย|นางสาว|นาง)\s+(นาย|นางสาว|นาง)$/g, '$1').trim();

  // 6. Format prefix:
  // "นาย", "นาง", "นางสาว" are directly prefixed to the name without space (e.g. "นายกรวิฐ", "นางสาวชลธิชา")
  // Titles like "ว่าที่ร้อยตรี", "ด.ช.", "Mr." have a space.
  const NO_SPACE_TITLES = new Set(['นาย', 'นาง', 'นางสาว']);
  const prefix = NO_SPACE_TITLES.has(finalTitle) ? finalTitle : `${finalTitle} `;

  const formattedFirstName = cleanFirst || (person.first_name || '').trim();
  const formattedLastName = cleanLast || (person.last_name || '').trim();

  const fullName = `${prefix}${formattedFirstName} ${formattedLastName}`.trim();

  return {
    title: finalTitle,
    firstName: formattedFirstName,
    lastName: formattedLastName,
    fullName
  };
}

/**
 * แปลงชื่อไซส์เสื้อให้เป็นมาตรฐานเดียวกัน (SS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, อื่นๆ)
 */
export const normalizeShirtSize = (rawSize) => {
  if (!rawSize) return 'L';
  const s = String(rawSize).toUpperCase().trim();
  if (s === 'XXL' || s.startsWith('XXL ') || s.startsWith('2XL')) return '2XL';
  if (s === 'SS' || s.startsWith('SS ')) return 'SS';
  if (s === 'S' || s.startsWith('S ')) return 'S';
  if (s === 'M' || s.startsWith('M ')) return 'M';
  if (s === 'L' || s.startsWith('L ')) return 'L';
  if (s === 'XL' || s.startsWith('XL ')) return 'XL';
  if (s === '3XL' || s.startsWith('3XL ')) return '3XL';
  if (s === '4XL' || s.startsWith('4XL ')) return '4XL';
  if (s === '5XL' || s.startsWith('5XL ')) return '5XL';
  const match = s.match(/^(SS|S|M|L|XL|2XL|XXL|3XL|4XL|5XL)\b/);
  if (match) {
    return match[1] === 'XXL' ? '2XL' : match[1];
  }
  return 'อื่นๆ';
};

/**
 * แยกสังกัดมหาวิทยาลัยของผู้สมัคร/ออเดอร์เสื้อ ให้อยู่ในรูปแบบมาตรฐานของแต่ละมหาวิทยาลัย
 */
export const resolveUniversityInfo = (regOrStr) => {
  const withAliases = (obj) => ({
    ...obj,
    key: obj.shortTag || obj.id || 'อื่นๆ',
    label: obj.university || obj.fullName || obj.shortTag || 'อื่นๆ'
  });

  if (!regOrStr) {
    return withAliases({
      id: 'other',
      shortTag: 'อื่นๆ / ไม่ระบุ',
      shortEn: 'OTHER',
      university: 'ไม่ระบุสังกัดมหาวิทยาลัย',
      club: '-',
      fullName: 'ไม่ระบุสังกัดมหาวิทยาลัย',
      isMsu: false,
      orderIndex: 99
    });
  }

  const rawText = typeof regOrStr === 'object'
    ? `${regOrStr.institution || ''} ${regOrStr.affiliation || ''} ${regOrStr.institution_abbr_th || ''} ${regOrStr.institution_abbr_en || ''} ${regOrStr.full_name_affiliation || ''} ${regOrStr.unit || ''} ${regOrStr.customer_affiliation || ''}`
    : String(regOrStr);

  const textLower = rawText.toLowerCase().trim();

  // 1. มมส (MSU)
  if (
    textLower.includes('มหาสารคาม') ||
    textLower.includes('มมส') ||
    textLower.includes('msu') ||
    textLower.includes('ราชพฤกษ์') ||
    textLower.includes('rcpmsu') ||
    textLower.includes('mahasarakham')
  ) {
    const inst = OFFICIAL_NETWORK_INSTITUTIONS[0];
    return withAliases({ ...inst, isMsu: true, orderIndex: 1 });
  }

  // 2. มข (KKU)
  if (
    textLower.includes('ขอนแก่น') ||
    textLower.includes('มข') ||
    textLower.includes('kku') ||
    textLower.includes('tactic of special') ||
    /\btsi\b/.test(textLower) ||
    textLower.includes('khon kaen')
  ) {
    const inst = OFFICIAL_NETWORK_INSTITUTIONS[1];
    return withAliases({ ...inst, isMsu: false, orderIndex: 2 });
  }

  // 3. มทส (SUT)
  if (
    textLower.includes('สุรนารี') ||
    textLower.includes('มทส') ||
    textLower.includes('sut') ||
    textLower.includes('suranaree')
  ) {
    const inst = OFFICIAL_NETWORK_INSTITUTIONS[2];
    return withAliases({ ...inst, isMsu: false, orderIndex: 3 });
  }

  // 4. มช (CMU)
  if (
    textLower.includes('เชียงใหม่') ||
    textLower.includes('มช') ||
    textLower.includes('cmu') ||
    textLower.includes('พิงคนคร') ||
    textLower.includes('chiang mai')
  ) {
    const inst = OFFICIAL_NETWORK_INSTITUTIONS[3];
    return withAliases({ ...inst, isMsu: false, orderIndex: 4 });
  }

  // 5. มกส (KSU - กาฬสินธุ์)
  if (
    textLower.includes('กาฬสินธุ์') ||
    textLower.includes('มกส') ||
    textLower.includes('ksu') ||
    textLower.includes('ลูกพระยาโสม') ||
    textLower.includes('kalasin')
  ) {
    const inst = OFFICIAL_NETWORK_INSTITUTIONS[4];
    return withAliases({ ...inst, isMsu: false, orderIndex: 5 });
  }

  // 6. มรภ.อุดรธานี (UDRU)
  if (
    textLower.includes('อุดรธานี') ||
    textLower.includes('มรภ.อุดร') ||
    textLower.includes('udru') ||
    textLower.includes('삼พร้าว') ||
    textLower.includes('สามพร้าว') ||
    textLower.includes('udon')
  ) {
    const inst = OFFICIAL_NETWORK_INSTITUTIONS[5];
    return withAliases({ ...inst, isMsu: false, orderIndex: 6 });
  }

  // 7. มวล. (WU - วลัยลักษณ์)
  if (
    textLower.includes('วลัยลักษณ์') ||
    textLower.includes('มวล') ||
    /\bwu\b/.test(textLower) ||
    textLower.includes('ตุมปัง') ||
    textLower.includes('walailak')
  ) {
    const inst = OFFICIAL_NETWORK_INSTITUTIONS[6];
    return withAliases({ ...inst, isMsu: false, orderIndex: 7 });
  }

  // 8. มก.ฉกส (KU CSC - สกลนคร)
  if (
    textLower.includes('สกลนคร') ||
    textLower.includes('ฉกส') ||
    textLower.includes('เกษตรศาสตร์') ||
    textLower.includes('อินทนิล') ||
    textLower.includes('kucsc') ||
    textLower.includes('ku.csc') ||
    textLower.includes('kasetsart')
  ) {
    const inst = OFFICIAL_NETWORK_INSTITUTIONS[7];
    return withAliases({ ...inst, isMsu: false, orderIndex: 8 });
  }

  // กรณีระบุชื่อสถาบันอื่น
  const cleanInst = (typeof regOrStr === 'object' ? (regOrStr.institution || regOrStr.affiliation || regOrStr.unit || '') : String(regOrStr)).trim();
  if (cleanInst && cleanInst !== '-') {
    return withAliases({
      id: `custom_${cleanInst}`,
      shortTag: cleanInst.length > 22 ? `${cleanInst.slice(0, 20)}..` : cleanInst,
      shortEn: 'EXT',
      university: cleanInst,
      club: cleanInst,
      fullName: cleanInst,
      isMsu: false,
      orderIndex: 50
    });
  }

  return withAliases({
    id: 'other',
    shortTag: 'อื่นๆ / ไม่ระบุ',
    shortEn: 'OTHER',
    university: 'สถาบันอื่นๆ / ไม่ระบุสังกัด',
    club: '-',
    fullName: 'สถาบันอื่นๆ / ไม่ระบุสังกัด',
    isMsu: false,
    orderIndex: 99
  });
};

export const getRegistrationFeeDetails = (institutionOrReg, explicitIsStaff = false) => {
  const isStaff = Boolean(explicitIsStaff || (typeof institutionOrReg === 'object' && isStaffRegistration(institutionOrReg)));
  const instStr = typeof institutionOrReg === 'object'
    ? (institutionOrReg?.institution || institutionOrReg?.affiliation || '')
    : institutionOrReg;
  const isMsu = isMsuInstitution(instStr);

  if (isStaff) {
    return {
      isMsu,
      isStaff: true,
      totalFee: STAFF_SHIRT_FEE, // 280 บาท
      round1Amount: STAFF_SHIRT_FEE,
      round1Due: 'ชำระครั้งเดียว (ค่าเสื้อ Staff 280 บาท)',
      round1Purpose: 'สำหรับคณะทำงาน / Staff โครงการ JRE 2027 (ชำระเฉพาะค่าเสื้อโครงการ 280 บาท)',
      round2Amount: 0,
      round2Due: '-',
      round2Purpose: 'Staff โครงการไม่ต้องชำระงวดที่ 2',
      accommodationIncluded: false,
      feeNote: 'คณะทำงาน / Staff โครงการ ชำระเฉพาะค่าเสื้อ 280 บาท (โอนครั้งเดียว)'
    };
  }

  const totalFee = isMsu ? 650 : 850;
  const round1 = 400; // 15-20 ต.ค. 2569
  const round2 = isMsu ? 250 : 450; // 1-5 พ.ย. 2569

  return {
    isMsu,
    isStaff: false,
    totalFee,
    round1Amount: round1,
    round1Due: '15-20 ตุลาคม 2569',
    round1Purpose: 'สำหรับการสมัครและดำเนินการจัดทำเสื้อโครงการแบบพรีออเดอร์ (คอเต่าซิป แขนสั้น โทนสีเทา–ดำ)',
    round2Amount: round2,
    round2Due: '1-5 พฤศจิกายน 2569',
    round2Purpose: isMsu 
      ? 'สำหรับค่าอาหารและกิจกรรมตลอดการเข้าร่วมโครงการ (นิสิต มมส ไม่มีค่าใช้จ่ายด้านที่พัก)' 
      : 'สำหรับค่าใช้จ่ายด้านที่พักและอาหารตลอดการเข้าร่วมโครงการ',
    accommodationIncluded: !isMsu,
    feeNote: isMsu 
      ? 'นิสิตมหาวิทยาลัยมหาสารคาม 650 บาท (ไม่มีค่าที่พัก) • รอบ 1: 400 บ. / รอบ 2: 250 บ.'
      : 'ต่างมหาวิทยาลัย 850 บาท (รวมค่าที่พักหอพักกุดรัง มมส) • รอบ 1: 400 บ. / รอบ 2: 450 บ.'
  };
};

export const cleanHealthText = (val) => {
  if (!val || typeof val !== 'string') return '';
  return val.trim();
};

export const getApplicantMedical = (reg) => {
  if (!reg) return '';
  return cleanHealthText(
    reg.medical_history ||
    reg.congenital_disease ||
    reg.medical_conditions ||
    reg.chronic_disease ||
    ''
  );
};

export const getApplicantAllergy = (reg) => {
  if (!reg) return '';
  return cleanHealthText(
    reg.food_allergy ||
    reg.allergic_food ||
    reg.drug_allergy ||
    ''
  );
};

const NEGATIVE_HEALTH_TERMS = new Set([
  '',
  '-',
  '--',
  '---',
  '.',
  '..',
  '/',
  '//',
  'none',
  'no',
  'n/a',
  'na',
  'nil',
  'normal',
  'ไม่มี',
  'ไม่มีครับ',
  'ไม่มีค่ะ',
  'ไม่มีคับ',
  'ไม่มีคะ',
  'ไม่มีโรคประจำตัว',
  'ไม่มีโรค',
  'ไม่มีข้อจำกัดทางกาย',
  'ไม่มีประวัติแพ้ยาหรืออาหาร',
  'ไม่มีประวัติแพ้ยาและอาหาร',
  'ไม่มีประวัติการแพ้',
  'ไม่มีประวัติแพ้ยา',
  'ไม่มีประวัติแพ้อาหาร',
  'ไม่แพ้',
  'ไม่แพ้ครับ',
  'ไม่แพ้ค่ะ',
  'ไม่แพ้อะไร',
  'ไม่แพ้อาหาร',
  'ไม่แพ้ยา',
  'ปกติ',
  'ปกติครับ',
  'ปกติค่ะ',
  'ร่างกายปกติ',
  'สุขภาพปกติ'
]);

export const hasHealthCondition = (text) => {
  if (!text || typeof text !== 'string') return false;
  const cleaned = text.trim().toLowerCase();
  if (NEGATIVE_HEALTH_TERMS.has(cleaned)) return false;
  const stripped = cleaned.replace(/[\s\-_./\\,;:]/g, '');
  if (NEGATIVE_HEALTH_TERMS.has(stripped)) return false;
  return cleaned.length > 0;
};

export const hasMedicalCondition = (reg) => {
  return hasHealthCondition(getApplicantMedical(reg));
};

export const hasFoodOrDrugAllergy = (reg) => {
  return hasHealthCondition(getApplicantAllergy(reg));
};

export const getCateringCategory = (text) => {
  if (!text || typeof text !== 'string') return 'ทั่วไป';
  const s = text.toLowerCase();
  if (s.includes('มังสวิรัติ') || s.includes('เจ') || s.includes('vegan') || s.includes('vegetarian')) return 'มังสวิรัติ / เจ';
  if (s.includes('อิสลาม') || s.includes('ฮาลาล') || s.includes('halal') || s.includes('มุสลิม')) return 'อาหารฮาลาล (อิสลาม)';
  if (s.includes('กุ้ง') || s.includes('ปู') || s.includes('ทะเล') || s.includes('seafood') || s.includes('หอย') || s.includes('หมึก')) return 'แพ้อาหารทะเล / กุ้ง / ปู';
  if (s.includes('ถั่ว') || s.includes('peanut') || s.includes('nut')) return 'แพ้ถั่วลิสง / ถั่วเปลือกแข็ง';
  if (s.includes('ไข่') || s.includes('egg')) return 'แพ้ไข่';
  if (s.includes('นม') || s.includes('milk') || s.includes('lactose')) return 'แพ้นมวัว / แลคโตส';
  if (s.includes('ยา') || s.includes('penicillin') || s.includes('เพนนิซิลิน') || s.includes('พารา') || s.includes('nsaid')) return 'แพ้ยา';
  return 'ข้อจำกัดอาหาร / อื่นๆ';
};

export const DEFAULT_MERCHANDISE_CONFIG = {
  google_form: {
    enabled: true,
    url: 'https://docs.google.com/forms',
    title: 'สั่งซื้อเสื้อ/กางเกงโครงการผ่าน Google Form (ช่องทางสำรอง)',
    description: 'กรณีระบบขัดข้องหรือไม่สะดวกสั่งซื้อผ่านเว็บ สามารถกรอกสั่งซื้อผ่าน Google Forms ได้ตลอด 24 ชม.'
  },
  pickup: {
    location: 'อาคารพลศึกษา มหาวิทยาลัยมหาสารคาม (มมส)',
    short_location: 'อาคารพลศึกษา มมส',
    schedule: 'วันรายงานตัวเปิดโครงการ วันที่ 13 ก.พ. 2570 (เวลา 08:30 - 16:30 น.)',
    date: '13 ก.พ. 2570',
    contact_phone: '098-329-6762',
    note: 'แสดงบัตรนี้หรือบัตรประจำตัวประชาชนต่อเจ้าหน้าที่ ณ จุดลงทะเบียนรับเสื้อ'
  },
  payment: {
    bank_name: 'ธนาคารไทยพาณิชย์',
    account_number: '594-264865-5',
    account_name: 'นางสาวมัญชุพร ยังเหล็ก',
    promptpay: '',
    contact_phone: '098-329-6762',
    note: 'กรุณาโอนเงินตามยอดที่ระบุและแนบหลักฐานสลิปโอนเงินทุกครั้ง'
  },
  products: [
    {
      id: 'prod_official_shirt',
      name: 'เสื้อฝึก Joint Response Exercise (JRE 2027) คอเต่าซิป แขนสั้น โทนสีเทา–ดำ',
      enabled: true,
      allow_order: true,
      category: 'shirt',
      base_price: 400,
      description: 'เสื้อฝึก Joint Response Exercise (JRE 2027) ออกแบบในรูปแบบ เสื้อคอเต่าซิป แขนสั้น โทนสี เทา–ดำ แขนสโลปสีดำ ปักตรา JRE 2027 และตราสัญลักษณ์ USVN พร้อมตราภาคีเครือข่ายด้านหลัง เนื้อผ้าคุณภาพสูง ใส่สบาย ระบายอากาศได้ดี พร้อมลุยทุกภารกิจ (พรีออเดอร์ รวมอยู่ในค่างวดที่ 1 ของผู้สมัคร หรือสั่งซื้อเพิ่มเติม)',
      image: '/images/merchandise/jre_shirt_official.jpg',
      size_chart_image: '/images/merchandise/jre_shirt_size_chart.jpg',
      images: [
        '/images/merchandise/jre_shirt_official.jpg',
        '/images/merchandise/jre_shirt_size_chart.jpg'
      ],
      colors: ['สีเทาตัดดำ (Official Tactical Gray-Black)'],
      sizes: [
        { name: 'S', chest: '36 นิ้ว', length: '26 นิ้ว', extra_price: 0, is_special: false },
        { name: 'M', chest: '38 นิ้ว', length: '27 นิ้ว', extra_price: 0, is_special: false },
        { name: 'L', chest: '40 นิ้ว', length: '28 นิ้ว', extra_price: 0, is_special: false },
        { name: 'XL', chest: '42 นิ้ว', length: '29 นิ้ว', extra_price: 0, is_special: false },
        { name: '2XL', chest: '44 นิ้ว', length: '30 นิ้ว', extra_price: 0, is_special: false },
        { name: '3XL', chest: '46 นิ้ว', length: '31 นิ้ว', extra_price: 30, is_special: true },
        { name: '4XL', chest: '48 นิ้ว', length: '32 นิ้ว', extra_price: 50, is_special: true },
        { name: '5XL', chest: '50 นิ้ว', length: '33 นิ้ว', extra_price: 70, is_special: true },
        { name: '6XL', chest: '52 นิ้ว', length: '34 นิ้ว', extra_price: 100, is_special: true },
        { name: '7XL', chest: '54 นิ้ว', length: '35 นิ้ว', extra_price: 120, is_special: true },
        { name: '8XL', chest: '56 นิ้ว', length: '36 นิ้ว', extra_price: 140, is_special: true },
        { name: '9XL', chest: '58 นิ้ว', length: '37 นิ้ว', extra_price: 160, is_special: true },
        { name: '10XL', chest: '60 นิ้ว', length: '38 นิ้ว', extra_price: 180, is_special: true }
      ]
    },
    {
      id: 'prod_tshirt',
      name: 'เสื้อยืดที่ระลึก JRE 2027 (Official Rescue T-Shirt)',
      enabled: false,
      allow_order: false,
      category: 'shirt',
      base_price: 250,
      description: 'เสื้อยืดสกรีนลายสัญลักษณ์ JRE 2027 และชมรมกู้ภัยราชพฤกษ์ มมส เนื้อผ้า Micro Polyester เกรดพรีเมียม แห้งไว ระบายอากาศยอดเยี่ยม เหมาะสำหรับฝึกภาคสนามและสวมใส่ทำกิจกรรม (ยังไม่เปิดจำหน่าย)',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'
      ],
      colors: ['สีกรมท่า (Navy Blue)', 'สีดำเข้ม (Midnight Black)'],
      sizes: [
        { name: 'S', chest: '36 นิ้ว', length: '26 นิ้ว', extra_price: 0 },
        { name: 'M', chest: '38 นิ้ว', length: '27 นิ้ว', extra_price: 0 },
        { name: 'L', chest: '40 นิ้ว', length: '28 นิ้ว', extra_price: 0 },
        { name: 'XL', chest: '42 นิ้ว', length: '29 นิ้ว', extra_price: 0 },
        { name: '2XL', chest: '44 นิ้ว', length: '30 นิ้ว', extra_price: 30, is_special: true }
      ]
    },
    {
      id: 'prod_pants_tactical',
      name: 'กางเกงฝึกยุทธวิธีกู้ภัย JRE Tactical Rescue Pants',
      enabled: false,
      allow_order: false,
      category: 'pants',
      base_price: 490,
      description: 'กางเกงขายาวผ้าตาราง Ripstop กันละอองน้ำ กระเป๋าข้างยุทธวิธี 6 ช่อง เสริมความแข็งแรงบริเวณหัวเข่าและเป้ากางเกง ออกแบบเพื่อความคล่องตัวในการฝึกซ้อมกู้ภัย ลุยน้ำ ลุยป่า (ยังไม่เปิดจำหน่าย)',
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80'
      ],
      colors: ['สีดำยุทธวิธี (Tactical Black)', 'สีกรมท่ากู้ภัย (Rescue Navy)'],
      sizes: [
        { name: 'S', waist: '28-30 นิ้ว', length: '39 นิ้ว', extra_price: 0 },
        { name: 'M', waist: '31-33 นิ้ว', length: '40 นิ้ว', extra_price: 0 },
        { name: 'L', waist: '34-36 นิ้ว', length: '41 นิ้ว', extra_price: 0 },
        { name: 'XL', waist: '37-39 นิ้ว', length: '42 นิ้ว', extra_price: 0 },
        { name: '2XL', waist: '40-42 นิ้ว', length: '43 นิ้ว', extra_price: 40, is_special: true }
      ]
    },
    {
      id: 'prod_shorts_training',
      name: 'กางเกงขาสั้นฝึกภาคสนาม JRE Training Shorts',
      enabled: false,
      allow_order: false,
      category: 'pants',
      base_price: 250,
      description: 'กางเกงขาสั้นผ้าร่มระบายอากาศ มีกระเป๋าซิปข้าง 2 ฝั่ง และสายผูกเอว สำหรับการฝึกกิจกรรมทางน้ำ ปฐมพยาบาล หรือวิ่งออกกำลังกาย (ยังไม่เปิดจำหน่าย)',
      image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&q=80'
      ],
      colors: ['สีดำขอบส้ม', 'สีกรมท่าขอบขาว'],
      sizes: [
        { name: 'S', waist: '26-29 นิ้ว', extra_price: 0 },
        { name: 'M', waist: '30-32 นิ้ว', extra_price: 0 },
        { name: 'L', waist: '33-35 นิ้ว', extra_price: 0 },
        { name: 'XL', waist: '36-38 นิ้ว', extra_price: 0 }
      ]
    }
  ]
};

// Start with empty real merchandise orders (No mock data)
export const DEFAULT_MERCHANDISE_ORDERS = [];

// 8 Official Network Universities & Rescue Clubs (From Official Registration Form)
export const OFFICIAL_NETWORK_INSTITUTIONS = [
  {
    id: 'msu',
    shortTag: 'มมส',
    university: 'มหาวิทยาลัยมหาสารคาม (มมส)',
    club: 'ชมรมกู้ภัยราชพฤกษ์',
    fullName: 'ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม (มมส)',
    label: '-มมส (ชมรมกู้ภัยราชพฤกษ์ มหาวิทยาลัยมหาสารคาม)',
    pillText: 'มมส (กู้ภัยราชพฤกษ์)'
  },
  {
    id: 'kku',
    shortTag: 'มข',
    university: 'มหาวิทยาลัยขอนแก่น (มข)',
    club: 'TSI - Tactic of Special Services and Investigation',
    fullName: 'TSI - Tactic of Special Services and Investigation มหาวิทยาลัยขอนแก่น (มข)',
    label: '-มข (TSI - Tactic of Special Services andInvestigation มหาวิทยาลัยขอนแก่น)',
    pillText: 'มข (TSI)'
  },
  {
    id: 'sut',
    shortTag: 'มทส',
    university: 'มหาวิทยาลัยเทคโนโลยีสุรนารี (มทส)',
    club: 'ชมรมจิตอาสาแสดทอง องค์การนักศึกษา',
    fullName: 'ชมรมจิตอาสาแสดทอง องค์การนักศึกษา มหาวิทยาลัยเทคโนโลยีสุรนารี (มทส)',
    label: '-มทส (ชมรมจิตอาสาแสดทอง องค์การนักศึกษา มหาวิทยาลัยเทคโนโลยีสุรนารี)',
    pillText: 'มทส (จิตอาสาแสดทอง)'
  },
  {
    id: 'cmu',
    shortTag: 'มช',
    university: 'มหาวิทยาลัยเชียงใหม่ (มช)',
    club: 'ชมรมปฏิบัติการกู้ภัยและบรรเทาสาธารณภัย',
    fullName: 'ชมรมปฏิบัติการกู้ภัยและบรรเทาสาธารณภัย มหาวิทยาลัยเชียงใหม่ (มช)',
    label: '-มช (ชมรมปฏิบัติการกู้ภัยและบรรเทาสาธารณภัย มหาวิทยาลัยเชียงใหม่)',
    pillText: 'มช (กู้ภัย มช)'
  },
  {
    id: 'ksu',
    shortTag: 'มกส',
    university: 'มหาวิทยาลัยกาฬสินธุ์ (มกส)',
    club: 'ชมรมกู้ชีพกู้ภัยมหาวิทยาลัยกาฬสินธุ์ KSU Rescue',
    fullName: 'ชมรมกู้ชีพกู้ภัยมหาวิทยาลัยกาฬสินธุ์ KSU Rescue (มกส)',
    label: '-มกส (ชมรมกู้ชีพกู้ภัยมหาวิทยาลัยกาฬสินธุ์ KSU Rescue)',
    pillText: 'มกส (KSU Rescue)'
  },
  {
    id: 'udru',
    shortTag: 'มรภ.อุดรธานี',
    university: 'มหาวิทยาลัยราชภัฏอุดรธานี (มรภ.อุดรธานี)',
    club: 'ชมรมอาสาสมัครกู้ชีพ-กู้ภัย',
    fullName: 'ชมรมอาสาสมัครกู้ชีพ-กู้ภัย มหาวิทยาลัยราชภัฏอุดรธานี (มรภ.อุดรธานี)',
    label: '-มอ ราชภัฏอุดรธานี (ชมรมอาสาสมัครกู้ชีพ-กู้ภัย มหาวิทยาลัยราชภัฏอุดรธานี)',
    pillText: 'มรภ.อุดรธานี (กู้ชีพ-กู้ภัย)'
  },
  {
    id: 'wu',
    shortTag: 'มวล.',
    university: 'มหาวิทยาลัยวลัยลักษณ์ (มวล.)',
    club: 'ชมรมนักวิทยุสมัครเล่นและอาสาบรรเทาภัย (วลัยอาสา)',
    fullName: 'ชมรมนักวิทยุสมัครเล่นและอาสาบรรเทาภัย (วลัยอาสา) มหาวิทยาลัยวลัยลักษณ์ (มวล.)',
    label: '-มอ วลัยลักษณ์ (ชมรมนักวิทยุสมัครเล่นและอาสาบรรเทาภัย มหาวิทยาลัยวลัยลักษณ์ (วลัยอาสา))',
    pillText: 'มวล. (วลัยอาสา)'
  },
  {
    id: 'ku_csc',
    shortTag: 'มก.ฉกส',
    university: 'มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร (มก.ฉกส)',
    club: 'ชมรมกู้ชีพ-กู้ภัย',
    fullName: 'ชมรมกู้ชีพ-กู้ภัย มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร (มก.ฉกส)',
    label: '-มก.ฉกส (ชมรมกู้ชีพ-กู้ภัย มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตเฉลิมพระเกียรติ จังหวัดสกลนคร)',
    pillText: 'มก.ฉกส (กู้ชีพ-กู้ภัย)'
  }
];

// ข้อมูลหอพักและสิ่งอำนวยความสะดวกในห้องพัก (หอพักกุดรัง มมส)
export const ACCOMMODATION_DETAILS = {
  name: 'หอพักกุดรัง มมส',
  fullName: 'หอพักกุดรัง กองอาคารสถานที่ มหาวิทยาลัยมหาสารคาม',
  location: 'มหาวิทยาลัยมหาสารคาม (มมส)',
  type: 'ที่พักค้างแรม 1 คืน สำหรับผู้เข้าร่วมโครงการ Joint Response Exercise (JRE 2027)',
  image: '/images/accommodation/kudrang_room.jpg',
  caption: 'ตัวอย่างห้องพักจริง หอพักกุดรัง มหาวิทยาลัยมหาสารคาม',
  description: 'ที่พักค้างแรมอย่างเป็นทางการสำหรับผู้เข้าร่วมโครงการ สะอาด ปลอดภัย สะดวกสบาย พร้อมสิ่งอำนวยความสะดวกครบครัน',
  amenities: [
    {
      id: 'water_heater',
      name: 'เครื่องทำน้ำอุ่น',
      badge: 'ระบบน้ำอุ่น',
      desc: 'ระบบทำน้ำอุ่นในห้องน้ำทุกห้อง เพื่อสุขอนามัยและความผ่อนคลาย'
    },
    {
      id: 'air_conditioner',
      name: 'แอร์ (เครื่องปรับอากาศ)',
      badge: 'ปรับอากาศเย็นสบาย',
      desc: 'เครื่องปรับอากาศเย็นสบาย พักผ่อนได้อย่างเต็มอิ่มตลอดคืน'
    },
    {
      id: 'work_desk',
      name: 'โต๊ะเขียนงาน',
      badge: 'โต๊ะ-เก้าอี้พร้อม',
      desc: 'โต๊ะเขียนงานและเก้าอี้ สำหรับบันทึกหรือทบทวนบทเรียน'
    },
    {
      id: 'wardrobe',
      name: 'ตู้เสื้อผ้า',
      badge: 'พื้นที่เก็บสัมภาระ',
      desc: 'ตู้เสื้อผ้าส่วนตัวสำหรับจัดเก็บชุดกู้ภัยและสัมภาระ'
    },
    {
      id: 'pillow',
      name: 'หมอน',
      badge: 'มีให้พร้อม',
      desc: 'หมอนหนุนพร้อมปลอกหมอนสะอาด จัดเตรียมไว้ประจำเตียง'
    },
    {
      id: 'blanket',
      name: 'ผ้าห่ม',
      badge: 'มีให้พร้อม',
      desc: 'ผ้าห่มอุ่นสบายเตรียมพร้อมไว้ให้ผู้เข้าพักทุกคน ไม่ต้องนำมาเอง'
    }
  ]
};

// รายชื่อผู้ส่งข้อความแจ้งเตือนและระบบงานต่างๆ ของ Admin (แยกตามฝ่าย/ระบบ ไม่ได้จำกัดแค่ฝ่ายประสานงาน & การเงิน)
export const ADMIN_MESSAGE_SENDERS = [
  {
    key: 'admin_central',
    senderName: 'ผู้ดูแลระบบกลาง (Admin JRE 2027)',
    roleBadge: 'Admin ระบบกลาง',
    systemName: 'ระบบจัดการผู้สมัครและส่วนกลาง',
    shortLabel: '🛡️ Admin กลาง',
    defaultTitle: 'แจ้งเตือนจากผู้ดูแลระบบ JRE 2027',
    colorTheme: 'purple'
  },
  {
    key: 'finance_coord',
    senderName: 'ฝ่ายประสานงาน & การเงิน JRE 2027',
    roleBadge: 'Admin การเงิน',
    systemName: 'ระบบการเงินและตรวจสอบสลิปโอนเงิน',
    shortLabel: '💳 ฝ่ายประสานงาน & การเงิน',
    defaultTitle: 'แจ้งผลการตรวจสอบสลิป / ยอดชำระเงิน',
    colorTheme: 'amber'
  },
  {
    key: 'registration_docs',
    senderName: 'ฝ่ายทะเบียน & เอกสารผู้สมัคร JRE 2027',
    roleBadge: 'Admin ทะเบียน/เอกสาร',
    systemName: 'ระบบขอและตรวจสอบเอกสารแนบ',
    shortLabel: '📄 ฝ่ายทะเบียน & เอกสาร',
    defaultTitle: 'แจ้งเรื่องเอกสารประกอบการสมัคร',
    colorTheme: 'emerald'
  },
  {
    key: 'accommodation_shirt',
    senderName: 'ฝ่ายจัดกลุ่มฝึก ห้องพัก & เสื้อฝึก JRE 2027',
    roleBadge: 'Admin ห้องพัก/เสื้อฝึก',
    systemName: 'ระบบจัดสรรห้องพัก กลุ่มฝึก และสวัสดิการเสื้อ',
    shortLabel: '🏢 ฝ่ายห้องพัก/กลุ่มฝึก/เสื้อ',
    defaultTitle: 'แจ้งการจัดกลุ่มฝึก ห้องพัก หรือไซส์เสื้อ',
    colorTheme: 'sky'
  },
  {
    key: 'medical_safety',
    senderName: 'ฝ่ายการแพทย์ & ความปลอดภัย (Safety)',
    roleBadge: 'Admin การแพทย์/ID Scanner',
    systemName: 'ระบบคัดกรองสุขภาพและสแกนบัตรประจำตัว',
    shortLabel: '🩺 ฝ่ายการแพทย์ & Safety',
    defaultTitle: 'แจ้งเตือนด้านสุขภาพและความปลอดภัยในการฝึก',
    colorTheme: 'rose'
  },
  {
    key: 'director_board',
    senderName: 'กองอำนวยการฝึกโครงการ JRE 2027',
    roleBadge: 'กองอำนวยการฝึก',
    systemName: 'ระบบประกาศและคำสั่งการฝึกอบรม',
    shortLabel: '📢 กองอำนวยการฝึก',
    defaultTitle: 'ประกาศสำคัญจากกองอำนวยการฝึก JRE 2027',
    colorTheme: 'indigo'
  },
  {
    key: 'custom',
    senderName: 'ผู้ดูแลระบบ (กำหนดชื่อผู้ส่งเอง)',
    roleBadge: 'Admin',
    systemName: 'ระบบแจ้งเตือนเฉพาะกิจ',
    shortLabel: '✏️ กำหนดผู้ส่งเอง',
    defaultTitle: 'ข้อความแจ้งเตือนจากผู้ดูแลระบบ',
    colorTheme: 'purple'
  }
];

// รายการเอกสารมาตรฐานสำหรับให้ Admin กดขอ / กดยกเลิกการขอ ได้ในคลิกเดียว
export const STANDARD_REQUESTABLE_DOCS = [
  {
    code: 'id_card_copy',
    title: 'สำเนาบัตรประจำตัวประชาชน',
    defaultSystem: 'ฝ่ายทะเบียน & เอกสารผู้สมัคร JRE 2027',
    desc: 'ใช้ยืนยันตัวตนและทำประกันอุบัติเหตุระหว่างการฝึก'
  },
  {
    code: 'house_reg_copy',
    title: 'สำเนาทะเบียนบ้าน',
    defaultSystem: 'ฝ่ายทะเบียน & เอกสารผู้สมัคร JRE 2027',
    desc: 'เอกสารประกอบหลักฐานทางทะเบียนของผู้เข้าร่วม'
  },
  {
    code: 'medical_cert',
    title: 'ใบรับรองแพทย์ / ประวัติการรักษา',
    defaultSystem: 'ฝ่ายการแพทย์ & ความปลอดภัย (Safety)',
    desc: 'สำหรับผู้มีโรคประจำตัวหรือต้องการการดูแลพิเศษ'
  },
  {
    code: 'parent_consent',
    title: 'หนังสือยินยอมจากผู้ปกครอง',
    defaultSystem: 'ฝ่ายทะเบียน & เอกสารผู้สมัคร JRE 2027',
    desc: 'กรณีผู้สมัครอายุต่ำกว่าเกณฑ์หรือตามระเบียบสังกัด'
  },
  {
    code: 'id_photo_1inch',
    title: 'รูปถ่ายหน้าตรง 1 นิ้ว (สำหรับทำบัตร ID Card)',
    defaultSystem: 'ฝ่ายทะเบียน & เอกสารผู้สมัคร JRE 2027',
    desc: 'รูปถ่ายชุดสุภาพหรือชุดปฏิบัติการเห็นใบหน้าชัดเจน'
  },
  {
    code: 'extra_payment_slip',
    title: 'หลักฐานสลิปการโอนเงินเพิ่มเติม / สลิปแก้ไข',
    defaultSystem: 'ฝ่ายประสานงาน & การเงิน JRE 2027',
    desc: 'กรณีสลิปเดิมไม่ชัดเจนหรือโอนส่วนต่างเพิ่มเติม'
  },
  {
    code: 'student_staff_id',
    title: 'สำเนาบัตรนิสิต/นักศึกษา หรือหนังสือรับรองสังกัด',
    defaultSystem: 'ฝ่ายทะเบียน & เอกสารผู้สมัคร JRE 2027',
    desc: 'ยืนยันสังกัดมหาวิทยาลัยหรือชมรมเครือข่าย'
  }
];

export const resolveMessageSenderInfo = (msg = {}) => {
  if (!msg || typeof msg !== 'object') {
    return ADMIN_MESSAGE_SENDERS[0];
  }

  // 1. If message explicitly specifies custom sender or sender_key
  if (msg.sender_key && msg.sender_key !== 'custom') {
    const matched = ADMIN_MESSAGE_SENDERS.find(s => s.key === msg.sender_key);
    if (matched) {
      return {
        ...matched,
        senderName: msg.sender_name || matched.senderName,
        roleBadge: msg.sender_role || matched.roleBadge,
        systemName: msg.system_name || matched.systemName,
        title: msg.title || matched.defaultTitle
      };
    }
  }

  if (msg.sender_name) {
    return {
      key: msg.sender_key || 'custom',
      senderName: msg.sender_name,
      roleBadge: msg.sender_role || 'Admin',
      systemName: msg.system_name || 'ระบบแจ้งเตือนโครงการ JRE 2027',
      shortLabel: msg.sender_short || `🛡️ ${msg.sender_name}`,
      defaultTitle: msg.title || 'ข้อความจากผู้ดูแลระบบ',
      title: msg.title || 'ข้อความจากผู้ดูแลระบบ',
      colorTheme: msg.color_theme || 'purple'
    };
  }

  // 2. Auto-infer from sent_via or content for existing/legacy messages
  if (msg.sent_via === 'id_card_scanner') {
    const med = ADMIN_MESSAGE_SENDERS.find(s => s.key === 'medical_safety');
    return {
      ...med,
      title: msg.title || med.defaultTitle
    };
  }

  if (msg.sent_via === 'doc_request' || msg.category === 'docs') {
    const docSender = ADMIN_MESSAGE_SENDERS.find(s => s.key === 'registration_docs');
    return {
      ...docSender,
      title: msg.title || docSender.defaultTitle
    };
  }

  const text = String(msg.text || '');
  if (/เอกสาร|บัตรประชาชน|ทะเบียนบ้าน|ใบรับรองแพทย์|ใบยินยอม/.test(text)) {
    const docSender = ADMIN_MESSAGE_SENDERS.find(s => s.key === 'registration_docs');
    return {
      ...docSender,
      title: msg.title || docSender.defaultTitle
    };
  }
  if (/ห้องพัก|กลุ่มฝึก|ไซส์เสื้อ|เสื้อฝึก/.test(text) && !/สลิป|โอนเงิน|ค้างชำระ/.test(text)) {
    const accSender = ADMIN_MESSAGE_SENDERS.find(s => s.key === 'accommodation_shirt');
    return {
      ...accSender,
      title: msg.title || accSender.defaultTitle
    };
  }
  if (/สลิป|โอนเงิน|ชำระ|ค่างวด|ฝ่ายการเงิน|บัญชี/.test(text)) {
    const finSender = ADMIN_MESSAGE_SENDERS.find(s => s.key === 'finance_coord');
    return {
      ...finSender,
      title: msg.title || finSender.defaultTitle
    };
  }

  // Default to Central Admin
  const central = ADMIN_MESSAGE_SENDERS[0];
  return {
    ...central,
    title: msg.title || central.defaultTitle
  };
};





