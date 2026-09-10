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
  phrases: string[];
  followUps: string[];
};

const quoteSeeds: QuoteSeed[] = [
  {
    category: 'teen',
    phrases: [
      'Não hôm nay hơi lag.', 'Deadline vừa nhắn tin.', 'Mood sáng nay hơi chậm.',
      'Tôi và bài tập đang nhìn nhau.', 'Lịch học nhìn tôi rất nghiêm túc.',
      'Cà phê vừa online.', 'Một ngày mới đang load.', 'Ví tiền vẫn đang im lặng.',
      'Năng lượng hôm nay hơi tiết kiệm.', 'Scheduly vừa hỏi: học chưa?',
    ],
    followUps: [
      'Nhưng tinh thần vẫn còn online.', 'Mình nghỉ một phút rồi làm tiếp nhé.',
      'Chậm một chút cũng không sao.', 'Hôm nay vẫn còn nhiều cơ hội để cố gắng.',
      'Chưa hoàn hảo, nhưng vẫn rất đáng yêu.', 'Một việc nhỏ thôi cũng tính là tiến bộ.',
      'Hơi rén, nhưng chưa chịu thua.', 'Cứ bình tĩnh, mình xử lý từng bước.',
    ],
  },
  {
    category: 'joke',
    phrases: [
      'Quyển vở hôm nay quyết định mở lòng.', 'Con mèo hỏi deadline bao giờ đến.',
      'Cây bút xin được nghỉ giải lao.', 'Bài tập nhìn mình bằng ánh mắt bí ẩn.',
      'Cà phê tuyên bố mình là trợ lý học tập.', 'Chiếc đồng hồ thở dài rất chuyên nghiệp.',
      'Cái bàn học đã nghe đủ mọi lời hứa.', 'Não bộ xin thêm một phút khởi động.',
      'Mạng Wi-Fi khuyên mình bình tĩnh.', 'Scheduly kết luận hôm nay cần vui trước.',
    ],
    followUps: [
      'Mình cười trước để khỏi bị bất ngờ.', 'Chăm chỉ cũng cần giờ nghỉ.',
      'Kiến thức đôi khi cần thêm chút caffeine.', 'Ai cũng cần một nút lưu cho ngày bận rộn.',
      'Im lặng một lúc cũng là đang tải bài.', 'Nếu chưa hiểu thì ta đổi góc nhìn.',
      'Ít nhất hôm nay mình đã có mặt.', 'Đùa một chút cho não bớt căng.',
    ],
  },
  {
    category: 'flirt',
    phrases: [
      'Bạn giống Wi-Fi nhà mình.', 'Nếu bạn là deadline, mình vẫn muốn gặp.',
      'Mình không cần bản đồ khi đã biết hướng về bạn.', 'Bạn có phải từ điển không?',
      'Lịch tuần của mình đang thiếu một cuộc hẹn.', 'Bạn giống ly cà phê buổi sáng.',
      'Nếu nụ cười là bài tập, mình xin làm bài chung.', 'Mắt mình hơi mỏi vì cứ nhìn bạn.',
      'Bạn làm toán giỏi không?', 'Scheduly hỏi nhỏ: mình làm quen nhé?',
    ],
    followUps: [
      'Ở gần bạn là mình tự động kết nối.', 'Bạn làm ngày dài dịu lại.',
      'Có bạn, lịch kín cũng thấy vui hơn.', 'Mình thích những cuộc trò chuyện có bạn.',
      'Bạn là lý do mình muốn đến lớp đúng giờ.', 'Gặp bạn xong, mình quên mất định than thở.',
      'Mình chỉ hỏi nhẹ thôi, nhưng thật lòng đấy.', 'Nếu bạn đồng ý, hôm nay sẽ rất tuyệt.',
    ],
  },
  {
    category: 'healing',
    phrases: [
      'Hôm nay chậm một chút cũng được.', 'Bạn không cần phải hoàn hảo.',
      'Một việc nhỏ hoàn thành vẫn là thành quả.', 'Nếu mệt thì hãy nghỉ một lát.',
      'Bước chân ngắn vẫn đưa bạn đi xa.', 'Ngày khó rồi cũng sẽ qua.',
      'Bạn đã cố gắng nhiều hơn bạn nghĩ.', 'Đừng so mình với người khác.',
      'Mỗi lần bắt đầu lại đều đáng quý.', 'Mèo nhắc bạn hãy dịu dàng với mình.',
    ],
    followUps: [
      'Bạn vẫn đang tiến về phía trước.', 'Thế là đủ để hôm nay đáng tự hào rồi.',
      'Nghỉ ngơi không có nghĩa là bỏ cuộc.', 'Bạn xứng đáng được thở chậm lại.',
      'Mỗi người có một nhịp riêng.', 'Ngày mai mình thử lại bằng một bước nhỏ nhé.',
      'Bạn không cần mang cả thế giới một mình.', 'Mọi nỗ lực tử tế đều có ý nghĩa.',
    ],
  },
  {
    category: 'study',
    phrases: [
      'Mở sách ra là đã thắng một lần trì hoãn.', 'Một chương hôm nay cũng rất đáng kể.',
      'Bài khó đến đâu cũng có thể chia nhỏ.', 'Ghi chú càng gọn thì càng dễ ôn.',
      'Học hai mươi phút rồi nghỉ một chút.', 'Ôn bài trước khi ngủ giúp ngày mai nhẹ hơn.',
      'Nhóm học online cần cả người học thật.', 'Điểm số là tín hiệu, không phải toàn bộ câu chuyện.',
      'Một câu hỏi hay thường mở ra nhiều điều mới.', 'Sinh viên thông thái cũng biết nghỉ đúng lúc.',
    ],
    followUps: [
      'Kiến thức sẽ dần biết đường vào.', 'Cứ làm từng phần, đừng ôm cả núi bài.',
      'Một khởi đầu nhỏ vẫn là khởi đầu tốt.', 'Ngày mai sẽ bớt hoảng hơn một chút.',
      'Điều quan trọng là mình thật sự bắt đầu.', 'Học đều một chút tốt hơn dồn hết một đêm.',
      'Mèo có thể cổ vũ, nhưng bạn là người làm được.', 'Đừng quên uống nước giữa các chương.',
    ],
  },
  {
    category: 'english',
    phrases: [
      'Today is a good day to learn something new.', 'One word a day keeps fear away.',
      'English chưa khó, chỉ cần luyện đều.', 'A small mistake is still part of learning.',
      'Practice makes progress, even on quiet days.', 'Your vocabulary grows with every example.',
      'Say it out loud and let confidence follow.', 'Grammar có thể rối, nhưng không phải là ngõ cụt.',
      'Keep going, bạn đang tiến bộ đấy.', 'Mèo học ngoại ngữ bằng những tiếng meo.',
    ],
    followUps: [
      'Mỗi ngày một chút là đủ để đi xa.', 'Đừng ngại nói sai rồi sửa lại.',
      'Bạn không cần biết hết ngay hôm nay.', 'A little practice can change a lot.',
      'Từ mới sẽ thân quen sau vài lần gặp.', 'Keep going, you are doing better than you think.',
      'Học ngoại ngữ cũng là học cách kiên nhẫn.', 'Mèo tin vào bạn, no matter the language.',
    ],
  },
  {
    category: 'poem',
    phrases: [
      'Trời xanh mây trắng lững lờ,', 'Sách nghiêng bên cửa nắng vàng,',
      'Mèo ngồi canh góc bàn học,', 'Đêm nay đèn học dịu dàng,',
      'Trang vở còn thơm mùi giấy,', 'Mai này bước giữa sân trường,',
      'Cà phê nghiêng cạnh giáo trình,', 'Gió đưa câu chữ qua phòng,',
      'Một ngày chậm giữa phố đông,', 'Mèo ru deadline ngủ ngoan,',
    ],
    followUps: [
      'Học thêm một chút, ước mơ lại gần.', 'Bút đi cùng chữ, bình yên đi cùng mình.',
      'Bạn cười một chút, ngày lành ghé thăm.', 'Mở thêm một trang, mở thêm một trời.',
      'Mang theo hy vọng, nhẹ nhàng bước đi.', 'Gom vài từ mới, gieo một niềm tin.',
      'Nghe câu mèo hát, bình yên ghé nhà.', 'Chậm thôi cũng được, miễn là đừng quên vui.',
    ],
  },
  {
    category: 'wordplay',
    phrases: [
      'Deadline không phải dead, chỉ là hơi căng.', 'Học hành có lúc hành, nên nhớ ăn hành vừa đủ.',
      'Bài tập hơi bí thì đổi góc nhìn.', 'Từ vựng tăng cân vì mỗi ngày thêm một chữ.',
      'Não đang suy nghĩ, xin đừng làm phiền.', 'Điểm cao không tự cao, nhưng vẫn đáng vui.',
      'Lịch kín vẫn có kẽ cho một hơi thở.', 'Cà phê không giải bài, nhưng giúp mình tỉnh.',
      'Mèo có móng vuốt, còn bạn có kế hoạch.', 'Chăm chỉ là chiếc chìa khóa, nghỉ ngơi là tay nắm.',
    ],
    followUps: [
      'Có kế hoạch rồi thì mình đi từng bước.', 'Một câu đùa nhẹ làm ngày bớt nặng.',
      'Đổi cách làm đôi khi là đã thông.', 'Thêm một từ mới là thêm một ô cửa.',
      'Giữ lòng khiêm tốn, giữ đầu óc sáng.', 'Đừng quên chừa chỗ cho niềm vui.',
      'Mèo gọi đó là chiến thuật mềm mại.', 'Vui một chút rồi quay lại làm tiếp.',
    ],
  },
  {
    category: 'philosophy',
    phrases: [
      'Kế hoạch tốt là chiếc la bàn, không phải chiếc còng.', 'Người bận rộn vẫn cần nhớ mình đang đi đâu.',
      'Một phút nghỉ không làm thời gian biến mất.', 'Kiến thức giống hạt giống, cần được tưới bằng tò mò.',
      'Thành công không phải là cuộc đua với người khác.', 'Con đường dài được tạo từ nhiều bước nhỏ.',
      'Câu hỏi đúng thường mở cửa cho câu trả lời.', 'Sự tập trung cũng cần được nghỉ để lớn lên.',
      'Ngày mai được xây từ vài việc nhỏ của hôm nay.', 'Mèo triết gia nói: ngủ đủ cũng là minh triết.',
    ],
    followUps: [
      'Đi chậm nhưng có hướng vẫn là đi.', 'Mỗi ngày hiểu thêm một chút là đủ.',
      'Nghỉ đúng lúc giúp mình nhìn rõ hơn.', 'Tò mò là cách học rất tự nhiên.',
      'Mèo đồng ý, sau một giấc ngủ ngon.', 'Không cần vội, điều bền vững cần thời gian.',
      'Hôm nay làm tốt phần của hôm nay.', 'Đôi khi câu trả lời là một tách trà.',
    ],
  },
  {
    category: 'meow',
    phrases: [
      'Meo meo!', 'Mrrr mrrr, nghe êm chưa?', 'Meo một tiếng để lấy may.',
      'Mèo đã kiểm tra lịch giúp bạn.', 'Paw paw, đến giờ bắt đầu rồi.',
      'Meo meo, bạn ơi!', 'Mèo rung ria đầy quyết tâm.', 'Mèo ngồi ngay ngắn chờ cổ vũ.',
      'Nya nya, hôm nay cũng đáng yêu.', 'Scheduly tuyên bố: mình làm được!',
    ],
    followUps: [
      'Hôm nay mình học một chút nha!', 'Đã đến giờ rót thêm tự tin rồi.',
      'Đây là lời chào có đuôi mềm.', 'Mèo thấy bạn đang rất cố gắng.',
      'Một khởi đầu đáng yêu đang chờ.', 'Uống nước rồi quay lại nhé.',
      'Deadline đang kể chuyện, nhưng mình vẫn bình tĩnh.', 'Mèo sẵn sàng cổ vũ bạn hết cỡ.',
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
  return quoteSeeds.flatMap(({ category, phrases, followUps }) => {
    const count = CATEGORY_COUNTS[category];
    const quotes: CatQuote[] = [];
    for (let index = 0; index < count; index += 1) {
      const phrase = phrases[index % phrases.length];
      const followUp = followUps[Math.floor(index / phrases.length) % followUps.length];
      quotes.push({ id: id++, category, text: `${phrase} ${followUp}` });
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
