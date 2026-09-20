export type SchedulyStatus = 'remind' | 'complete' | 'goodnight';

const buildUniqueComboMessages = (openerPool: string[], middlePool: string[], closePool: string[], total: number): string[] => {
  const messages: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; messages.length < total && i < openerPool.length * middlePool.length * closePool.length; i += 1) {
    const opener = openerPool[i % openerPool.length];
    const middle = middlePool[Math.floor(i / openerPool.length) % middlePool.length];
    const close = closePool[Math.floor(i / (openerPool.length * middlePool.length)) % closePool.length];
    const message = `${opener} ${middle} ${close}`.replace(/\s+/g, ' ').trim();
    if (!seen.has(message)) {
      seen.add(message);
      messages.push(message);
    }
  }

  return messages;
};

const remindOpeners = [
  'Mèo vừa check lịch xong,',
  'Hôm nay đã tới đúng thời điểm,',
  'Bật chế độ focus nhẹ thôi,',
  'Đừng để lịch chờ mãi,',
  'Giữ bình tĩnh rồi bắt tay thôi,',
  'Một nhịp reset nhỏ là đủ,',
  'Bản đồ nhiệm vụ vừa sáng lên,',
  'Tín hiệu từ Scheduly vừa bật,',
  'Cú nhắn nhủ rất chill đây,',
  'Đã đến lúc chuyển từ “sắp làm” sang “đang làm”,',
  'Đừng lùi bước vì lịch còn dài,',
  'Bạn đang ở đúng giai đoạn cần lên tay,',
];

const remindMiddles = [
  'đã đến lúc xử lý [Tên nhiệm vụ] thôi.',
  '[Tên nhiệm vụ] đang chờ bạn làm xong đúng nhịp.',
  'cố lên một chút là [Tên nhiệm vụ] sẽ dễ hơn rất nhiều.',
  '[Tên nhiệm vụ] xứng đáng được bạn chăm chút vào.',
  'chỉ cần bắt đầu với [Tên nhiệm vụ] là tiến độ đã có chiều hướng.',
  'bạn đủ tỉnh táo để chinh phục [Tên nhiệm vụ] rồi.',
  'hành trình của [Tên nhiệm vụ] bắt đầu từ một cú nhấn mạnh.',
  '[Tên nhiệm vụ] vừa gọi tên bạn thôi, đừng ngại.',
  'để bớt nặng thì hãy giải quyết [Tên nhiệm vụ] từng bước.',
  'một nhịp làm thật tốt sẽ làm [Tên nhiệm vụ] nhẹ đi hẳn.',
  'mèo tin bạn làm được [Tên nhiệm vụ] trong vài phút đầu.',
  'một cú bắt tay vào việc là [Tên nhiệm vụ] sẽ có điểm dừng.',
];

const remindClosers = [
  'Dành cho bạn một bước khởi đầu thật đẹp.',
  'Bắt đầu thôi, sau đó mọi thứ dễ hơn nhiều.',
  'Bạn không cần hoàn hảo, chỉ cần làm tới nơi.',
  'Tốc độ không quan trọng, quan trọng là đã cất bước.',
  'Lúc này, chỉ cần làm là đã khác rồi.',
  'Năng lượng của bạn đang sẵn sàng chờ lệnh.',
  'Mèo tin là bạn có thể làm tốt hơn mình nghĩ.',
  'ấp kế hoạch lên, rồi đi tiếp thôi nào.',
  'Không cần nghĩ quá nhiều, bắt đầu là thắng nửa trận.',
  'Mỗi bước nhỏ đều là chiến thắng rất đáng tự hào.',
  'Cứ làm vừa sức, rồi mọi thứ sẽ trôi tốt hơn.',
  'Bạn xứng đáng có ngày làm việc thật tròn vẹn.',
];

const remindMessages = buildUniqueComboMessages(remindOpeners, remindMiddles, remindClosers, 100);

const completeOpeners = [
  'Meow, sáng mặt lên rồi!',
  'Tuyệt thật đấy,',
  'Chốt xong rồi thì',
  'Mèo đã thấy bạn làm rất tốt,',
  'Năng suất vừa vượt chuẩn,',
  'Đây là một pha hoàn thành rất đẹp,',
  'Mèo đánh giá bạn cao thật,',
  'Tự nhìn lại thôi cũng thấy ổn rồi,',
  'Đừng nói nhiều, vì',
  'Bạn vừa làm một việc rất đáng tự hào,',
  'Cố gắng thật rồi, giờ đến phần ăn mừng,',
  'Một dấu chấm hết cho [Tên nhiệm vụ],',
];

const completeMiddles = [
  '[Tên nhiệm vụ] đã được xử lý gọn gàng.',
  '[Tên nhiệm vụ] đã biến thành chiến tích thật sự.',
  'bạn vừa chốt xong [Tên nhiệm vụ] không hề cẩu thả.',
  'một lần nữa bạn chứng minh mình rất có khả năng.',
  'điểm số năng suất của bạn vừa tăng hẳn lên.',
  '[Tên nhiệm vụ] không còn là gánh nặng, mà là một thành công.',
  'đúng là bạn đang đi đúng nhịp với bản thân.',
  'tiến độ của bạn nghe rất đáng ngưỡng mộ.',
  'bạn đã khiến [Tên nhiệm vụ] phải gục ngã trước sự ổn định.',
  'một việc đã xong, một việt trình lại trọn vẹn hơn.',
  'bạn đã xóa sạch nỗi ngại với [Tên nhiệm vụ].',
  'đây chính là kiểu hoàn thành có tâm và có chất.',
];

const completeClosers = [
  'Hãy để mình vỗ tay cho bạn một hồi.',
  'Bạn đáng được tự thưởng một chút nào đó.',
  'Cứ giữ nhịp này, ngày mai còn đẹp hơn.',
  'Mèo đang ngồi cười vì rất thích kiểu bạn làm việc.',
  'Tự tin thêm một nhịp nữa là mọi thứ sẽ lên thôi.',
  'Dành cho bạn một khoảng nghỉ thật xứng đáng.',
  'Đây là kiểu hoàn thành mà ai cũng nên học hỏi.',
  'Bạn làm tốt hơn nhiều so với lần trước.',
  'Mèo chúc bạn giữ phong độ này đến hết tuần.',
  'Cứ như vậy rồi thành công sẽ đi cùng bạn.',
  'Rất đáng khen và rất đáng được giữ lại.',
  'Đây là lúc nên vui một chút rồi quay lại nhé.',
];

const completeMessages = buildUniqueComboMessages(completeOpeners, completeMiddles, completeClosers, 120);

const goodnightMessages: string[] = [
  'Mèo thấy bạn đã làm rất đủ rồi, giờ hãy đặt lịch cho giấc ngủ thôi.',
  'Tối nay hãy bỏ hết mọi cái còn lo, Scheduly sẽ giữ hộ bạn một giấc ngắn thật êm.',
  'Một ngày đã trôi qua rất ổn, hãy để cơ thể nghỉ ngơi đúng lúc.',
  'Đừng giữ quá nhiều suy nghĩ quá muộn, hãy khép mắt và nghỉ ngơi.',
  'Bạn xứng đáng được ngủ sâu sau một ngày làm việc chăm chỉ.',
  'Thư giãn một chút đi, ngày mai sẽ luôn có một khởi đầu mới.',
  'Đêm nay chỉ cần ôm một chút yên bình, Scheduly sẽ cùng bạn ngủ ngon.',
  'Một giấc ngủ thật sâu là cách tốt nhất để tiếp tục đi tiếp.',
  'Đừng quên hít thở chậm rồi thôi, mình đã làm đủ rồi.',
  'Mai lại bắt đầu bằng một nụ cười, tối nay chỉ cần ngủ thôi.',
  'Càng cuối ngày, càng cần bình tĩnh và dễ thương hơn.',
  'Mèo gửi cho bạn một đêm mát mẻ và một giấc ngủ thật ngon.',
  'Tắt mọi nhắc nhở một lúc, để ngày mai đến với bạn trong trạng thái sẵn sàng hơn.',
  'Một giấc ngủ ngon không phải là lười, mà là cách recharge thông minh.',
  'Đêm nay bạn được phép nghỉ ngơi và không cần phải hoàn hảo.',
  'Sáng mai sẽ tới, còn tối nay hãy để tay và đầu óc được dịu lại.',
  'Bạn đã đủ cố gắng cho một ngày, giờ thì để cơ thể và tâm trí nghỉ ngơi.',
  'Mèo chúc bạn một đêm nhẹ nhàng, sâu và đầy năng lượng cho ngày mai.',
  'Đêm nay, chỉ cần ngủ ngon là thành công rồi đó.',
  'Khép mắt đi, ngày mai đã sẵn sàng chào đón bạn bằng một khởi đầu mới.',
  'Mèo sẽ giữ giấc mơ cho bạn thật dịu, để mai bạn lại sáng hơn.',
];

const pomodoroOpeners = [
  'Phiên này xong rồi,',
  'Mèo vừa thấy bạn vượt qua một nhịp cực chất,',
  'Một phiên làm việc xong,',
  'Chốt xong một vòng rồi,',
  'Bạn vừa hoàn thành một “chốt độ” rất ổn,',
  'Một nhịp tiến bộ mới đã xuất hiện,',
  'Thêm một phiên cùng bạn đã xong,',
  'Mèo đứng đây cổ vũ thôi,',
  'Đã qua một vòng thật xứng đáng,',
  'Tiếp tục dòng chảy tích cực,',
  'Đúng là phong độ hôm nay rất ổn,',
  'Cứ giữ nhịp này thôi,',
  'Một phiên bạn vừa thắng được rồi,',
  'Bạn đã làm rất ổn với vòng này,',
  'Mèo đánh giá phiên này rất tốt,',
  'Đòn bẩy hiệu suất vừa bật lên,',
  'Chốt thành công một phiên,',
  'Khởi động xong rất ngon,',
  'Mèo rất thích nhịp làm việc này,',
  'Bạn vừa đi qua một vòng cực đẹp,',
];

const pomodoroMiddles = [
  'tốc độ của bạn đang rất bền.',
  'đừng để sự ổn định này bị mất đi.',
  'cứ giữ nguyên nhịp là đã tiến đúng hướng.',
  'năng lượng đang rất hợp với kế hoạch.',
  'đấy là một phiên làm việc có tâm và có chất.',
  'giữ tinh thần thoải mái nhưng không chùn tay.',
  'bạn đang làm rất tốt, không cần ép mình quá.',
  'đây là kiểu ổn định mà ai cũng muốn có.',
  'mỗi phiên như vậy đều đang xây nên tiến độ thật sự.',
  'bạn thực sự đang làm rất tròn vẹn.',
  'viec này không cần khoe, chỉ cần giữ cái nhịp này.',
  'đây là một phiên đáng tự hào và đáng ghi nhớ.',
  'chỉ cần tiếp tục như thế, mọi thứ sẽ dễ hơn.',
  'còn vài nhịp nữa là bạn đã ở đúng trạng thái tốt.',
  'mọi thứ đang đi vào đúng vị trí.',
  'nghỉ một chút rồi quay tiếp là hợp lý nhất.',
  'đây là kiểu tiến độ mà mèo rất thích.',
  'bạn đã quá đủ để tin mình rồi.',
  'giữ nhịp này là mạch làm việc đang lên.',
  'một phiên xong là thêm một lý do để tự tin.',
];

const pomodoroClosers = [
  'Tới phiên tiếp theo, mình tin bạn sẽ làm tiếp rất đỉnh.',
  'Cứ giữ tinh thần như thế, ngày nào cũng có thể chốt tốt.',
  'Hãy đi tiếp với cái nhịp này, rất đáng để giữ lại.',
  'Bạn không cần đẹp hơn, chỉ cần đều hơn là đủ.',
  'Một phiên nữa thôi là đang đi đúng route rồi.',
  'Chúc bạn giữ được vibes này cho đến cuối ngày.',
  'Nghỉ ngắn rồi lại bứt lên là phong cách pro.',
  'Đây là kiểu làm việc đáng được thưởng ngắn.',
  'Mèo rất vui vì bạn đang làm rất có logic.',
  'Giữ cái nhịp này đi, bạn đang rất ổn.',
  'Bạn đã có thể tự tin hơn rồi đấy.',
  'Một lần nữa, bạn đang làm rất đúng.',
  'Đừng chùn tay, cứ đi tiếp cho tròn nhịp.',
  'Mèo tin bạn sẽ làm tốt ở lần sau cũng như lần này.',
  'Tiếp tục thôi, không cần vội, nhưng cũng không được chậm.',
  'Đây là khoảng thời gian rất đáng quý cho bạn.',
  'Cứ làm như thế là mọi thứ sẽ sáng rõ hơn.',
  'Bạn đã chứng minh mình không hề tệ.',
  'Nói thật, phiên này rất có chất lượng.',
  'Giữ chắc cảm giác này để ngày mai còn tốt hơn.',
];

export const pomodoroEncouragementMessages = buildUniqueComboMessages(pomodoroOpeners, pomodoroMiddles, pomodoroClosers, 500);

const messagesByStatus: Record<SchedulyStatus, string[]> = {
  remind: remindMessages,
  complete: completeMessages,
  goodnight: goodnightMessages,
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

export function getRandomPomodoroEncouragementMessage(): string {
  if (pomodoroEncouragementMessages.length === 0) return 'Mèo rất vui vì bạn đã hoàn thành một phiên làm việc rất ổn!';

  let index = Math.floor(Math.random() * pomodoroEncouragementMessages.length);
  while (index === lastPomodoroEncouragementIndex) {
    index = Math.floor(Math.random() * pomodoroEncouragementMessages.length);
  }
  lastPomodoroEncouragementIndex = index;
  return pomodoroEncouragementMessages[index];
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

let lastPomodoroEncouragementIndex = -1;
