import { folkSayings } from './folkSayings';

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
  | 'meow'
  | 'folk';

export interface CatQuote {
  id: number;
  category: CatQuoteCategory;
  text: string;
}

type QuoteSeed = {
  category: CatQuoteCategory;
  phrases: string[];
  followUps: string[];
  englishPhrases: string[];
  englishFollowUps: string[];
};

const quoteSeeds: QuoteSeed[] = [
  {
    category: 'teen',
    phrases: [
      'Não hôm nay hơi lag.', 'Deadline vừa nhắn tin.', 'Mood sáng nay hơi chậm.',
      'Tôi và bài tập đang nhìn nhau.', 'Lịch học nhìn tôi rất nghiêm túc.',
      'Cà phê vừa online.', 'Một ngày mới đang load.', 'Ví tiền vẫn đang im lặng.',
      'Năng lượng hôm nay hơi tiết kiệm.', 'Scheduly hỏi nhỏ: bạn đã sẵn sàng học chưa?',
    ],
    followUps: [
      'Dù hôm nay thế nào, mình vẫn có thể đi từng bước.', 'Chậm một chút cũng được, miễn là mình vẫn đang cố gắng.',
      'Mỗi ngày đều có chỗ cho một khởi đầu mới.', 'Mình cứ bình tĩnh, rồi sẽ tìm được cách.',
      'Không cần hoàn hảo, chỉ cần đừng bỏ cuộc.', 'Một bước nhỏ hôm nay cũng là tiến bộ.',
      'Cứ nghỉ khi cần, rồi mình lại tiếp tục nhé.', 'Mèo vẫn ở đây cổ vũ bạn.',
    ],
    englishPhrases: [
      'My brain is lagging a little today.', 'The deadline just sent me a message.',
      'My mood is running a little slow this morning.', 'My homework and I are just staring at each other.',
      'My study schedule is looking very serious today.', 'The coffee just came online.',
      'A new day is loading.', 'My wallet is staying very quiet.',
      'My energy is in battery-saving mode today.', 'Scheduly is asking: are you ready to study?',
    ],
    englishFollowUps: [
      'No matter how today goes, I can still take it one step at a time.',
      'It is okay to go slowly, as long as I keep trying.',
      'Every day has room for a fresh start.',
      'I can stay calm and find a way through.',
      'I do not have to be perfect; I just have to keep going.',
      'One small step today is still progress.',
      'Take a break when you need one, then we can continue.',
      'Your cat is still here cheering you on.',
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
      'Ít nhất câu chuyện hôm nay đã có thêm một miếng hài.', 'Mèo xin phép cười một tiếng rồi cùng bạn làm tiếp.',
      'Không hiểu thì mình thử hỏi lại, biết đâu câu trả lời cũng buồn cười.', 'Một chút hài hước giúp ngày bớt căng hơn.',
      'Mèo ghi nhận: hôm nay trí tưởng tượng hoạt động rất tốt.', 'Cười xong nhớ uống nước rồi quay lại nhé.',
      'Đôi khi bật cười cũng là một cách nạp lại năng lượng.', 'Câu chuyện này xứng đáng có thêm tiếng meo.',
    ],
    englishPhrases: [
      'My notebook decided to open up today.', 'The cat asked when the deadline is coming.',
      'The pen asked for a break.', 'My homework is giving me a mysterious look.',
      'The coffee declared itself my study assistant.', 'The clock sighed very professionally.',
      'My desk has heard all of my promises.', 'My brain asked for one more minute to boot up.',
      'The Wi-Fi told me to stay calm.', 'Scheduly concluded that today needs a little fun first.',
    ],
    englishFollowUps: [
      'At least today’s story has one more joke in it.',
      'The cat will laugh once, then get back to work with you.',
      'If it does not make sense, let us ask again; the answer might be funny too.',
      'A little humor can make the day feel less stressful.',
      'The cat confirms that your imagination is working very well today.',
      'Have a laugh, drink some water, and then come back.',
      'Sometimes a laugh is a good way to recharge.',
      'This story deserves one more meow.',
    ],
  },
  {
    category: 'flirt',
    phrases: [
      'Bạn giống Wi-Fi nhà mình.', 'Nếu bạn là deadline, mình vẫn muốn gặp.',
      'Mình không cần bản đồ khi đã biết hướng về bạn.', 'Bạn giống cuốn từ điển mình muốn đọc mãi.',
      'Lịch tuần của mình đang thiếu một cuộc hẹn.', 'Bạn giống ly cà phê buổi sáng.',
      'Nếu nụ cười là bài tập, mình xin làm bài chung.', 'Mắt mình hơi mỏi vì cứ nhìn bạn.',
      'Bạn khiến mình muốn cùng nhau giải mọi bài toán.', 'Scheduly hỏi nhỏ: mình làm quen nhé?',
    ],
    followUps: [
      'Ở gần bạn là mình tự động thấy vui hơn.', 'Bạn làm ngày dài dịu lại.',
      'Có bạn, lịch kín cũng thấy vui hơn.', 'Mình thích những cuộc trò chuyện có bạn.',
      'Bạn là lý do mình muốn đến lớp đúng giờ.', 'Gặp bạn xong, mình quên mất định than thở.',
      'Mình chỉ nói vậy thôi, nhưng thật lòng đấy.', 'Nếu bạn đồng ý, hôm nay sẽ rất tuyệt.',
    ],
    englishPhrases: [
      'You are like my home Wi-Fi.', 'If you were a deadline, I would still want to meet you.',
      'I do not need a map when I already know the way to you.',
      'You are like a dictionary I could read forever.',
      'My weekly schedule is missing a date with you.', 'You are like my morning coffee.',
      'If smiles were homework, I would want to do it with you.',
      'My eyes are a little tired from looking at you.',
      'You make me want to solve every problem together.',
      'Scheduly is asking: may I get to know you?',
    ],
    englishFollowUps: [
      'Being close to you automatically makes me happier.',
      'You make a long day feel gentler.',
      'Even a full schedule feels more fun with you in it.',
      'I enjoy conversations that include you.',
      'You are why I want to get to class on time.',
      'After seeing you, I forget what I was going to complain about.',
      'I am only saying this casually, but I mean it.',
      'If you say yes, today will be wonderful.',
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
      'Bạn vẫn đang tiến về phía trước theo nhịp của riêng mình.', 'Thế là đủ để hôm nay đáng tự hào rồi.',
      'Nghỉ ngơi không có nghĩa là bỏ cuộc.', 'Bạn xứng đáng được thở chậm lại.',
      'Mỗi người có một nhịp riêng, bạn không cần phải vội.', 'Ngày mai mình thử lại bằng một bước nhỏ nhé.',
      'Bạn không cần mang cả thế giới một mình.', 'Mọi nỗ lực tử tế đều có ý nghĩa.',
    ],
    englishPhrases: [
      'It is okay to take things slowly today.', 'You do not have to be perfect.',
      'Finishing one small thing is still an achievement.', 'If you are tired, take a little break.',
      'Short steps can still take you far.', 'Hard days will pass too.',
      'You have tried harder than you realize.', 'Do not compare yourself to other people.',
      'Every fresh start is worthwhile.', 'The cat reminds you to be kind to yourself.',
    ],
    englishFollowUps: [
      'You are still moving forward at your own pace.',
      'That is enough to make today something to be proud of.',
      'Resting does not mean giving up.',
      'You deserve to slow down and breathe.',
      'Everyone has their own pace; there is no need to rush.',
      'Tomorrow, let us try again with one small step.',
      'You do not have to carry the whole world alone.',
      'Every kind effort matters.',
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
      'Mỗi lần mở sách là kiến thức lại gần bạn thêm một chút.', 'Cứ chia bài thành từng phần, đừng ôm cả núi bài.',
      'Một chương nhỏ vẫn là một khởi đầu tốt.', 'Ôn từng chút một sẽ giúp ngày mai bớt áp lực.',
      'Điều quan trọng nhất là bạn đã thật sự bắt đầu.', 'Học đều một chút tốt hơn dồn hết vào một đêm.',
      'Mèo cổ vũ bạn, còn từng bước tiến bộ là do chính bạn tạo nên.', 'Đừng quên uống nước giữa các chương nhé.',
    ],
    englishPhrases: [
      'Opening a book is already a win over procrastination.',
      'One chapter today is still a meaningful achievement.',
      'Even a difficult subject can be broken into smaller parts.',
      'The clearer your notes are, the easier they are to review.',
      'Study for twenty minutes, then take a short break.',
      'Reviewing before bed can make tomorrow feel easier.',
      'An online study group needs people who really study too.',
      'A grade is a signal, not the whole story.',
      'One good question can open the door to many new ideas.',
      'A wise student also knows when to rest.',
    ],
    englishFollowUps: [
      'Every time you open a book, knowledge gets a little closer.',
      'Break the work into parts instead of carrying the whole mountain.',
      'One small chapter is still a good beginning.',
      'Reviewing a little at a time can make tomorrow less stressful.',
      'The most important thing is that you truly started.',
      'Studying a little regularly is better than cramming all night.',
      'The cat cheers you on, but you create every bit of progress yourself.',
      'Do not forget to drink water between chapters.',
    ],
  },
  {
    category: 'english',
    phrases: [
      'Hôm nay là ngày tốt để học thêm điều mới.', 'Mỗi ngày học một từ, nỗi sợ lại vơi.',
      'Tiếng Anh không khó, chỉ cần luyện tập đều đặn.',
      'Sai sót nhỏ cũng là một phần của việc học.',
      'Luyện tập giúp ta tiến bộ, kể cả trong những ngày yên ắng.',
      'Vốn từ của bạn lớn lên qua từng ví dụ.',
      'Hãy đọc thành tiếng, sự tự tin sẽ theo sau.',
      'Ngữ pháp có thể rối, nhưng không phải là ngõ cụt.',
      'Cứ tiếp tục nhé, bạn đang tiến bộ đấy.',
      'Mèo học ngoại ngữ bằng những tiếng meo.',
    ],
    followUps: [
      'A little practice each day can take you a long way.', 'Mistakes are part of learning, so keep trying.',
      'You do not have to know everything today.', 'A little practice can make a big difference.',
      'New words become familiar each time you meet them.', 'Keep going; you are doing better than you think.',
      'Learning a language also means learning to be patient.', 'Scheduly believes in you, in every language.',
    ],
    englishPhrases: [
      'Today is a good day to learn something new.',
      'One word a day keeps fear away.',
      'English is not so hard; it just takes regular practice.',
      'A small mistake is still part of learning.',
      'Practice makes progress, even on quiet days.',
      'Your vocabulary grows with every example.',
      'Say it out loud and let confidence follow.',
      'Grammar can be confusing, but it is not a dead end.',
      'Keep going; you are making progress.',
      'The cat learns languages one meow at a time.',
    ],
    englishFollowUps: [
      'A little practice each day can take you a long way.',
      'Mistakes are part of learning, so keep trying.',
      'You do not have to know everything today.',
      'A little practice can make a big difference.',
      'New words become familiar each time you meet them.',
      'Keep going; you are doing better than you think.',
      'Learning a language also means learning to be patient.',
      'Scheduly believes in you, in every language.',
    ],
  },
  {
    category: 'poem',
    phrases: [
      'Trời xanh, mây trắng đang lững lờ trôi.', 'Cuốn sách nghiêng bên cửa sổ ngập nắng vàng.',
      'Mèo ngồi canh bên góc bàn học.', 'Đêm nay, đèn học tỏa ánh sáng dịu dàng.',
      'Trang vở vẫn thơm mùi giấy mới.', 'Mai này, tôi sẽ bước giữa sân trường.',
      'Cốc cà phê nằm cạnh cuốn giáo trình.', 'Gió đưa câu chữ bay qua căn phòng.',
      'Giữa phố đông, ngày hôm nay trôi thật chậm.', 'Mèo khẽ ru cho hạn chót ngủ ngoan.',
    ],
    followUps: [
      'Thơ khẽ dừng lại, lòng mình nhẹ hơn.', 'Nghe câu mèo hát, bình yên ghé nhà.',
      'Chậm thôi cũng được, miễn là đừng quên vui.', 'Ngày mai phía trước, ta bước nhẹ nhàng.',
      'Học thêm một chút, ước mơ lại gần.', 'Mở thêm trang sách, đón một trời xanh.',
      'Hy vọng theo ta qua ngày nắng mưa.', 'Giữ niềm vui nhỏ, lòng thấy an yên.',
    ],
    englishPhrases: [
      'The blue sky and white clouds drift slowly by.',
      'A book leans by the window, bathed in golden sunlight.',
      'A cat keeps watch beside the study desk.',
      'Tonight, the study lamp casts a gentle glow.',
      'The notebook still smells of fresh paper.',
      'One day, I will walk across the schoolyard.',
      'A cup of coffee sits beside the textbook.',
      'The breeze carries words through the room.',
      'The day passes slowly through the busy town.',
      'The cat gently sings the deadline to sleep.',
    ],
    englishFollowUps: [
      'The poem pauses softly, and my heart feels lighter.',
      'The cat sings, and peace comes home.',
      'It is okay to go slowly, as long as we remember to be joyful.',
      'Tomorrow lies ahead; we will walk toward it gently.',
      'Learn a little more, and the dream comes closer.',
      'Turn another page and welcome a whole blue sky.',
      'Hope walks with us through sunny days and rain.',
      'Keep a little joy, and the heart will feel at peace.',
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
      'Mèo đùa một chút để ngày bớt nặng.', 'Câu chữ xoay một vòng, ý nghĩa lại vui hơn.',
      'Bí quá thì đổi cách chơi chữ, biết đâu lại thông.', 'Thêm một từ mới là thêm một cơ hội đùa vui.',
      'Giữ đầu óc sáng, rồi mình sẽ nghĩ ra câu hay.', 'Lịch kín đến đâu cũng nhớ chừa chỗ cho một câu đùa.',
      'Mèo gọi đó là chiến thuật mềm mại.', 'Cười một chút rồi quay lại chơi chữ tiếp nhé.',
    ],
    englishPhrases: [
      'A deadline is not the end; it is just a little tense.',
      'Studying can feel like work, so remember to take it in stride.',
      'If an exercise feels tricky, try looking at it from another angle.',
      'Vocabulary gains a little weight with every new word.',
      'My brain is thinking; please do not disturb.',
      'A high score is not arrogance, but it is still worth celebrating.',
      'Even a full schedule has room for a breath.',
      'Coffee cannot solve the problem, but it can help me wake up.',
      'The cat has claws, and you have a plan.',
      'Hard work is the key, and rest is the handle.',
    ],
    englishFollowUps: [
      'The cat tells a little joke to make the day feel lighter.',
      'Words spin around, and the meaning becomes more fun.',
      'If you get stuck, try another pun; it might click.',
      'A new word is another chance for a playful joke.',
      'Keep your mind clear, and a clever line will come.',
      'No matter how full the schedule is, leave room for a joke.',
      'The cat calls that a soft-touch strategy.',
      'Have a laugh, then come back for another round of wordplay.',
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
      'Một kế hoạch nên giúp ta tìm đường, chứ không trói chân mình.', 'Đi chậm nhưng có hướng vẫn là đi.',
      'Nghỉ đúng lúc giúp ta nhìn rõ con đường hơn.', 'Tò mò là cách tự nhiên để mở thêm cánh cửa tri thức.',
      'Điều bền vững cần thời gian, không cần vội vàng.', 'Con đường dài được tạo nên từ những bước nhỏ.',
      'Hôm nay cứ làm tốt phần việc của hôm nay.', 'Đôi khi một tách trà cũng giúp ta suy nghĩ sáng rõ.',
    ],
    englishPhrases: [
      'A good plan is a compass, not a pair of handcuffs.',
      'Busy people still need to remember where they are going.',
      'A minute of rest does not make time disappear.',
      'Knowledge is like a seed; curiosity is what waters it.',
      'Success is not a race against other people.',
      'A long road is made of many small steps.',
      'The right question often opens the door to an answer.',
      'Focus also needs rest in order to grow.',
      'Tomorrow is built from a few small things we do today.',
      'The philosopher cat says that enough sleep is wisdom too.',
    ],
    englishFollowUps: [
      'A plan should help us find the way, not hold us back.',
      'Moving slowly with direction is still moving forward.',
      'Resting at the right time helps us see the road more clearly.',
      'Curiosity is a natural way to open more doors to knowledge.',
      'Good things take time; there is no need to rush.',
      'A long road is made of many small steps.',
      'Today, just do today’s work well.',
      'Sometimes a cup of tea helps us think more clearly.',
    ],
  },
  {
    category: 'meow',
    phrases: [
      'Meo meo, mèo chào bạn!', 'Mrrr mrrr, nghe êm chưa?', 'Meo một tiếng để lấy may.',
      'Mèo đã kiểm tra lịch giúp bạn.', 'Paw paw, đến giờ bắt đầu rồi.',
      'Meo meo, bạn ơi!', 'Mèo rung ria đầy quyết tâm.', 'Mèo ngồi ngay ngắn chờ cổ vũ.',
      'Nya nya, hôm nay cũng đáng yêu.', 'Scheduly tuyên bố: mình làm được!',
    ],
    followUps: [
      'Meow says: you can do it, one small step at a time!', 'Scheduly is here to cheer you on.',
      'That was a soft little hello from your cat.', 'Meow, your effort is worth celebrating!',
      'Every new start can be a lovely one.', 'Take a sip of water, then come back when you are ready.',
      'Even when the deadline is near, let us stay calm.', 'Your cat is always ready to cheer you on!',
    ],
    englishPhrases: [
      'Meow meow, hello there!', 'Mrrr mrrr, does that sound soothing?',
      'One little meow for good luck.', 'The cat checked your schedule for you.',
      'Paw paw, it is time to get started.', 'Meow meow, my friend!',
      'The cat’s whiskers are full of determination.',
      'The cat sits up straight, ready to cheer you on.',
      'Nya nya, today is lovely too.', 'Scheduly declares: we can do this!',
    ],
    englishFollowUps: [
      'Meow says: you can do it, one small step at a time!',
      'Scheduly is here to cheer you on.',
      'That was a soft little hello from your cat.',
      'Meow, your effort is worth celebrating!',
      'Every new start can be a lovely one.',
      'Take a sip of water, then come back when you are ready.',
      'Even when the deadline is near, let us stay calm.',
      'Your cat is always ready to cheer you on!',
    ],
  },
];

const CATEGORY_COUNTS: Record<CatQuoteCategory, number> = {
  teen: 10,
  joke: 10,
  flirt: 10,
  healing: 10,
  study: 10,
  english: 10,
  poem: 10,
  wordplay: 10,
  philosophy: 10,
  meow: 10,
  folk: 0,
};

function buildQuotes(): CatQuote[] {
  let id = 1;
  return quoteSeeds.flatMap(({ category, phrases, englishPhrases }) => {
    const count = CATEGORY_COUNTS[category];
    const quotes: CatQuote[] = [];
    for (let index = 0; index < count; index += 1) {
      const phraseIndex = index % phrases.length;
      const phrase = phrases[phraseIndex];
      const englishPhrase = englishPhrases[phraseIndex];
      quotes.push({
        id: id++,
        category,
        text: `${phrase}\n${englishPhrase}`,
      });
    }
    return quotes;
  });
}

export const catQuotes: CatQuote[] = buildQuotes();

export const allCatQuotes: CatQuote[] = [
  ...catQuotes,
  ...folkSayings.map((saying) => ({
    id: 500 + saying.id,
    category: 'folk' as const,
    text: `${saying.text}\n${saying.englishText}`,
  })),
];

export const catQuoteCategoryCounts = CATEGORY_COUNTS;

export function getRandomCatQuote(lastQuoteId?: number): CatQuote {
  if (allCatQuotes.length < 2) return allCatQuotes[0];
  let quote = allCatQuotes[Math.floor(Math.random() * allCatQuotes.length)];
  while (quote.id === lastQuoteId) {
    quote = allCatQuotes[Math.floor(Math.random() * allCatQuotes.length)];
  }
  return quote;
}
