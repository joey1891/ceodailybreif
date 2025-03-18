const fetch = require('node-fetch');
const fetch = require('node-fetch');

// API 인증 정보 설정
const apiConfig = {
    appKey: "PS7VhN74p2PcXF7J1ndfRMP46kThl8a33hUB",           // 발급받은 앱 키
    appSecret: "Fp5+Og4nMsvK0JTWr9W4bboX/QiBiubz3CuoRTCfwSB3m0wzJzgi0hg94kZRaJdYFu6uzSn2JR1RyIC66caYMkQ7MFpl3CHp2LY31CgxAJUz392tWo3sRLIq52tTjkl9RLkmGYDZP9iO3gH6lx5/gwRoTQSYYLP5CdQAgt8OFJILj93Yw4s=",     // 발급받은 앱 시크릿
    accessToken: "",                  // 발급될 액세스 토큰
    baseUrl: "https://openapi.koreainvestment.com:9443",  // 실전 도메인
};

// 지수 코드 정보
const indices = {
    domestic: {
        'KOSPI': 'K1',    // 코스피 지수 코드
        'KOSDAQ': 'Q',    // 코스닥 지수 코드
    },
    overseas: {
        'NASDAQ': {excd: 'NAS', symb: '^IXIC'},  // 나스닥 지수
        'S&P500': {excd: 'NYS', symb: '^GSPC'},  // S&P 500 지수
        'DOW': {excd: 'NYS', symb: '^DJI'}       // 다우존스 지수
    }
};

let accessToken = null;
let accessTokenExpiration = null;

// 액세스 토큰 발급 함수
async function getAccessToken() {
    if (accessToken && accessTokenExpiration > Date.now()) {
        console.log('기존 액세스 토큰 사용');
        return true;
    }

    try {
        const response = await fetch(`${apiConfig.baseUrl}/oauth2/tokenP`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'client_credentials',
                appkey: apiConfig.appKey,
                appsecret: apiConfig.appSecret,
            }),
        });

        const data = await response.json();

        if (data.access_token) {
            accessToken = data.access_token;
            accessTokenExpiration = Date.now() + 59 * 60 * 1000; // 59 minutes
            console.log('액세스 토큰이 성공적으로 발급되었습니다.');
            return true;
        } else {
            console.error('액세스 토큰 발급 실패:', data);
            return false;
        }
    } catch (error) {
        console.error('액세스 토큰 발급 중 오류 발생:', error);
        return false;
    }
}

// 국내 지수 조회 함수
async function getDomesticIndex(indexCode) {
    try {
        const url = `${apiConfig.baseUrl}/uapi/domestic-stock/v1/quotations/inquire-daily-indexchartprice`;
        
        const params = new URLSearchParams({
            FID_COND_MRKT_DIV_CODE: 'U',     // 업종 구분
            FID_INPUT_ISCD: indexCode,        // 업종 코드
            FID_INPUT_DATE_1: getFormattedDate(),  // 조회 시작일
            FID_INPUT_DATE_2: getFormattedDate(),  // 조회 종료일
            FID_PERIOD_DIV_CODE: 'D',         // 기간 구분(일)
            FID_ORG_ADJ_PRC: '1'              // 원주가
        });

        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${apiConfig.accessToken}`,
                'appkey': apiConfig.appKey,
                'appsecret': apiConfig.appSecret,
                'tr_id': 'FHKUP03500100',  // 국내주식업종기간별시세 TR ID
                'custtype': 'P'            // 개인
            },
        });

        const data = await response.json();

        if (data && data.output2 && data.output2.length > 0) {
            return {
                price: parseFloat(data.output2[0].bstp_nmix_prpr),  // 업종 지수 현재가
                change: parseFloat(data.output1.bstp_nmix_prdy_vrss),  // 전일 대비
                changeRate: parseFloat(data.output1.bstp_nmix_prdy_ctrt),  // 전일 대비율
                date: data.output2[0].stck_bsop_date  // 영업 일자
            };
        } else {
            throw new Error('지수 데이터를 받아올 수 없습니다.');
        }
    } catch (error) {
        console.error(`국내 지수 조회 중 오류 발생: ${error.message}`);
        return null;
    }
}

// 해외 지수 조회 함수
async function getOverseasIndex(exchange, symbol) {
    try {
        const url = `${apiConfig.baseUrl}/uapi/overseas-price/v1/quotations/price`;
        
        const params = new URLSearchParams({
            AUTH: '',
            EXCD: exchange,  // 거래소 코드
            SYMB: symbol     // 종목 코드
        });

        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${apiConfig.accessToken}`,
                'appkey': apiConfig.appKey,
                'appsecret': apiConfig.appSecret,
                'tr_id': 'HHDFS00000300',  // 해외주식 현재체결가 TR ID
                'custtype': 'P'            // 개인
            },
        });

        const data = await response.json();

        if (data && data.output) {
            return {
                price: parseFloat(data.output.last),            // 현재가
                change: parseFloat(data.output.diff),           // 전일 대비
                changeRate: parseFloat(data.output.rate) * 100, // 전일 대비율
                date: getFormattedDate()                        // 조회 일자
            };
        } else {
            throw new Error('지수 데이터를 받아올 수 없습니다.');
        }
    } catch (error) {
        console.error(`해외 지수 조회 중 오류 발생: ${error.message}`);
        return null;
    }
}

// 현재 날짜를 YYYYMMDD 형식으로 반환하는 유틸리티 함수
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 모든 지수 정보 조회 함수
async function getAllIndices() {
    // 먼저 액세스 토큰 발급
    const isAuthenticated = await getAccessToken();
    
    if (!isAuthenticated) {
        console.error('인증 실패. 지수 정보를 조회할 수 없습니다.');
        return null;
    }
    
    const results = {};
    
    // 1. 국내 지수 조회
    for (const [name, code] of Object.entries(indices.domestic)) {
        results[name] = await getDomesticIndex(code);
    }
    
    // 2. 해외 지수 조회
    for (const [name, info] of Object.entries(indices.overseas)) {
        results[name] = await getOverseasIndex(info.excd, info.symb);
    }
    
    return results;
}

// 지수 정보 조회 및 표시 함수
async function displayAllIndices() {
    try {
        console.log('지수 정보를 조회하는 중입니다...');
        
        const indicesData = await getAllIndices();
        
        if (!indicesData) {
            console.error('지수 정보 조회에 실패했습니다.');
            return;
        }
        
        console.log('===== 주요 주식 지수 정보 =====');
        console.log(`조회 시간: ${new Date().toLocaleString()}`);
        console.log('-------------------------------');
        
        for (const [name, data] of Object.entries(indicesData)) {
            if (data) {
                const direction = data.change >= 0 ? '▲' : '▼';
                console.log(`${name}: ${data.price.toFixed(2)} ${direction} ${Math.abs(data.change).toFixed(2)} (${data.changeRate.toFixed(2)}%)`);
            } else {
                console.log(`${name}: 데이터 없음`);
            }
        }
        
        console.log('===============================');
    } catch (error) {
        console.error('지수 정보 조회 및 표시 중 오류 발생:', error);
    }
}

// 실행
// displayAllIndices();

module.exports = { getAllIndices };
