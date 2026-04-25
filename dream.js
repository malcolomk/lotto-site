export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dream } = req.body;
  if (!dream || typeof dream !== 'string') {
    return res.status(400).json({ error: '꿈 내용을 입력해주세요.' });
  }

  // 간단한 지연을 줘서 AI가 생각하는 것처럼 연출
  await new Promise(resolve => setTimeout(resolve, 1500));

  let stars = 2;
  let interpretation = "이 꿈은 현재의 심리 상태가 반영된 일상적인 꿈일 가능성이 큽니다. 당장의 큰 횡재수보다는 일상의 소소한 행복에 집중해보시는 것은 어떨까요? 물론 복권은 가벼운 마음으로 즐기는 것도 좋습니다.";

  const text = dream.replace(/\s+/g, '');

  // 키워드별 가중치 및 풀이 (1등: 돼지, 똥, 피, 조상, 불, 대통령 등)
  if (text.includes('돼지') || text.includes('똥') || text.includes('변') || text.includes('대변')) {
    stars = 5;
    interpretation = "정말 엄청난 길몽입니다! 예로부터 이런 꿈은 엄청난 재물운과 횡재수를 상징합니다. 복권을 당장 구매하셔도 좋을 만큼 아주 강력한 재물운이 들어와 있습니다. 좋은 기운을 놓치지 마세요!";
  } else if (text.includes('피') || text.includes('불') || text.includes('화재') || text.includes('조상') || text.includes('돌아가신')) {
    stars = 4;
    interpretation = "매우 좋은 꿈입니다! 불길이 번지거나 피를 보는 꿈, 혹은 조상님이 나오는 꿈은 재물과 행운이 따를 것을 암시하는 대표적인 길몽입니다. 이번 주 복권 구매를 진지하게 고려해 볼 만한 훌륭한 운세입니다.";
  } else if (text.includes('물') || text.includes('바다') || text.includes('수영') || text.includes('비행기') || text.includes('용') || text.includes('대통령')) {
    stars = 4;
    interpretation = "훌륭한 길몽입니다. 막혔던 일들이 순조롭게 풀리고 큰 행운이 깃들 수 있는 꿈입니다. 재물운도 상당히 상승하는 시기이므로, 이번 주 로또를 가볍게 도전해 보시는 것을 추천해 드립니다.";
  } else if (text.includes('이빨') || text.includes('도망') || text.includes('쫓기') || text.includes('잃어')) {
    stars = 1;
    interpretation = "이 꿈은 현재 약간의 스트레스나 피로감이 반영된 심리몽일 수 있습니다. 무리한 지출이나 투자는 피하시고, 복권은 다음 기회로 미루거나 아주 소액으로만 즐기시는 것이 좋겠습니다.";
  } else if (text.includes('돈') || text.includes('황금') || text.includes('보석')) {
    stars = 3;
    interpretation = "재물에 대한 관심과 기대감이 꿈으로 나타났네요! 재물운이 나쁘지는 않지만, 너무 큰 기대보다는 즐거운 상상으로 가볍게 복권을 한 장 정도 사보시는 것을 추천합니다.";
  } else if (text.length > 20) {
    // 위 키워드에 해당하지 않지만 길게 쓴 경우 랜덤성 부여
    const randomStars = Math.floor(Math.random() * 3) + 2; // 2 ~ 4점
    stars = randomStars;
    if (randomStars === 4) {
      interpretation = "꿈의 흐름이 전반적으로 긍정적인 기운을 뿜어내고 있습니다! 예상치 못한 행운이 찾아올 수 있으니, 이번 주에는 기분 좋게 로또를 구매해 보셔도 좋겠습니다.";
    } else if (randomStars === 3) {
      interpretation = "무난하고 평온한 꿈이네요. 엄청난 대박은 아니지만 소소한 행운이 따를 수 있습니다. 가벼운 마음으로 복권을 즐겨보시는 것도 좋은 하루의 활력소가 될 것입니다.";
    } else {
      interpretation = "꿈 자체에 큰 횡재수가 담겨있지는 않은 것 같습니다. 이번 주는 무리하지 마시고, 평범하지만 평화로운 일상을 즐기시는 것에 의의를 두시는 것이 좋겠습니다.";
    }
  }

  // 약간의 랜덤성 가미
  if (stars === 5 && Math.random() < 0.2) stars = 4;
  if (stars === 1 && Math.random() < 0.3) stars = 2;

  return res.status(200).json({ interpretation, stars });
}
