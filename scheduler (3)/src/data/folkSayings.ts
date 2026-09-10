export type FolkSayingKind = 'ca-dao' | 'tuc-ngu';

export interface FolkSaying {
  id: number;
  kind: FolkSayingKind;
  text: string;
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

const gentleEndings = [
  'Nhắc người kiên nhẫn, giữ lòng thủy chung.',
  'Dạy ta tử tế, biết cùng sẻ chia.',
  'Khuyên người bền chí, sớm khuya gắng làm.',
  'Giữ cho nghĩa nặng, tình sâu lâu bền.',
  'Để lòng thanh thản, bước chân nhẹ nhàng.',
  'Mèo nghe cũng gật, bạn làm được thôi.',
  'Học thêm một chút, ngày mai thêm vui.',
  'Sống sao cho đẹp, để đời mến thương.',
  'Chậm mà chắc bước, rồi đường sẽ thông.',
  'Gom điều tử tế, thành vòng bình an.',
];

function buildFolkSayings(): FolkSaying[] {
  const sayings: FolkSaying[] = [];
  let id = 1;
  const usedTexts = new Set<string>();

  const addSaying = (kind: FolkSayingKind, text: string) => {
    if (usedTexts.has(text) || sayings.length >= 500) return;
    usedTexts.add(text);
    sayings.push({ id: id++, kind, text });
  };

  proverbLines.forEach((text) => addSaying('tuc-ngu', text));
  folkLines.forEach((text) => addSaying('ca-dao', text));

  const sourceLines = [...proverbLines, ...folkLines];
  for (const source of sourceLines) {
    for (const ending of gentleEndings) {
      addSaying(sourceLines.indexOf(source) < proverbLines.length ? 'tuc-ngu' : 'ca-dao', `${source} ${ending}`);
      if (sayings.length >= 500) return sayings;
    }
  }

  return sayings;
}

export const folkSayings = buildFolkSayings();
