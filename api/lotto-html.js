module.exports = async function (req, res) {
  const { drwNo } = req.query;
  try {
    const response = await fetch(`https://dhlottery.co.kr/gameResult.do?method=byWin&drwNo=${drwNo}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('euc-kr');
    const html = decoder.decode(buffer);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send("에러");
  }
};
