export default async function handler(req, res) {
  const { drwNo } = req.query;
  
  // 회차가 없으면 현재 시간을 기준으로 최신 회차 계산 (PHP 코드와 동일한 로직)
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    
    if (!response.ok) {
      return res.status(500).json({ status: 'error', message: '네이버 접속 실패' });
    }

    const html = await response.text();
    
    // 정규식으로 번호 파싱 (<span class="ball ...">12</span>)
    const regex = /<span class="ball[^>]*>(\d+)<\/span>/g;
    let match;
    const nums = [];
    
    while ((match = regex.exec(html)) !== null) {
      nums.push(parseInt(match[1], 10));
    }

    if (nums.length >= 7) {
      const data = {
        returnValue: 'success', // 기존 로직과 호환되게 설정
        drwNo: parseInt(round, 10),
        drwtNo1: nums[0],
        drwtNo2: nums[1],
        drwtNo3: nums[2],
        drwtNo4: nums[3],
        drwtNo5: nums[4],
        drwtNo6: nums[5],
        bnusNo: nums[6],
      };
      
      // 당첨금 정보 파싱 (예: 1등 당첨금 ... <strong>1,234,567,890</strong>원)
      // 줄바꿈이 있을 수 있으므로 [\s\S]*? 사용
      const prizeRegex = /1등 당첨금[\s\S]*?([\d,]+)[\s]*?(?:<[^>]+>)*원/;
      const prizeMatch = html.match(prizeRegex);
      if (prizeMatch) {
         data.firstWinamnt = parseInt(prizeMatch[1].replace(/,/g, ''), 10);
      } else {
         data.firstWinamnt = 0;
      }
      
      // 당첨자 수 (예: 당첨자 수 ... <strong>12</strong>명)
      const cntRegex = /당첨자 수[\s\S]*?([\d,]+)[\s]*?(?:<[^>]+>)*명/;
      const cntMatch = html.match(cntRegex);
      if (cntMatch) {
         data.firstPrzwnerCo = parseInt(cntMatch[1].replace(/,/g, ''), 10);
      } else {
         data.firstPrzwnerCo = 0;
      }
      
      // 추첨일 파싱: <span class="date">2024.04.13 추첨</span> 또는 2024년 04월 13일 추첨
      const dateRegex = /([\d]{4})[년.\-\s]*([\d]{1,2})[월.\-\s]*([\d]{1,2})[일\s]*추첨/;
      const dateMatch = html.match(dateRegex);
      if (dateMatch) {
         const y = dateMatch[1];
         const m = dateMatch[2].padStart(2, '0');
         const d = dateMatch[3].padStart(2, '0');
         data.drwNoDate = `${y}-${m}-${d}`;
      } else {
         data.drwNoDate = "날짜 정보 없음";
      }

      // 누적 당첨금은 네이버에 잘 안나오므로 0으로 처리
      data.firstAccumamnt = 0;

      return res.status(200).json(data);
    } else {
      return res.status(500).json({ status: 'error', message: '파싱 실패 (네이버 구조 변경 가능성)' });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
