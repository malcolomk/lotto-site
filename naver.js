export default async function handler(req, res) {
  const { drwNo } = req.query;
  
  // 회차가 없으면 현재 시간을 기준으로 최신 회차 계산
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
    
    if (!response.ok) {
      return res.status(500).json({ status: 'error', message: '네이버 접속 실패' });
    }

    const html = await response.text();
    
    // 1. 당첨 번호 파싱
    const regex = /<span class="[^"]*ball[^"]*">(\d+)<\/span>/g;
    let match;
    const nums = [];
    
    while ((match = regex.exec(html)) !== null) {
      nums.push(parseInt(match[1], 10));
    }

    if (nums.length >= 7) {
      const data = {
        returnValue: 'success',
        drwNo: parseInt(round, 10),
        drwtNo1: nums[0],
        drwtNo2: nums[1],
        drwtNo3: nums[2],
        drwtNo4: nums[3],
        drwtNo5: nums[4],
        drwtNo6: nums[5],
        bnusNo: nums[6],
      };
      
      // 2. 당첨금 및 당첨자수 파싱 함수 (네이버 구조 변경 대응)
      const extractRankData = (rank) => {
        // [우선 탐색] 캡처 화면과 같은 최신 패턴: "1등 당첨금 1,830,801,165원 (당첨 복권수 16개)"
        const directRegex = new RegExp(`${rank}등\\s*당첨금\\s*([\\d,]+)\\s*원\\s*\\([^)]*?([\\d,]+)\\s*(?:개|명|게임)\\)`);
        const directMatch = html.match(directRegex);
        
        if (directMatch) {
            return {
                amount: parseInt(directMatch[1].replace(/,/g, ''), 10),
                count: parseInt(directMatch[2].replace(/,/g, ''), 10)
            };
        }

        // [대비책 탐색] 위 패턴이 없을 경우 해당 등수 주변 텍스트를 통째로 잘라서 탐색
        const currentRankStr = `${rank}등`;
        const startIndex = html.indexOf(currentRankStr);
        if (startIndex === -1) return { amount: 0, count: 0 };
        
        let endIndex = html.indexOf(`${rank + 1}등`, startIndex);
        if (endIndex === -1) endIndex = startIndex + 400; // 다음 등수가 안 보이면 400자까지만 탐색
        
        const chunk = html.substring(startIndex, endIndex);
        
        // '개', '명', '게임' 단위를 모두 허용하여 숫자 추출
        const cntRegex = /([\d,]{1,6})\s*(?:명|게임|개)/;
        const cntMatch = chunk.match(cntRegex);
        let count = cntMatch ? parseInt(cntMatch[1].replace(/,/g, ''), 10) : 0;

        // '원' 단위를 기준으로 금액 추출
        const amtRegex = /([\d,]{5,})\s*원/;
        const amtMatch = chunk.match(amtRegex);
        let amount = amtMatch ? parseInt(amtMatch[1].replace(/,/g, ''), 10) : 0;

        return { amount, count };
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
      data.firstAccumamnt = 0;
      
      // 3. 추첨일 파싱
      const dateRegex = /([2][0][0-2][\d])[년.\-\s]+([0-1]?[\d])[월.\-\s]+([0-3]?[\d])[일.\-\s]+(?:추첨)?/;
      const dateMatch = html.match(dateRegex);
      if (dateMatch) {
         const y = dateMatch[1];
         const m = dateMatch[2].trim().padStart(2, '0');
         const d = dateMatch[3].trim().padStart(2, '0');
         data.drwNoDate = `${y}-${m}-${d}`;
      } else {
         data.drwNoDate = "날짜 정보 없음";
      }

      return res.status(200).json(data);
    } else {
      return res.status(500).json({ status: 'error', message: '파싱 실패 (당첨 번호를 찾을 수 없습니다)' });
    }
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
