import os
from dotenv import load_dotenv
from supabase import create_client

# .env 파일에서 환경 변수 로드
load_dotenv()

def list_supabase_tables():
    """Supabase 데이터베이스의 public 스키마에 있는 모든 테이블 이름을 조회합니다."""
    
    # 환경 변수에서 Supabase 연결 정보 가져오기
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 .env 파일에 없습니다.")
        return
    
    print(f"Supabase {supabase_url}에 연결 중...")
    
    try:
        # Supabase 클라이언트 생성
        supabase = create_client(supabase_url, supabase_key)
        
        # public 스키마의 모든 테이블 조회 쿼리
        query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
        """
        
        # SQL 쿼리 실행
        response = supabase.rpc('pgql', {'query': query}).execute()
        
        if not hasattr(response, 'data') or not response.data:
            print("테이블을 찾을 수 없거나 접근 권한이 없습니다.")
            return
        
        # 결과 출력
        tables = [row['table_name'] for row in response.data]
        
        print("\n===== SUPABASE 테이블 목록 =====")
        print(f"총 테이블 수: {len(tables)}")
        print("=" * 30)
        
        for i, table in enumerate(tables, 1):
            print(f"{i}. {table}")
            
        print("=" * 30)
        
        return tables
        
    except Exception as e:
        print(f"오류 발생: {e}")
        
        # 대체 방법 시도
        try:
            print("\n직접 접근 방식으로 재시도 중...")
            supabase = create_client(supabase_url, supabase_key)
            
            # 일반적인 Postgres 시스템 테이블을 사용
            response = supabase.table('pg_tables').select('tablename').eq('schemaname', 'public').execute()
            
            if hasattr(response, 'data') and response.data:
                tables = [row['tablename'] for row in response.data]
                
                print("\n===== SUPABASE 테이블 목록 =====")
                print(f"총 테이블 수: {len(tables)}")
                print("=" * 30)
                
                for i, table in enumerate(tables, 1):
                    print(f"{i}. {table}")
                    
                print("=" * 30)
                
                return tables
        except:
            print("모든 테이블 조회 방법이 실패했습니다.")
            return []

if __name__ == "__main__":
    print("Supabase 데이터베이스 테이블 목록 조회 시작...")
    list_supabase_tables() 