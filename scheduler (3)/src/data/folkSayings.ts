export type FolkSayingKind = 'ca-dao' | 'tuc-ngu';

export interface FolkSaying {
  id: number;
  kind: FolkSayingKind;
  text: string;
  englishText: string;
}

const proverbLines = [
  'Có công mài sắt, có ngày nên kim.', 'Có chí thì nên.', 'Đi một ngày đàng, học một sàng khôn.',
  'Học ăn, học nói, học gói, học mở.', 'Không thầy đố mày làm nên.', 'Tiên học lễ, hậu học văn.',
  'Ăn quả nhớ kẻ trồng cây.', 'Uống nước nhớ nguồn.', 'Lá lành đùm lá rách.', 'Một con ngựa đau, cả tàu bỏ cỏ.',
  'Thương người như thể thương thân.', 'Bầu ơi thương lấy bí cùng.', 'Một cây làm chẳng nên non.',
  'Ba cây chụm lại nên hòn núi cao.', 'Đoàn kết là sức mạnh.', 'Gần mực thì đen, gần đèn thì sáng.',
  'Tốt gỗ hơn tốt nước sơn.', 'Cái nết đánh chết cái đẹp.', 'Đói cho sạch, rách cho thơm.',
  'Giấy rách phải giữ lấy lề.', 'Thẳng như ruột ngựa.', 'Cây ngay không sợ chết đứng.', 'Ở hiền gặp lành.',
  'Gieo gió gặt bão.', 'Gieo nhân nào, gặt quả nấy.', 'Trăm nghe không bằng một thấy.',
  'Tai nghe không bằng mắt thấy.', 'Nói có sách, mách có chứng.', 'Lời nói chẳng mất tiền mua.',
  'Lựa lời mà nói cho vừa lòng nhau.', 'Một lần bất tín, vạn lần bất tin.', 'Biết thì thưa thốt.',
  'Kính trên nhường dưới.', 'Kính lão đắc thọ.', 'Anh em như thể tay chân.', 'Chị ngã em nâng.',
  'Máu chảy ruột mềm.', 'Con hơn cha là nhà có phúc.', 'Tre già măng mọc.', 'Uốn cây từ thuở còn non.',
  'Dạy con từ thuở còn thơ.', 'Cá không ăn muối cá ươn.', 'Thuốc đắng dã tật.', 'Sự thật mất lòng.',
  'Lửa thử vàng, gian nan thử sức.', 'Thất bại là mẹ thành công.', 'Sau cơn mưa, trời lại sáng.',
  'Kiến tha lâu cũng đầy tổ.', 'Năng nhặt chặt bị.', 'Tích tiểu thành đại.', 'Góp gió thành bão.',
];

const proverbTranslations = [
  'Perseverance can turn an iron bar into a needle.',
  'Where there is a will, there is a way.',
  'Travel far for a day, and you will gain a basketful of knowledge.',
  'Learn how to eat, speak, wrap, and open.',
  'Without a teacher, it is hard to succeed.',
  'First learn good manners, then learn your lessons.',
  'When enjoying fruit, remember who planted the tree.',
  'When drinking water, remember its source.',
  'Whole leaves protect torn ones; those who have more should help those in need.',
  'When one horse is hurt, the whole stable feels the pain.',
  'Love others as you love yourself.',
  'Please, gourd, embrace the squash; though we share different vines, we share the same trellis.',
  'One tree alone cannot make a forest.',
  'Three trees together can form a mountain.',
  'Unity is strength.',
  'Near ink you grow dark; near a lamp you grow bright.',
  'Good wood matters more than a fine coat of paint.',
  'Good character outlasts outward beauty.',
  'Stay clean in spirit, even when life is hard.',
  'Even if the paper is torn, keep its margins neat.',
  'Be as honest as your own heart.',
  'An upright tree need not fear being struck down.',
  'Kindness is met with kindness.',
  'Sow the wind, reap the storm.',
  'You reap what you sow.',
  'Seeing once is worth hearing a hundred times.',
  'Hearing cannot compare to seeing with your own eyes.',
  'Make claims with evidence, and give advice with proof.',
  'Words cost nothing, so choose them with care.',
  'Choose your words to bring comfort to one another.',
  'Once trust is broken, it takes a thousand acts to restore it.',
  'If you know, speak up; if you do not, listen.',
  'Respect those above you and care for those below.',
  'Respect your elders and you will live a long life.',
  'Siblings are like hands and feet.',
  'When one sibling falls, another helps them up.',
  'Blood runs thicker than water.',
  'A family is blessed when children surpass their parents.',
  'Old bamboo makes way for new shoots.',
  'Guide a tree while it is still young.',
  'Teach children while they are still young.',
  'A fish that will not take salt will rot; a child who defies their parents will go astray.',
  'Bitter medicine cures the illness.',
  'The truth can be hard to hear.',
  'Fire tests gold; hardship tests strength.',
  'Failure is the mother of success.',
  'After the rain, the sky clears.',
  'With patience, even ants can fill their nest.',
  'Little by little, the bag becomes full.',
  'Small things add up to something great.',
  'Many small breezes can become a storm.',
];

const folkLines = [
  'Công cha như núi Thái Sơn,', 'Nghĩa mẹ như nước trong nguồn chảy ra,',
  'Một lòng thờ mẹ kính cha,', 'Cho tròn chữ hiếu mới là đạo con.',
  'Anh em nào phải người xa,', 'Cùng chung bác mẹ, một nhà cùng thân.',
  'Yêu nhau như thể tay chân,', 'Anh em hòa thuận, hai thân vui vầy.',
  'Khôn ngoan đối đáp người ngoài,', 'Gà cùng một mẹ chớ hoài đá nhau.',
  'Nhiễu điều phủ lấy giá gương,', 'Người trong một nước phải thương nhau cùng.',
  'Dù ai đi ngược về xuôi,', 'Nhớ ngày giỗ Tổ mùng mười tháng ba.',
  'Ta về ta tắm ao ta,', 'Dù trong dù đục, ao nhà vẫn hơn.',
  'Râu tôm nấu với ruột bầu,', 'Chồng chan vợ húp gật gù khen ngon.',
  'Trời sinh voi, trời sinh cỏ,', 'Có thực mới vực được đạo.',
  'Cá không ăn muối cá ươn,', 'Con cãi cha mẹ trăm đường con hư.',
  'Muốn sang thì bắc cầu Kiều,', 'Muốn con hay chữ thì yêu lấy thầy.',
  'Nhất tự vi sư, bán tự vi sư.', 'Không thầy đố mày làm nên.',
  'Lời nói gói vàng,', 'Lời nói chẳng mất tiền mua.',
  'Chim khôn kêu tiếng rảnh rang,', 'Người khôn nói tiếng dịu dàng dễ nghe.',
  'Khéo ăn thì no, khéo co thì ấm.', 'Ăn trông nồi, ngồi trông hướng.',
  'Có làm thì mới có ăn,', 'Không dưng ai dễ đem phần đến cho.',
  'Bàn tay ta làm nên tất cả,', 'Có sức người sỏi đá cũng thành cơm.',
  'Ai ơi đừng bỏ ruộng hoang,', 'Bao nhiêu tấc đất tấc vàng bấy nhiêu.',
  'Tấc đất tấc vàng.', 'Nhất nước, nhì phân, tam cần, tứ giống.',
  'Trăng bao nhiêu tuổi trăng già,', 'Núi bao nhiêu tuổi gọi là núi non.',
  'Gió đưa cành trúc la đà,', 'Tiếng chuông Trấn Vũ, canh gà Thọ Xương.',
  'Đường vô xứ Nghệ quanh quanh,', 'Non xanh nước biếc như tranh họa đồ.',
  'Ai ơi giữ chí cho bền,', 'Dù ai xoay hướng đổi nền mặc ai.',
];

const folkTranslations = [
  'A father’s love is as vast as Mount Thai Son; a mother’s love flows like water from its source.',
  'Honor your parents with all your heart; that is the true path of a child.',
  'Siblings are never strangers; they share the same parents and home.',
  'When siblings live in harmony, their parents rejoice.',
  'Be wise and gracious with those beyond your home; siblings should never fight among themselves.',
  'Let the silk cloth cover the mirror; people of one country should care for one another.',
  'Wherever you travel, remember the Hung Kings’ festival on the tenth day of the third lunar month.',
  'I return to bathe in my own pond; clear or cloudy, home is still best.',
  'Shrimp heads simmer with gourd; husband and wife share the meal with delight.',
  'A fish that will not take salt will rot; a child who defies their parents will go astray.',
  'To cross the river, build the Kieu bridge; to help your child learn, cherish their teacher.',
  'Even one written character makes a teacher; a teacher’s guidance is precious.',
  'Words are worth gold; they cost nothing, so choose them with care.',
  'The clever bird sings clearly; the wise person speaks gently.',
  'Eat with care and live within your means; mind your manners wherever you are.',
  'Only those who work will have food; no one gets a share for doing nothing.',
  'Our hands can accomplish anything; human effort can turn stone into food.',
  'Do not leave the fields abandoned; every patch of land is worth its weight in gold.',
  'Every patch of land is precious; water, soil, care, and seed each matter.',
  'How old is the moon? When does a mountain become a hill?',
  'The breeze sways bamboo branches; bells ring at Tran Vu as roosters crow at Tho Xuong.',
  'The road through Nghe winds along, surrounded by green hills and clear waters like a painting.',
  'Hold firmly to your purpose, no matter how others change direction.',
];

function buildFolkSayings(): FolkSaying[] {
  const sayings: FolkSaying[] = [];
  let id = 1;

  proverbLines.forEach((text, index) => sayings.push({
    id: id++,
    kind: 'tuc-ngu',
    text,
    englishText: proverbTranslations[index],
  }));

  let translationIndex = 0;
  for (let index = 0; index + 1 < folkLines.length; index += 2) {
    if (index === 18) continue;
    const firstLine = folkLines[index].replace(/[,.!?;:]\s*$/, '');
    const secondLine = folkLines[index + 1].replace(/[,.!?;:]\s*$/, '');
    sayings.push({
      id: id++,
      kind: 'ca-dao',
      text: `${firstLine}, ${secondLine.charAt(0).toLocaleLowerCase()}${secondLine.slice(1)}.`,
      englishText: folkTranslations[translationIndex++],
    });
  }

  return sayings;
}

export const folkSayings = buildFolkSayings();
