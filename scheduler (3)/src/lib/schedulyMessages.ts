export type SchedulyStatus = 'remind' | 'complete' | 'goodnight';

const remindMessages: string[] = [
  'Cưng ơi, đã đến giờ làm [Tên nhiệm vụ] rồi, đứng dậy tỏa sáng thôi 🌟',
  'Kửng kửng! Đến giờ làm [Tên nhiệm vụ] rồi, meow vào thôi!',
  'Đừng lướt tóp tóp nữa meow~ Vào làm [Tên nhiệm vụ] thôi!',
  'Vũ trụ gửi tín hiệu đến giờ làm [Tên nhiệm vụ] rồi kìa bạn ơi!',
  'Chú mèo Scheduly báo cáo: sắp đến lượt [Tên nhiệm vụ] nè!',
  'Ăn nhanh rüşa đi, giờ làm [Tên nhiệm vụ] tới ngay rồi đó!',
  'Cảnh báo cute: [Tên nhiệm vụ] đang chờ bạn thực hiện đó 💌',
  'Gọi bạn đi, [Tên nhiệm vụ] đang xì tin đợi bạn vào làm kìa!',
  'Bạn ơi, bật chế độ siêu tập trung và húc ngay [Tên nhiệm vụ] nào!',
  'Thử thách nè: hoàn thành [Tên nhiệm vụ] trước khi meow kêu 3 lần!',
  'Năng lượng tụ 100%, chuẩn bị tấn công [Tên nhiệm vụ] thôi nào!',
  'Lại đến lúc “tút tát” [Tên nhiệm vụ] rồi, làm cho thật ngầu nào!',
  'Meow báo tin: [Tên nhiệm vụ] cần bạn giải cứu ngay bây giờ!',
  'Bạn nhỏ ơi, [Tên nhiệm vụ] gọi tên bạn rồi, đừng để nó buồn nhé!',
  'Thời gian không chờ ai, đặc biệt là [Tên nhiệm vụ] đây, vào làm sớm nhé!',
  'Ai đó vừa nhắc nhẹ: [Tên nhiệm vụ] đang xịn lắm, làm liền đi nào!',
  'Cooldown xong rồi, lại vào trận [Tên nhiệm vụ] nha, mạnh mẽ lên thôi!',
  'Nói thiệt nha, [Tên nhiệm vụ] có xinh không? Vào làm càng sớm càng xịn!',
  'Bạn là boss, [Tên nhiệm vụ] chỉ chờ bạn chốt điều này thôi 😊',
  'Gõ gõ! Thông báo siêu cute: đã tới giờ [Tên nhiệm vụ] rồi đó!',
  'Sự nghiệp của bạn + [Tên nhiệm vụ] = combo ngày thành công, bắt đầu thôi!',
  'Mạng xã hội canh chưa bằng [Tên nhiệm vụ] chờ bạn canh, đi làm thôi!',
  'Đôi mắt mèo đang nhìn bạn: [Tên nhiệm vụ] ơi, mình sắp được hoàn thành rồi!',
  'Giờ này nhất định phải thần tốc với [Tên nhiệm vụ], Scheduly cùng bạn!',
  'Cục pin năng lượng đã sạc xong, tiếp tục chiến [Tên nhiệm vụ] nhé!',
  'Ta đã chờ rồi nè, [Tên nhiệm vụ] cùng chứng minh bạn là pro nào!',
  'Thêm một chút cute nữa thôi, và [Tên nhiệm vụ] sẽ bị lấp đầy ❤️',
  'Lượng meme tạm ngưng, bật năng suất với [Tên nhiệm vụ] đi nào!',
  'Tạm biệt procrastination, xin chào [Tên nhiệm vụ] siêu ngầu!',
  'Meow! Hành trình đến với [Tên nhiệm vụ] bắt đầu trong 3...2...1...',
  'Có tiếng gọi từ tương lai: [Tên nhiệm vụ] sẽ khiến bạn tự hào, vào thôi!',
  'Bật mode “Chủ tịch Scheduly” và quét sạch [Tên nhiệm vụ] ngay!',
  'Ánh sáng xanh của màn hình chỉ cần để phục vụ [Tên nhiệm vụ] thôi nha!',
  'Chuông báo cute: [Tên nhiệm vụ] đến hạn rồi, mình lên đường nào!',
  'Đã nghe tiếng meow? Đó là [Tên nhiệm vụ] thầm gọi bạn đó nha!',
  'Chuẩn bị tinh thần là “quẩy” [Tên nhiệm vụ] đi, bạn đạt top ngay!',
  'Đã đến phút thăng hoa của [Tên nhiệm vụ], đừng bỏ lỡ khoảnh khắc này!',
  'Lần này thì bạn là nhân vật chính, [Tên nhiệm vụ] đang chờ bạn tỏa sáng!',
  'Sắp thiệt rồi đó, [Tên nhiệm vụ] sẽ trở thành kỷ niệm ngoạn mục vì bạn!',
  'Giờ làm việc vàng đã đến, [Tên nhiệm vụ] chỉ chờ bạn thôi 💪',
  'Ủa, [Tên nhiệm vụ] đang gọi bạn bằng giọng rất cute, làm liền đi nhé!',
  'Bật mode siêu nhân một chút, [Tên nhiệm vụ] sẽ dễ dàng bị chinh phục thôi!',
  'Gừng càng đâm càng ngọt, còn [Tên nhiệm vụ] thì càng làm càng xịn đó!',
  'Đừng để [Tên nhiệm vụ] đứng đó chờ mình mãi, vào làm thôi bạn ê!',
  'Nhịp tim đang tăng, [Tên nhiệm vụ] cần một cú bứt phá ngay lúc này!',
  'Từ cái nhìn đầu tiên tới hành động đầu tiên, [Tên nhiệm vụ] đang chờ bạn rồi!',
  'Meow meow meow, [Tên nhiệm vụ] đang kêu bạn quá, đừng ngơ ngác nữa!',
  'Sắp tới giờ rồi, không cần lo lắng, chỉ cần bắt đầu [Tên nhiệm vụ] thôi!',
  'Đến lúc dùng hết “công lực” cho [Tên nhiệm vụ] rồi đó, cố lên nào!',
  'Mèo mèo ghiền chạy deadline, [Tên nhiệm vụ] hiện đang chờ bạn chốt luôn!',
  'Mình nghiêng đầu nhìn bạn, vẻ mặt nói rõ: [Tên nhiệm vụ] cần bạn ngay lập tức!',
  'Đừng để việc hôm nay kéo dài thành việc mai, ra tay với [Tên nhiệm vụ] nào!',
  'Hôm nay không cần perfect, chỉ cần bắt đầu [Tên nhiệm vụ] thôi!',
  'Báo động cute đã kêu, đừng làm [Tên nhiệm vụ] chờ thêm nữa nhé!',
  'Tụ năng lượng một nhịp nữa thôi, [Tên nhiệm vụ] sẽ được “đập tan” ngay!',
  'Có một nguồn sức mạnh bé nhỏ đang gọi tên bạn: [Tên nhiệm vụ] đó!',
  'Làm một chút thôi, rồi [Tên nhiệm vụ] sẽ cảm thấy mình được yêu thương lắm!',
  'Đã đến thời khắc xanh chín của [Tên nhiệm vụ], lên đường thôi bạn ơi!',
];

const completeMessages: string[] = [
  'Chíuuuu! Xuất sắc quá bạn ơi, Scheduly đang vỗ tay nè 🐾',
  'Nhiệm vụ [Tên nhiệm vụ] đã bị tiêu diệt! Bạn đỉnh quá meow~',
  'Cho Scheduly đập tay 🐾 cái coi, năng suất quá đi mất!',
  'Ngưỡng mộ bạn quá, cách bạn hoàn thành [Tên nhiệm vụ] siêu xịn luôn!',
  'Meow! Bạn vừa làm một điều tuyệt vời, cảm xúc ấm áp quá đi!',
  'Ghê quá trời, [Tên nhiệm vụ] đã xong và bạn là người hùng của hôm nay!',
  'Tự hào vô hạn luôn, màn hoàn thành này của bạn đúng là đỉnh!',
  'Nghĩa là bạn vừa biến [Tên nhiệm vụ] thành chiến tích, đã quá rồi đó!',
  'Tim mình đập thình thịch vì bạn, quá ngầu luôn!',
  'Cục tim này dành cho bạn nha 💖 [Tên nhiệm vụ] đã được ghi danh!',
  'Hội chân ái là bạn và [Tên nhiệm vụ], đúng là cặp đôi hoàn hảo!',
  'Vừa rồi là một pha cực phẩm, bạn thiệt là ảo diệu!',
  'Nét căng quá! Scheduly muốn in bằng vào album chiến thắng của bạn!',
  'Từng phím bấm một, từng bước bạn đã chinh phục [Tên nhiệm vụ] rồi!',
  'Ăn mừng thay bạn luôn, tâm trạng Scheduly hiện tại: lâng lâng!',
  'Hài như phim, bạn vừa làm [Tên nhiệm vụ] xong mà vẫn cute gê!',
  'Chạm đích rồi nha! Cảm giác như siêu anh hùng của bạn đang hiện hữu!',
  'Bắn tim to bự cho bạn, rất rất rất ngầu đó!',
  'Một nụ cười vì bạn đây, [Tên nhiệm vụ] đã biến thành chiến thắng!',
  'Sếp Scheduly bổ nhiệm bạn là “Cao thủ xong việc” luôn rồi!',
  'Bạn thật đáng yêu khi crush [Tên nhiệm vụ] tới mức này!',
  'Có thể phong bạn là “Đại hiệp tiêu diệt nhiệm vụ” được không?',
  'Cái thở phào nhẹ nhõm này là dành cho bạn, ổn quá luôn!',
  'Một đòn tâm lý mạnh: bạn làm thật rồi đó, siêu tự hào!',
  'Nghe tiếng “Xong rồi!” mà Scheduly hạnh phúc muốn nhảy lên!',
  'Hôm nay bạn làm trò đỉnh rồi, như kiểu xem phim hành động mà cute!',
  'Ui trời, [Tên nhiệm vụ] đã hoàn thành, mình phải chúc mừng bạn ngay!',
  'Gọi đó là “điểm 10 quyền lực” cũng không đủ, bạn quá giỏi!',
  'Từ “thần thánh” cũng chưa đủ nói về bạn ngày hôm nay!',
  'Too cool! Bạn vừa khiến Scheduly muốn nhảy múa!',
  'Xin chúc mừng! Một pha hoàn thành mà ai cũng phải trầm trồ!',
  'Đã xong [Tên nhiệm vụ] rồi? Tin được không, bạn vừa làm điều siêu đỉnh!',
  'Cả trái tim và cả bộ não đều cảm ơn bạn, quá xuất sắc!',
  'Mình muốn thả tim 1000 cái cho bạn ngay lập tức!',
  'Mỗi bước bạn đi là một dấu ấn, tuyệt vời quá!',
  'Bạn hoàn thành cái này dễ như trở bàn tay, không thể dễ hơn nữa!',
  'Hài hước mà thật: bạn vừa tặng thành công một tác phẩm cho bản thân!',
  'Trên thang điểm “cute năng suất”, bạn đạt 10/10 rồi!',
  'Đúng là “người hùng ngày thường”, bạn đã vượt qua [Tên nhiệm vụ] rồi!',
  'Khen ngợi bạn 1000 lần luôn, hi vọng bạn nghe thấy tim Scheduly đang rung rinh!',
  'Bạn vừa làm [Tên nhiệm vụ] xong mà còn có thời gian nhìn ngầu ngầu nữa, ôi thôi!',
  'Một cú làm xong mà còn đẹp như tranh, đúng là thần tượng quá bạn ơi!',
  'Nhiệm vụ [Tên nhiệm vụ] đã biến mất khỏi bản đồ, thật là một kỳ tích!',
  'Cho mình nói thật: bạn vừa làm nên một điều vô cùng đỉnh, không ai phủ nhận đâu!',
  'Từ góc nhìn của Scheduly, bạn vừa thành công cực kỳ ngầu và cực kỳ đáng yêu!',
  'Đúng là “đã hoàn thành rồi mà vẫn muốn làm thêm một cái nữa” chất lượng quá!',
  'Đừng nói gì, mình chỉ biết ôm bạn thật chặt vì đã làm xong [Tên nhiệm vụ]!',
  'Lần này là chiến thắng trọn vẹn, [Tên nhiệm vụ] đã bị chinh phục rồi!',
  'Đỉnh của đỉnh, điều này xứng đáng được treo ở bảng vàng của bạn!',
  'Sáng nay bạn đã làm nên điều gì đó thật tuyệt, mình khen bạn mấy tiếng rồi!',
  'Ngầu tới mức cả mèo cũng phải đứng ngồi không yên vì bạn quá đỉnh!',
  'Việc này xong rồi, bạn có thể tự thưởng một cái ôm thật lớn nữa đó!',
];

const goodnightMessages: string[] = [
  'Meow~ Hôm nay bạn đã vất vả rồi, ngủ thật ngon nhé nhé 💤',
  'Tắt đèn đi ngủ thôi, Scheduly buồn ngủ ríu cả mắt rồi nè...',
  'Hôm nay tuyệt vời rồi, giờ mình nghỉ ngơi để mai lại tiếp tục nhé.',
  'Ngủ ngon nha bạn, mai Scheduly sẽ lại cùng bạn chiến tiếp!',
  'Màn đêm nhẹ nhàng gọi tên bạn, để Scheduly giữ giấc mơ dễ thương nha.',
  'Thả lỏng đi nào, bạn xứng đáng được ngủ sâu sau một ngày đầy nỗ lực.',
  'Cất công việc vào góc đi, chỉ còn lại yên bình và giấc ngủ thôi.',
  'Mỗi giấc ngủ ngon là một phần thưởng, ngủ thật chill nhé bạn!',
  'Sẽ có sáng mai chào đón bạn, giờ thì nhắm mắt và mơ gì dễ chịu đi.',
  'Hẹn gặp lại vào sáng mai, Scheduly cũng thương bạn lắm đó.',
  'Nhắm mắt lại, hít thở thật chậm, ngày mai lại tiếp tục hành trình tâm huyết.',
  'Hãy để trạng thái “chill” chiếm lĩnh, bạn vừa làm việc đủ rồi đó.',
  'Đặt đầu lên gối thôi nào, Scheduly đang sợi lông mềm mại chờ bạn.',
  'Tạm biệt công việc, chào đón sự ấm áp của giấc ngủ nhé.',
  'Một giấc ngủ ngon sẽ giúp bạn tái tạo năng lượng cho ngày mai.',
  'Tối nay bạn được quyền thư giãn, hành trình tiếp theo sẽ đợi bình minh.',
  'Thả mọi áp lực, để tâm hồn bạn được nghỉ ngơi cùng Scheduly.',
  'Ngày hôm nay đã đủ hoàn hảo, giờ mình cần một giấc ngủ thật êm.',
  'Ngủ ngon nha, Scheduly sẽ giữ hộ giấc mơ cho bạn thật dịu dàng.',
  'Chúc bạn một đêm an lành, mai lại tiếp tục cùng nhau chiến nhé!',
  'Đêm nay hãy để mọi bộn bề rơi khỏi vai, Scheduly sẽ đợi bạn trong giấc mơ nhẹ nhàng.',
  'Cứ để mắt mình khép lại thôi, đừng nghĩ gì cả, chỉ cần ngủ thật sâu và ấm áp.',
  'Mỗi hơi thở nhẹ là một lời chúc cho bạn, ngủ ngon và bình yên nhé.',
  'Sáng mai sẽ đến với một nụ cười, nên tối nay hãy thư giãn và nghỉ ngơi.',
  'Đừng quên ôm một chút bình yên trước khi ngủ, Scheduly sẽ giữ cho bạn một đêm thật dễ thương.',
];

const messagesByStatus: Record<SchedulyStatus, string[]> = {
  remind: remindMessages.slice(0, 40),
  complete: completeMessages.slice(0, 40),
  goodnight: goodnightMessages.slice(0, 20),
};

const lastMessageIndexesByStatus: Record<SchedulyStatus, number[]> = {
  remind: [],
  complete: [],
  goodnight: [],
};

function getRandomIndex(status: SchedulyStatus): number {
  const messages = messagesByStatus[status];
  const length = messages.length;
  if (length === 0) return 0;

  const history = lastMessageIndexesByStatus[status];
  const availableIndexes = messages
    .map((_, idx) => idx)
    .filter((idx) => !history.includes(idx));

  const index = availableIndexes.length > 0
    ? availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
    : Math.floor(Math.random() * length);

  history.unshift(index);
  if (history.length > 3) {
    history.pop();
  }

  return index;
}

export function getSchedulyMessage(status: SchedulyStatus, taskName?: string): string {
  const messages = messagesByStatus[status];
  const index = getRandomIndex(status);
  const raw = messages[index];

  if (!taskName) {
    return raw.replace(/\[Tên nhiệm vụ\]/g, 'nhiệm vụ');
  }

  return raw.replace(/\[Tên nhiệm vụ\]/g, taskName.trim());
}
