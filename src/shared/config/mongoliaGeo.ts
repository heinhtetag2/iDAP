export interface Province {
  code: string
  name_mn: string
  name_en: string
  districts: District[]
}

export interface District {
  code: string
  name_mn: string
  name_en: string
}

export const PROVINCES: Province[] = [
  {
    code: 'UB', name_mn: 'Улаанбаатар', name_en: 'Ulaanbaatar',
    districts: [
      { code: 'BG', name_mn: 'Баянгол', name_en: 'Bayangol' },
      { code: 'BZD', name_mn: 'Баянзүрх', name_en: 'Bayanzurkh' },
      { code: 'SBD', name_mn: 'Сүхбаатар', name_en: 'Sukhbaatar' },
      { code: 'CHD', name_mn: 'Чингэлтэй', name_en: 'Chingeltei' },
      { code: 'KUD', name_mn: 'Хан-Уул', name_en: 'Khan-Uul' },
      { code: 'SGD', name_mn: 'Сонгинохайрхан', name_en: 'Songinokhairkhan' },
      { code: 'ND', name_mn: 'Налайх', name_en: 'Nalaikh' },
      { code: 'BGD', name_mn: 'Багануур', name_en: 'Baganuur' },
      { code: 'BHD', name_mn: 'Багахангай', name_en: 'Bagakhangai' },
    ],
  },
  {
    code: 'AH', name_mn: 'Архангай', name_en: 'Arkhangai',
    districts: [
      { code: 'TST', name_mn: 'Цэцэрлэг', name_en: 'Tsetserleg' },
    ],
  },
  {
    code: 'BU', name_mn: 'Баян-Өлгий', name_en: 'Bayan-Olgii',
    districts: [
      { code: 'OLG', name_mn: 'Өлгий', name_en: 'Olgii' },
    ],
  },
  {
    code: 'BO', name_mn: 'Баянхонгор', name_en: 'Bayankhongor',
    districts: [
      { code: 'BKH', name_mn: 'Баянхонгор', name_en: 'Bayankhongor' },
    ],
  },
  {
    code: 'BH', name_mn: 'Булган', name_en: 'Bulgan',
    districts: [
      { code: 'BLG', name_mn: 'Булган', name_en: 'Bulgan' },
    ],
  },
  {
    code: 'DK', name_mn: 'Дархан-Уул', name_en: 'Darkhan-Uul',
    districts: [
      { code: 'DRK', name_mn: 'Дархан', name_en: 'Darkhan' },
    ],
  },
  {
    code: 'DD', name_mn: 'Дорнод', name_en: 'Dornod',
    districts: [
      { code: 'CHB', name_mn: 'Чойбалсан', name_en: 'Choibalsan' },
    ],
  },
  {
    code: 'DG', name_mn: 'Дорноговь', name_en: 'Dornogovi',
    districts: [
      { code: 'SAI', name_mn: 'Сайншанд', name_en: 'Sainshand' },
    ],
  },
  {
    code: 'DU', name_mn: 'Дундговь', name_en: 'Dundgovi',
    districts: [
      { code: 'MDD', name_mn: 'Мандалговь', name_en: 'Mandalgovi' },
    ],
  },
  {
    code: 'GS', name_mn: 'Говь-Алтай', name_en: 'Govi-Altai',
    districts: [
      { code: 'ALT', name_mn: 'Алтай', name_en: 'Altai' },
    ],
  },
  {
    code: 'GM', name_mn: 'Говьсүмбэр', name_en: 'Govisumber',
    districts: [
      { code: 'CHR', name_mn: 'Чойр', name_en: 'Choir' },
    ],
  },
  {
    code: 'HN', name_mn: 'Хэнтий', name_en: 'Khentii',
    districts: [
      { code: 'OND', name_mn: 'Өндөрхаан', name_en: 'Ondorkhaan' },
    ],
  },
  {
    code: 'HD', name_mn: 'Ховд', name_en: 'Khovd',
    districts: [
      { code: 'HVD', name_mn: 'Ховд', name_en: 'Khovd' },
    ],
  },
  {
    code: 'HS', name_mn: 'Хөвсгөл', name_en: 'Khovsgol',
    districts: [
      { code: 'MRN', name_mn: 'Мөрөн', name_en: 'Murun' },
    ],
  },
  {
    code: 'MN', name_mn: 'Өмнөговь', name_en: 'Omnogovi',
    districts: [
      { code: 'DLG', name_mn: 'Даланзадгад', name_en: 'Dalanzadgad' },
    ],
  },
  {
    code: 'OH', name_mn: 'Орхон', name_en: 'Orkhon',
    districts: [
      { code: 'ERD', name_mn: 'Эрдэнэт', name_en: 'Erdenet' },
    ],
  },
  {
    code: 'OV', name_mn: 'Өвөрхангай', name_en: 'Ovorkhangai',
    districts: [
      { code: 'ARV', name_mn: 'Арвайхээр', name_en: 'Arvaikheer' },
    ],
  },
  {
    code: 'SL', name_mn: 'Сэлэнгэ', name_en: 'Selenge',
    districts: [
      { code: 'SHR', name_mn: 'Сүхбаатар', name_en: 'Sukhbaatar' },
    ],
  },
  {
    code: 'TU', name_mn: 'Төв', name_en: 'Tuv',
    districts: [
      { code: 'ZMD', name_mn: 'Зуунмод', name_en: 'Zuunmod' },
    ],
  },
  {
    code: 'UV', name_mn: 'Увс', name_en: 'Uvs',
    districts: [
      { code: 'ULG', name_mn: 'Улаангом', name_en: 'Ulaangom' },
    ],
  },
  {
    code: 'ZH', name_mn: 'Завхан', name_en: 'Zavkhan',
    districts: [
      { code: 'ULS', name_mn: 'Улиастай', name_en: 'Uliastai' },
    ],
  },
]

export function getProvinceByCode(code: string) {
  return PROVINCES.find((p) => p.code === code)
}

export function getDistrictsByProvince(provinceCode: string) {
  return PROVINCES.find((p) => p.code === provinceCode)?.districts ?? []
}
