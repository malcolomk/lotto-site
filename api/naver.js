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
      return res.status(500).json({ status: 'error', message: '당첨 번호 파싱 실패 (회차 정보가 없거나 응답 지연)' });
    }

    const data = {
      returnValue: 'success',
      drwNo: parseInt(round, 10),
      drwtNo1: nums[0], drwtNo2: nums[1], drwtNo3: nums[2],
      drwtNo4: nums[3], drwtNo5: nums[4], drwtNo6: nums[5],
      bnusNo: nums[6],
    };

    // 2. 당첨 정보 추출 (과거/최신 완벽 대응 블록 자르기)
    const extractRankData = (rank) => {
      // 최신 회차 상단 요약 텍스트 우선 탐색 (1등 전용)
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

      // 표(Table) 구역을 등수 단위로 통째로 잘라서 분석
      const startStr = `${rank}등`;
      const endStr = `${rank + 1}등`;
      
      let startIdx = html.indexOf(startStr);
      if (startIdx === -1) return { amount: 0, count: 0 };
      
      let endIdx = html.indexOf(endStr, startIdx);
      if (endIdx === -1) endIdx = startIdx + 400; // 마지막 등수거나 다음 등수가 없으면 400자까지만
      
      const chunk = html.substring(startIdx, endIdx);
      
      // A. 당첨자 수 추출 (명, 개, 게임 앞에 있는 숫자)
      const countMatch = chunk.match(/([\d,]+)\s*(?:명|개|게임)/);
      const count = countMatch ? parseInt(countMatch[1].replace(/,/g, ''), 10) : 0;

      // B. 당첨금 추출 (해당 구간에 있는 모든 '원' 단위 금액 배열로 추출)
      const amtRegex = /([\d,]{4,})\s*원/g;
      const amtMatches = [];
      let match;
      while ((match = amtRegex.exec(chunk)) !== null) {
        amtMatches.push(parseInt(match[1].replace(/,/g, ''), 10));
      }

      // [핵심 로직] 네이버 표 구조상 '총 당첨금'이 먼저, '1인당 당첨금'이 나중에 나옵니다.
      // 따라서 찾아낸 금액들 중 무조건 '마지막 값'을 선택하면 1인당 당첨금을 정확히 가져올 수 있습니다.
      let amount = 0;
      if (amtMatches.length > 0) {
        amount = amtMatches[amtMatches.length - 1]; 
      }

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
    
    // 3. 날짜 추출
    const dateRegex = /([2][0][0-2][\d])[년.\-\s]+([0-1]?[\d])[월.\-\s]+([0-3]?[\d])[일.\-\s]+(?:추첨)?/;
    const dateMatch = html.match(dateRegex);
    data.drwNoDate = dateMatch ? `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}` : "날짜 정보 없음";

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
