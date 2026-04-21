export const PAKISTAN_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu and Kashmir',
  'Gilgit-Baltistan',
] as const;

export type PakistanProvince = typeof PAKISTAN_PROVINCES[number];

export const PAKISTAN_CITIES: Record<PakistanProvince, string[]> = {
  Punjab: [
    'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot', 
    'Bahawalpur', 'Sargodha', 'Gujrat', 'Sheikhupura', 'Rahim Yar Khan', 
    'Jhang', 'Sahiwal', 'Okara', 'Wah Cantt', 'Kasur', 'Dera Ghazi Khan',
    'Chiniot', 'Kamoke', 'Hafizabad', 'Sadiqabad', 'Burewala', 'Khanewal',
    'Muzaffargarh', 'Mandi Bahauddin', 'Jhelum', 'Khanpur', 'Pakpattan'
  ],
  Sindh: [
    'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah', 'Mirpur Khas', 
    'Jacobabad', 'Shikarpur', 'Khairpur', 'Tharparkar', 'Thatta', 'Badin', 
    'Dadu', 'Kandhkot', 'Kotri', 'Moro', 'Tando Adam', 'Tando Allahyar'
  ],
  'Khyber Pakhtunkhwa': [
    'Peshawar', 'Mardan', 'Mingora', 'Kohat', 'Abbottabad', 'Swabi', 
    'Dera Ismail Khan', 'Nowshera', 'Mansehra', 'Charsadda', 'Haripur', 
    'Swat', 'Chitral', 'Bannu', 'Lakki Marwat', 'Tank', 'Karak', 'Malakand'
  ],
  Balochistan: [
    'Quetta', 'Turbat', 'Khuzdar', 'Hub', 'Chaman', 'Gwadar', 'Sibi', 
    'Zhob', 'Loralai', 'Nushki', 'Dera Murad Jamali', 'Kharan', 'Mastung'
  ],
  'Islamabad Capital Territory': [
    'Islamabad'
  ],
  'Azad Jammu and Kashmir': [
    'Muzaffarabad', 'Mirpur', 'Kotli', 'Rawalakot', 'Bagh', 'Bhimber', 'Sudhanoti'
  ],
  'Gilgit-Baltistan': [
    'Gilgit', 'Skardu', 'Diamer', 'Ghizer', 'Astore', 'Ghanche', 'Hunza', 'Nagar'
  ],
};
