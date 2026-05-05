const DEFAULT_HEALTH_TIPS: Record<string, string[]> = {
  vi: [
    'Ăn ít nhất 400g (5 phần) trái cây và rau mỗi ngày để giảm nguy cơ bệnh không lây nhiễm.',
    'Hạn chế lượng muối ăn vào dưới 5g mỗi ngày (khoảng 1 muỗng cà phê) để ngừa cao huyết áp.',
    'Giảm lượng đường tự do xuống dưới 10% (tốt nhất là 5%) tổng năng lượng nạp vào.',
    'Thay thế chất béo bão hòa bằng chất béo không bão hòa (như dầu cá, bơ, dầu hướng dương).',
    'Tránh hoàn toàn thực phẩm chứa chất béo chuyển hóa (trans-fat) công nghiệp.',
    'Bú mẹ hoàn toàn trong 6 tháng đầu đời là cách tốt nhất để trẻ khởi đầu khỏe mạnh.',
    'Người trưởng thành nên tập ít nhất 150-300 phút hoạt động thể chất cường độ vừa mỗi tuần.',
    'Uống rượu bia không có mức độ nào là an toàn hoàn toàn cho sức khỏe.',
    'Bỏ thuốc lá giúp phục hồi chức năng phổi và giảm nguy cơ đột quỵ chỉ sau vài năm.',
    'Tiêm chủng là cách an toàn và hiệu quả nhất để bảo vệ bạn khỏi các bệnh truyền nhiễm nguy hiểm.',
    'Rửa tay bằng xà phòng trong ít nhất 20 giây giúp loại bỏ hầu hết vi khuẩn và virus.',
    'Đảm bảo ngủ đủ 7-9 tiếng mỗi đêm để duy trì sức khỏe trí não và hệ miễn dịch.',
    'Luôn kiểm tra hạn sử dụng và điều kiện bảo quản thực phẩm để tránh ngộ độc.',
    'Uống đủ nước giúp duy trì huyết áp ổn định và hỗ trợ tiêu hóa.',
    'Dành thời gian giao tiếp xã hội giúp giảm nguy cơ trầm cảm và lo âu.',
    'Thường xuyên kiểm tra sức khỏe định kỳ để phát hiện sớm các vấn đề tiềm ẩn.',
    'Sử dụng khẩu trang khi ở nơi đông người hoặc khi có triệu chứng hô hấp.',
    'Bảo vệ da khỏi tác hại của tia UV bằng kem chống nắng và quần áo dài.',
    'Duy trì cân nặng hợp lý giúp giảm áp lực lên các khớp và tim mạch.',
    'Học cách quản lý căng thẳng thông qua hít thở sâu hoặc thiền định.',
  ],
  en: [
    'Eat at least 400g (5 portions) of fruits and vegetables per day to reduce NCD risk.',
    'Limit salt intake to less than 5g per day (approx. one teaspoon) to prevent hypertension.',
    'Reduce free sugar intake to less than 10% (ideally 5%) of total energy intake.',
    'Replace saturated fats with unsaturated fats (found in fish, avocado, sunflower oil).',
    'Eliminate industrially-produced trans-fats from your diet entirely.',
    'Exclusive breastfeeding for the first 6 months is the best start for a baby.',
    'Adults should do at least 150–300 minutes of moderate-intensity aerobic physical activity per week.',
    'There is no safe level of alcohol consumption for your health.',
    'Quitting smoking restores lung function and reduces stroke risk within a few years.',
    'Vaccination is the safest and most effective way to protect against deadly diseases.',
    'Wash hands with soap for at least 20 seconds to remove most bacteria and viruses.',
    'Ensure 7-9 hours of sleep per night to maintain brain health and immunity.',
    'Always check food expiry dates and storage conditions to prevent poisoning.',
    'Drinking enough water helps maintain stable blood pressure and supports digestion.',
    'Spending time socializing reduces the risk of depression and anxiety.',
    'Regular health check-ups help detect potential issues early.',
    'Use masks in crowded places or when having respiratory symptoms.',
    'Protect your skin from UV damage using sunscreen and long clothing.',
    'Maintaining a healthy weight reduces pressure on joints and the cardiovascular system.',
    'Learn to manage stress through deep breathing or meditation.',
  ]
};

const EXTERNAL_HEALTH_TIPS: Record<string, string[]> = {
  vi: [
    'Ăn đa dạng thực phẩm bao gồm ngũ cốc nguyên hạt, các loại hạt và đậu.',
    'Sử dụng muối có i-ốt để phòng ngừa các rối loạn do thiếu hụt i-ốt.',
    'Duy trì chế độ ăn ít béo để ngăn ngừa tăng cân quá mức và béo phì.',
    'Trẻ em và thanh thiếu niên nên vận động ít nhất 60 phút mỗi ngày.',
    'Hoạt động thể chất giúp cải thiện sức khỏe xương và chức năng cơ bắp.',
    'Hạn chế thời gian ngồi tĩnh tại, đặc biệt là trước màn hình điện tử.',
    'Dọn dẹp môi trường sống để loại bỏ nơi trú ngụ của muỗi gây vằn sốt xuất huyết.',
    'Sử dụng nước sạch và thực phẩm an toàn để phòng tránh bệnh tiêu chảy.',
    'Không tự ý sử dụng kháng sinh mà không có chỉ định của bác sĩ.',
    'Kháng kháng sinh là một trong những mối đe dọa lớn nhất đối với sức khỏe toàn cầu.',
    'Phụ nữ mang thai nên khám thai ít nhất 8 lần để đảm bảo sức khỏe mẹ và con.',
    'Kiểm soát huyết áp thường xuyên giúp ngăn ngừa các biến chứng tim mạch.',
    'Bệnh tiểu đường type 2 có thể được phòng ngừa hiệu quả thông qua lối sống lành mạnh.',
    'Tăng cường vận động ngoài trời để tổng hợp Vitamin D tự nhiên từ ánh nắng.',
    'Giảm tiêu thụ thực phẩm siêu chế biến chứa nhiều phụ gia và chất bảo quản.',
    'Uống nước lọc thay cho nước ngọt giúp giảm nguy cơ sâu răng và béo phì.',
    'Chăm sóc sức khỏe răng miệng bằng cách đánh răng ít nhất 2 lần mỗi ngày.',
    'Hiểu rõ tiền sử bệnh lý của gia đình để chủ động phòng ngừa di truyền.',
    'Tầm soát ung thư định kỳ theo độ tuổi giúp tăng tỷ lệ điều trị thành công.',
    'Giữ tinh thần lạc quan và tích cực hỗ trợ quá trình phục hồi khi bị bệnh.',
    'Rửa sạch trái cây và rau củ dưới vòi nước chảy để loại bỏ hóa chất tồn dư.',
    'Không ăn thịt động vật hoang dã để tránh nguy cơ lây truyền bệnh từ động vật.',
    'Đảm bảo an toàn thực phẩm: Riêng biệt đồ sống và đồ chín.',
    'Nấu chín kỹ thực phẩm, đặc biệt là thịt, gia cầm, trứng và hải sản.',
    'Bảo quản thực phẩm ở nhiệt độ an toàn (dưới 5°C hoặc trên 60°C).',
    'Khám mắt định kỳ để phát hiện sớm các tật khúc xạ và bệnh lý về mắt.',
    'Sử dụng các thiết bị bảo hộ khi làm việc trong môi trường ô nhiễm hoặc ồn ào.',
    'Hạn chế sử dụng tai nghe ở âm lượng quá lớn để bảo vệ thính lực.',
    'Tăng cường ăn các loại rau lá xanh đậm để bổ sung sắt và acid folic.',
    'Cười nhiều hơn giúp cơ thể giải phóng endorphin, giảm đau và căng thẳng.',
    'Lắng nghe cơ thể: Đừng bỏ qua các cơn đau kéo dài không rõ nguyên nhân.',
    'Tham gia các hoạt động cộng đồng để tăng cường cảm giác thuộc về và hạnh phúc.',
    'Giữ cho nhà cửa thông thoáng để cải thiện chất lượng không khí trong nhà.',
    'Tránh tiếp xúc trực tiếp với hóa chất độc hại bằng cách đeo găng tay.',
    'Thay bàn chải đánh răng ít nhất 3 tháng một lần.',
    'Hạn chế ăn tối quá muộn hoặc gần sát giờ đi ngủ.',
    'Tăng cường các bài tập thăng bằng khi lớn tuổi để phòng tránh té ngã.',
    'Uống trà xanh hoặc trà thảo mộc thay vì đồ uống có caffeine mạnh.',
    'Sử dụng gia vị tự nhiên (hành, tỏi, gừng) để tăng hương vị thay cho muối.',
    'Tự nấu ăn tại nhà giúp kiểm soát tốt hơn các thành phần dinh dưỡng.',
    'Tắt các thiết bị điện tử ít nhất 30 phút trước khi ngủ.',
    'Duy trì tư thế ngồi đúng khi làm việc để tránh đau lưng và cổ.',
    'Thường xuyên vệ sinh các vật dụng thường chạm vào như điện thoại, bàn phím.',
    'Biết cách sơ cứu cơ bản để xử lý các tình huống khẩn cấp tại nhà.',
    'Hạn chế tiếp xúc với khói thuốc lá thụ động trong môi trường làm việc và sống.',
    'Tiêu thụ thực phẩm giàu chất xơ giúp ngăn ngừa táo bón và ung thư đại trực tràng.',
    'Dành 10-15 phút mỗi ngày để giãn cơ giúp cơ thể linh hoạt hơn.',
    'Uống nước ngay sau khi thức dậy để kích hoạt các cơ quan nội tạng.',
    'Hạn chế thực phẩm chiên rán nhiều dầu mỡ ở nhiệt độ cao.',
    'Tránh tin vào các phương pháp chữa bệnh dân gian không có cơ sở khoa học.',
    'Giữ ấm cơ thể, đặc biệt là vùng cổ và ngực khi thời tiết chuyển lạnh.',
    'Sử dụng các loại hạt như hạnh nhân, óc chó làm bữa nhẹ lành mạnh.',
    'Tôn trọng khoảng cách an toàn khi có dịch bệnh truyền nhiễm lây qua đường hô hấp.',
    'Luôn đeo mũ bảo hiểm khi tham gia giao thông bằng xe máy.',
    'Hạn chế sử dụng túi nilon và nhựa dùng một lần để bảo vệ môi trường và sức khỏe.',
    'Tìm kiếm sự hỗ trợ chuyên nghiệp nếu bạn thấy lo âu hoặc buồn bã kéo dài.',
    'Theo dõi lượng calo nạp vào hàng ngày nếu bạn đang có mục tiêu quản lý cân nặng.',
    'Sử dụng các loại xà phòng dịu nhẹ để tránh làm khô và kích ứng da.',
    'Tăng cường thực phẩm giàu Canxi để giúp xương chắc khỏe.',
    'Tận hưởng bữa ăn một cách chậm rãi để cảm nhận tín hiệu no của não bộ.',
  ],
  en: [
    'Eat a variety of food, including whole grains, nuts, and legumes.',
    'Use iodized salt to prevent iodine deficiency disorders.',
    'Maintain a low-fat diet to prevent unhealthy weight gain and obesity.',
    'Children and adolescents should be active for at least 60 minutes daily.',
    'Physical activity improves bone health and muscle function.',
    'Limit sedentary time, especially recreational screen time.',
    'Clean your environment to eliminate mosquito breeding sites.',
    'Use safe water and food to prevent diarrhoeal diseases.',
    'Do not use antibiotics without a doctor\'s prescription.',
    'Antibiotic resistance is one of the biggest threats to global health.',
    'Pregnant women should have at least 8 antenatal contacts.',
    'Regular blood pressure checks prevent cardiovascular complications.',
    'Type 2 diabetes can be prevented with a healthy lifestyle.',
    'Increase outdoor activity to naturally synthesize Vitamin D from sunlight.',
    'Reduce consumption of ultra-processed foods high in additives.',
    'Drink water instead of sugary drinks to reduce tooth decay and obesity.',
    'Take care of oral health by brushing at least twice daily.',
    'Know your family medical history to proactively prevent hereditary issues.',
    'Age-appropriate cancer screening increases successful treatment rates.',
    'Maintain an optimistic attitude to support recovery processes.',
    'Wash fruits and vegetables under running water to remove chemical residues.',
    'Avoid eating wildlife to prevent zoonotic disease transmission.',
    'Ensure food safety: Separate raw and cooked foods.',
    'Cook food thoroughly, especially meat, poultry, eggs, and seafood.',
    'Keep food at safe temperatures (below 5°C or above 60°C).',
    'Have regular eye exams to detect refractive errors and eye diseases.',
    'Use protective equipment when working in polluted or noisy environments.',
    'Avoid using headphones at very high volumes to protect hearing.',
    'Increase intake of dark green leafy vegetables for iron and folic acid.',
    'Smiling more releases endorphins, reducing pain and stress.',
    'Listen to your body: Don\'t ignore unexplained persistent pain.',
    'Participate in community activities to enhance belonging and happiness.',
    'Keep your home well-ventilated to improve indoor air quality.',
    'Avoid direct contact with toxic chemicals by wearing gloves.',
    'Change your toothbrush at least every three months.',
    'Avoid eating dinner too late or close to bedtime.',
    'Increase balance exercises as you age to prevent falls.',
    'Drink green or herbal tea instead of strong caffeinated drinks.',
    'Use natural spices (onion, garlic, ginger) for flavor instead of salt.',
    'Cooking at home allows better control over nutritional ingredients.',
    'Turn off electronic devices at least 30 minutes before sleep.',
    'Maintain proper posture while working to avoid back and neck pain.',
    'Regularly clean frequently touched objects like phones and keyboards.',
    'Learn basic first aid to handle emergency situations at home.',
    'Limit exposure to second-hand smoke in working and living environments.',
    'Consuming fiber-rich foods prevents constipation and colorectal cancer.',
    'Spend 10-15 minutes daily stretching to keep your body flexible.',
    'Drink water immediately after waking up to activate internal organs.',
    'Limit deep-fried foods cooked at high temperatures.',
    'Avoid trusting folk remedies without a scientific basis.',
    'Keep your body warm, especially the neck and chest, during cold weather.',
    'Use nuts like almonds and walnuts as healthy snacks.',
    'Respect safe distancing during respiratory infectious disease outbreaks.',
    'Always wear a helmet when traveling by motorcycle or bicycle.',
    'Limit the use of plastic bags and single-use plastics for environment and health.',
    'Seek professional help if you feel consistently anxious or sad.',
    'Track daily calorie intake if you have weight management goals.',
    'Use mild soaps to avoid drying out and irritating your skin.',
    'Increase Calcium-rich food intake to keep bones strong.',
    'Enjoy your meals slowly to feel the brain\'s fullness signals.',
  ]
};

const STORAGE_KEY = 'chronos_health_tips';

export interface HealthTipsStorage {
  default: Record<string, string[]>;
  custom: Record<string, string[]>;
  lastUpdated: number;
}

export const healthTipsManager = {
  getAllTips: (lang: string = 'en'): string[] => {
    const stored = healthTipsManager.getStoredTips();
    const langKey = lang === 'vi' ? 'vi' : 'en';
    return [...(stored.default[langKey] || []), ...(stored.custom[langKey] || [])];
  },
  getStoredTips: (): HealthTipsStorage => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load health tips', e);
    }
    return {
      default: DEFAULT_HEALTH_TIPS,
      custom: { en: [], vi: [] },
      lastUpdated: Date.now(),
    };
  },
  addNewTips: (newTips: string[], lang: string = 'en'): void => {
    const stored = healthTipsManager.getStoredTips();
    const langKey = lang === 'vi' ? 'vi' : 'en';
    const allExisting = [...(stored.default[langKey] || []), ...(stored.custom[langKey] || [])];
    const uniqueNewTips = newTips.filter(tip => !allExisting.includes(tip));
    if (!stored.custom[langKey]) stored.custom[langKey] = [];
    stored.custom[langKey].push(...uniqueNewTips);
    stored.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  },
  fetchExternalTips: async (lang: string = 'en', limit: number = 5): Promise<string[]> => {
    if (!navigator.onLine) throw new Error('No internet connection');
    const langKey = lang === 'vi' ? 'vi' : 'en';
    try {
      // Mocking fetch or using provided lists for now to ensure quality
      const allExternalTips = EXTERNAL_HEALTH_TIPS[langKey] || EXTERNAL_HEALTH_TIPS.en;
      const stored = healthTipsManager.getStoredTips();
      const allExisting = [...(stored.default[langKey] || []), ...(stored.custom[langKey] || [])];
      const newTips = allExternalTips.filter(tip => !allExisting.includes(tip));
      const shuffled = [...newTips].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch tips:', error);
      return [];
    }
  },
  addExternalTips: async (lang: string = 'en', limit: number = 5): Promise<string[]> => {
    try {
      const tips = await healthTipsManager.fetchExternalTips(lang, limit);
      healthTipsManager.addNewTips(tips, lang);
      return tips;
    } catch (error) {
      console.error('Failed to fetch external tips:', error);
      throw error;
    }
  },
  resetToDefault: (): void => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        default: DEFAULT_HEALTH_TIPS,
        custom: { en: [], vi: [] },
        lastUpdated: Date.now(),
      })
    );
  },
};
