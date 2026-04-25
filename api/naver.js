export default async function handler(req, res) {
  const { drwNo } = req.query;
  
  let round = drwNo;
  if (!round) {
    const firstDate = new Date('2002-12-07T20:45:00+09:00').getTime();
    const now = new Date().getTime();
    const weeks = Math.floor((now - firstDate) / (1000 * 60 * 60 * 24 * 7));
    round = weeks + 1;
  }

  const url = `https://search.naver.com/search.naver?query=${encodeURIComponent('로또 ' + round + '회')}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) return res.status(500).json({ status: 'error', message: '네이버 접속 실패' });

    const html = await response.text();
    
    // 1. 당첨 번호 추출
    const ballRegex = /<span class="[^"]*ball[^"]*">(\d+)<\/span>/g;
    const nums = [];
    let ballMatch;
    while ((ballMatch = ballRegex.exec(html)) !== null) {
      nums.push(parseInt(ballMatch[1], 10));
    }

    if (nums.length < 7) {
      return res.status(500).json({ status: 'error', message: '당첨 번호 파싱 실패' });
    }

    const data = {
      returnValue: 'success',
      drwNo: parseInt(round, 10),
      drwtNo1: nums[0], drwtNo2: nums[1], drwtNo3: nums[2],
      drwtNo4: nums[3], drwtNo5: nums[4], drwtNo6: nums[5],
      bnusNo: nums[6],
    };

    // 2. 당첨 정보 추출 (1인당 당첨금 정밀 타겟팅)
    const extractRankData = (rank) => {
      // 1등 전용 패턴 (캡처 화면의 요약 정보 우선)
      if (rank === 1) {
        const summaryRegex = /1등\s*당첨금\s*([\d,]+)\s*원\s*\([^)]*?([\d,]+)\s*(?:개|명|게임)/;
        const summaryMatch = html.match(summaryRegex);
        if (summaryMatch) {
          return {
            amount: parseInt(summaryMatch[1].replace(/,/g, ''), 10),
            count: parseInt(summaryMatch[2].replace(/,/g, ''), 10)
          };
        }
      }

      // 표(Table) 구조에서 해당 등수의 행(Row)을 찾아 1인당 당첨금 추출
      // 보통 구조: 등수 -> 총당첨금 -> 당첨자수 -> 1인당당첨금 순서임
      const rankPattern = new RegExp(`${rank}등[\\s\\S]{0,300}?(?:명|개|게임)[\\s\\S]{0,100}?([\\d,]{5,})\\s*원`);
      const rankMatch = html.match(rankPattern);
      
      // 인원수 추출 (금액과 혼동되지 않도록 명/개/게임 앞의 작은 숫자 타겟)
      const countPattern = new RegExp(`${rank}등[\\s\\S]{0,150}?([\\d,]{1,7})\\s*(?:명|개|게임)`);
      const countMatch = html.match(countPattern);

      return {
        amount: rankMatch ? parseInt(rankMatch[1].replace(/,/g, ''), 10) : 0,
        count: countMatch ? parseInt(countMatch[1].replace(/,/g, ''), 10) : 0
      };
    };

    const first = extractRankData(1);
    const second = extractRankData(2);
    const third = extractRankData(3);
    
    data.firstWinamnt = first.amount;
    data.firstPrzwnerCo = first.count;
    data.secondWinamnt = second.amount;
    data.secondPrzwnerCo = second.count;
    data.thirdWinamnt = third.amount;
    data.thirdPrzwnerCo = third.count;
    
    // 3. 날짜 추출
    const dateRegex = /([2][0][0-2][\d])[년.\-\s]+([0-1]?[\d])[월.\-\s]+([0-3]?[\d])[일.\-\s]+(?:추첨)?/;
    const dateMatch = html.match(dateRegex);
    data.drwNoDate = dateMatch ? `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}` : "날짜 정보 없음";

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
