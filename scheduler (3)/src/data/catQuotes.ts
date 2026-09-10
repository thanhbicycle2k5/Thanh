export type CatQuoteCategory =
  | 'teen'
  | 'joke'
  | 'flirt'
  | 'healing'
  | 'study'
  | 'english'
  | 'poem'
  | 'wordplay'
  | 'philosophy'
  | 'meow';

export interface CatQuote {
  id: number;
  category: CatQuoteCategory;
  text: string;
}

type QuoteSeed = {
  category: CatQuoteCategory;
  starters: string[];
  endings: string[];
};

const quoteSeeds: QuoteSeed[] = [
  {
    category: 'teen',
    starters: [
      'Não hôm nay hơi lag', 'Deadline nhắn tin', 'Mood sáng nay', 'Tôi và bài tập',
      'Lịch học nhìn tôi', 'Cà phê vừa online', 'Một ngày mới load', 'Ví tiền thì im',
      'Năng lượng hôm nay', 'Scheduly vừa hỏi',
    ],
    endings: [
      'nhưng tinh thần vẫn đang online.', 'mà mình vẫn phải tỏ ra ổn.', 'đợi một cú refresh thật ngoạn mục.',
      'không ổn lắm nhưng vẫn đáng yêu.', 'bảo cố thêm chút nữa đi.', 'đang tìm nút bỏ qua thứ hai.',
      'vẫn đủ pin cho một việc nhỏ.', 'hơi rén nhưng chưa chịu thua.',
    ],
  },
  {
    category: 'joke',
    starters: [
      'Tại sao quyển vở', 'Con mèo hỏi deadline', 'Cây bút hôm nay', 'Bài tập nhìn mình',
      'Cà phê kể rằng', 'Chiếc đồng hồ than thở', 'Cái bàn học bảo', 'Não bộ tuyên bố',
      'Mạng Wi-Fi khuyên', 'Scheduly kết luận',
    ],
    endings: [
      'vì nó thích được mở lòng.', 'mình cười trước để khỏi bị bất ngờ.', 'đang cần một kỳ nghỉ có lý do.',
      'rằng chăm chỉ cũng có giờ nghỉ.', 'vì kiến thức cần chút caffeine.', 'đã đến giờ giả vờ bận rộn.',
      'hôm nay ai cũng cần một nút lưu.', 'vì im lặng cũng là một dạng tải bài.',
    ],
  },
  {
    category: 'flirt',
    starters: [
      'Bạn giống Wi-Fi', 'Nếu bạn là deadline', 'Mình không cần bản đồ', 'Bạn có phải từ điển',
      'Lịch tuần của mình', 'Bạn là ly cà phê', 'Nếu nụ cười là bài tập', 'Mắt mình hơi mỏi',
      'Bạn làm toán giỏi không', 'Scheduly hỏi nhỏ rằng',
    ],
    endings: [
      'vì ở gần bạn là mình tự kết nối.', 'mình vẫn muốn đến đúng giờ cùng bạn.', 'vì hướng về bạn là đủ rồi.',
      'vì gặp bạn là mình tìm thấy nghĩa vui.', 'chỉ thiếu một ô có tên bạn.', 'vì bạn làm ngày dài dịu lại.',
      'thì mình xin được làm bài chung.', 'chắc tại cứ nhìn bạn mãi.',
    ],
  },
  {
    category: 'healing',
    starters: [
      'Hôm nay chậm một chút', 'Bạn không cần hoàn hảo', 'Một việc nhỏ hoàn thành', 'Nếu mệt thì nghỉ',
      'Bước chân ngắn', 'Ngày khó vẫn qua', 'Bạn đã cố gắng', 'Đừng so mình với ai',
      'Mỗi lần bắt đầu lại', 'Mèo nhắc bạn rằng',
    ],
    endings: [
      'cũng là đang tiến về phía trước.', 'vẫn đủ để bạn đáng tự hào.', 'cũng là một chiến thắng dịu dàng.', 'không phải bỏ cuộc đâu.',
      'vẫn đưa bạn đến nơi cần đến.', 'và bạn sẽ nhẹ hơn sau đó.', 'nhiều hơn bạn tưởng đấy.', 'vì mỗi người có một chiếc đồng hồ riêng.',
      'là một dấu chấm, không phải dấu hết.', 'bạn xứng đáng được nghỉ ngơi.',
    ],
  },
  {
    category: 'study',
    starters: [
      'Mở sách ra', 'Một chương hôm nay', 'Bài khó đến đâu', 'Ghi chú càng gọn',
      'Học hai mươi phút', 'Ôn bài trước ngủ', 'Nhóm học online', 'Điểm số là tín hiệu',
      'Một câu hỏi hay', 'Sinh viên thông thái',
    ],
    endings: [
      'kiến thức sẽ biết đường vào.', 'cũng đáng hơn một lần trì hoãn.', 'vẫn có thể chia thành phần nhỏ.',
      'thì lúc ôn lại càng dễ thở.', 'đã là một khởi đầu rất ổn.', 'giúp ngày mai bớt hoảng.',
      'cần người học thật chứ không chỉ người bật camera.', 'để mình biết cần luyện thêm chỗ nào.',
      'thường mở ra ba câu hỏi mới.', 'biết nghỉ đúng lúc nữa.',
    ],
  },
  {
    category: 'english',
    starters: [
      'Today is a good day', 'One word a day', 'English chưa khó', 'A small mistake',
      'Practice makes progress', 'Your vocabulary', 'Say it out loud', 'Grammar có thể rối',
      'Keep going', 'Mèo học ngoại ngữ',
    ],
    endings: [
      'to learn something new.', 'keeps the confidence growing.', 'chỉ là vocabulary hơi đông.', 'is still part of learning.',
      'even when progress feels quiet.', 'will grow with every example.', 'and your confidence will follow.', 'but practice can untangle it.',
      'bạn đang tiến bộ đấy.', 'says meow in every language.',
    ],
  },
  {
    category: 'poem',
    starters: [
      'Trời xanh mây trắng lững lờ', 'Sách nghiêng bên cửa nắng vàng', 'Mèo ngồi canh góc bàn', 'Đêm nay đèn học dịu dàng',
      'Trang vở còn thơm mùi giấy', 'Mai này bước giữa sân trường', 'Cà phê nghiêng cạnh giáo trình', 'Gió đưa câu chữ qua phòng',
      'Một ngày chậm giữa phố đông', 'Mèo ru deadline ngủ',
    ],
    endings: [
      'Thành chăm học nhé, điểm chờ phía sau.', 'Bút đi cùng chữ, ước ao đi cùng mình.', 'Bạn cười một chút, ngày lành ghé thăm.',
      'Học thêm một chữ, dịu dàng thêm vui.', 'Mở ra một trang, mở luôn một trời.', 'Mang theo hy vọng, nhẹ nhàng bước đi.',
      'Gom vài từ mới, gieo một niềm tin.', 'Nghe câu mèo hát, bình yên ghé nhà.',
    ],
  },
  {
    category: 'wordplay',
    starters: [
      'Deadline không phải dead', 'Học hành có lúc hành', 'Bài tập hơi bí', 'Từ vựng tăng cân',
      'Não đang suy nghĩ', 'Điểm cao không tự cao', 'Lịch kín vẫn có kẽ', 'Cà phê không giải bài',
      'Mèo có móng vuốt', 'Chăm chỉ là chiếc chìa khóa',
    ],
    endings: [
      'nhưng vẫn cần line để kịp.', 'nên thêm hành động cho bớt hành.', 'thì đổi góc nhìn cho thông.',
      'vì mỗi ngày thêm một từ.', 'nhưng đừng suy diễn quá xa.', 'mà vẫn nên giữ lòng khiêm tốn.', 'để một hơi thở lọt vào.',
    ],
  },
  {
    category: 'philosophy',
    starters: [
      'Kế hoạch tốt', 'Người bận rộn', 'Một phút nghỉ', 'Kiến thức giống hạt giống',
      'Thành công không phải', 'Con đường dài', 'Câu hỏi đúng', 'Sự tập trung',
      'Ngày mai được xây', 'Mèo triết gia nói',
    ],
    endings: [
      'là chiếc la bàn, không phải chiếc còng.', 'vẫn cần nhớ mình đang đi đâu.', 'không làm thời gian mất đi.', 'cần được tưới bằng sự tò mò.',
      'một cuộc đua với người khác.', 'được tạo từ nhiều bước nhỏ.', 'đã là một nửa của câu trả lời.', 'cũng cần được nghỉ để lớn lên.',
      'từ vài việc nhỏ của hôm nay.', 'muốn hiểu đời thì trước hết ngủ đủ.',
    ],
  },
  {
    category: 'meow',
    starters: [
      'Meo meo', 'Mrrr mrrr', 'Meo một tiếng', 'Mèo đã kiểm tra lịch',
      'Paw paw', 'Meo meo, bạn ơi', 'Mèo rung ria', 'Mèo ngồi ngay ngắn',
      'Nya nya', 'Scheduly tuyên bố',
    ],
    endings: [
      'hôm nay mình học một chút nha!', 'đã đến giờ rót thêm tự tin rồi.', 'là lời chào có đuôi mềm.', 'và phát hiện bạn đang rất cố gắng.',
      'báo hiệu một cú bắt đầu đáng yêu.', 'nhắc bạn uống nước rồi quay lại nhé.', 'đang nghe deadline kể chuyện.', 'sẵn sàng cổ vũ bạn hết cỡ.',
    ],
  },
];

const CATEGORY_COUNTS: Record<CatQuoteCategory, number> = {
  teen: 80,
  joke: 70,
  flirt: 70,
  healing: 50,
  study: 50,
  english: 50,
  poem: 40,
  wordplay: 30,
  philosophy: 30,
  meow: 30,
};

function buildQuotes(): CatQuote[] {
  let id = 1;
  return quoteSeeds.flatMap(({ category, starters, endings }) => {
    const count = CATEGORY_COUNTS[category];
    const quotes: CatQuote[] = [];
    for (let index = 0; index < count; index += 1) {
      const starter = starters[index % starters.length];
      const ending = endings[Math.floor(index / starters.length) % endings.length];
      quotes.push({ id: id++, category, text: `${starter}, ${ending}` });
    }
    return quotes;
  });
}

export const catQuotes: CatQuote[] = buildQuotes();

export const catQuoteCategoryCounts = CATEGORY_COUNTS;

export function getRandomCatQuote(lastQuoteId?: number): CatQuote {
  if (catQuotes.length < 2) return catQuotes[0];
  let quote = catQuotes[Math.floor(Math.random() * catQuotes.length)];
  while (quote.id === lastQuoteId) {
    quote = catQuotes[Math.floor(Math.random() * catQuotes.length)];
  }
  return quote;
}
