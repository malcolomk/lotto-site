export default async function handler(req, res) {
  const { drwNo } = req.query;
  try {
    const response = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`, {
      headers: {
        // 평범한 크롬 브라우저 접속인 것처럼 위장
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "데이터를 불러오지 못했습니다." });
  }
}
