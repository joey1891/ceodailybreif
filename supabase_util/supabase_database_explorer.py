import os
from dotenv import load_dotenv
from supabase import create_client
import pandas as pd
import json
from typing import Dict, List, Any, Optional

# .env 파일에서 환경 변수 로드
load_dotenv()

class SupabaseExplorer:
    def __init__(self):
        # 환경 변수에서 Supabase 연결 정보 가져오기
        self.supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        self.supabase_key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 .env 파일에 없습니다.")
        
        print(f"Supabase {self.supabase_url}에 연결 중...")
        self.supabase = create_client(self.supabase_url, self.supabase_key)
        
        # 확인된 테이블 목록 (스크린샷에서 추출)
        self.known_tables = [
            "admin_users",
            "calendar_events",
            "comments",
            "page_contents",
            "page_sections",
            "posts",
            "related_links",
            "url_mappings"
        ]
    
    def get_table_schema(self, table_name: str) -> List[Dict[str, Any]]:
        """특정 테이블의 스키마 정보를 가져옵니다."""
        try:
            # 테이블 구조 쿼리
            query = f"""
            SELECT 
                column_name, 
                data_type, 
                is_nullable, 
                column_default,
                ordinal_position
            FROM 
                information_schema.columns
            WHERE 
                table_schema = 'public' 
                AND table_name = '{table_name}'
            ORDER BY 
                ordinal_position;
            """
            
            # pgql 함수를 사용하여 쿼리 실행
            response = self.supabase.rpc('pgql', {'query': query}).execute()
            
            if hasattr(response, 'data') and response.data:
                return response.data
            else:
                # 대체 방법으로 테이블에서 한 행을 가져와 구조 추론
                return self._infer_schema_from_data(table_name)
                
        except Exception as e:
            print(f"테이블 {table_name}의 스키마 정보 조회 실패: {e}")
            return self._infer_schema_from_data(table_name)
    
    def _infer_schema_from_data(self, table_name: str) -> List[Dict[str, Any]]:
        """테이블 데이터에서 스키마를 추론합니다."""
        try:
            response = self.supabase.table(table_name).select('*').limit(1).execute()
            
            if hasattr(response, 'data') and response.data and len(response.data) > 0:
                # 첫 번째 행의 데이터를 기반으로 스키마 추론
                schema = []
                for i, (key, value) in enumerate(response.data[0].items()):
                    data_type = type(value).__name__ if value is not None else "unknown"
                    schema.append({
                        "column_name": key,
                        "data_type": data_type,
                        "is_nullable": "YES",  # 기본값으로 NULL 허용 가정
                        "column_default": None,
                        "ordinal_position": i + 1
                    })
                return schema
            else:
                print(f"테이블 {table_name}에 데이터가 없어 스키마를 추론할 수 없습니다.")
                return []
        except Exception as e:
            print(f"테이블 {table_name}에서 데이터를 가져오는 중 오류 발생: {e}")
            return []
    
    def get_table_data(self, table_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """테이블에서 데이터를 가져옵니다."""
        try:
            response = self.supabase.table(table_name).select('*').limit(limit).execute()
            
            if hasattr(response, 'data'):
                return response.data
            else:
                print(f"테이블 {table_name}에서 데이터를 가져올 수 없습니다.")
                return []
        except Exception as e:
            print(f"테이블 {table_name}에서 데이터를 가져오는 중 오류 발생: {e}")
            return []
    
    def get_table_count(self, table_name: str) -> int:
        """테이블의 행 수를 조회합니다."""
        try:
            response = self.supabase.table(table_name).select('*', count='exact').execute()
            if response.count != None:
                return response.count
            return 0
        except Exception as e:
            print(f"테이블 {table_name}의 행 수 조회 실패: {e}")
            return 0
    
    def explore_all_tables(self) -> Dict[str, Dict[str, Any]]:
        """모든 테이블의 정보를 수집합니다."""
        all_tables_info = {}
        
        for table_name in self.known_tables:
            print(f"\n테이블 {table_name} 분석 중...")
            
            # 스키마 정보 가져오기
            schema = self.get_table_schema(table_name)
            
            # 데이터 샘플 가져오기
            sample_data = self.get_table_data(table_name, limit=5)
            
            # 행 수 조회
            row_count = self.get_table_count(table_name)
            
            # 테이블 정보 저장
            all_tables_info[table_name] = {
                "schema": schema,
                "sample_data": sample_data,
                "row_count": row_count,
                "has_data": len(sample_data) > 0
            }
            
            print(f"  - 컬럼 수: {len(schema)}")
            print(f"  - 행 수: {row_count}")
        
        return all_tables_info
    
    def export_to_json(self, filename: str = "supabase_data.json") -> None:
        """데이터베이스 정보를 JSON 파일로 내보냅니다."""
        database_info = self.explore_all_tables()
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(database_info, f, ensure_ascii=False, indent=2)
        
        print(f"\n데이터베이스 정보가 {filename}에 저장되었습니다.")
    
    def export_to_csv(self, directory: str = "supabase_export") -> None:
        """각 테이블을 별도의 CSV 파일로 내보냅니다."""
        if not os.path.exists(directory):
            os.makedirs(directory)
        
        for table_name in self.known_tables:
            # 전체 데이터 가져오기 (제한 없음)
            data = self.get_table_data(table_name, limit=10000)
            schema = self.get_table_schema(table_name)
            
            # 데이터프레임 생성
            if data:
                df = pd.DataFrame(data)
            elif schema:
                # 스키마만 있고 데이터가 없는 경우
                df = pd.DataFrame(columns=[col['column_name'] for col in schema])
            else:
                # 스키마도 없는 경우
                df = pd.DataFrame(columns=['no_data'])
                df.loc[0] = ['테이블이 존재하지만 데이터와 스키마를 확인할 수 없습니다']
            
            # CSV 파일로 저장
            csv_path = os.path.join(directory, f"{table_name}.csv")
            df.to_csv(csv_path, index=False)
            
            if len(data) > 0:
                print(f"테이블 {table_name}이(가) {csv_path}에 저장되었습니다 ({len(data)}행)")
            else:
                print(f"테이블 {table_name}이(가) {csv_path}에 저장되었습니다 (데이터 없음)")
    
    def print_database_summary(self) -> None:
        """데이터베이스 구조 요약을 출력합니다."""
        database_info = self.explore_all_tables()
        
        print("\n===== SUPABASE 데이터베이스 요약 =====")
        print(f"총 테이블 수: {len(database_info)}")
        
        # 데이터가 있는/없는 테이블 수 계산
        tables_with_data = sum(1 for info in database_info.values() if info["has_data"])
        tables_without_data = len(database_info) - tables_with_data
        print(f"데이터가 있는 테이블: {tables_with_data}")
        print(f"빈 테이블: {tables_without_data}")
        
        for table_name, table_info in database_info.items():
            print(f"\n----- 테이블: {table_name} -----")
            
            # 스키마 출력
            print("컬럼:")
            if table_info["schema"]:
                for column in table_info["schema"]:
                    nullable = "NULL" if column.get("is_nullable") == "YES" else "NOT NULL"
                    default = f" DEFAULT {column.get('column_default')}" if column.get("column_default") else ""
                    print(f"  • {column.get('column_name')} ({column.get('data_type')}) {nullable}{default}")
            else:
                print("  스키마 정보를 확인할 수 없습니다")
            
            # 샘플 데이터 출력
            print("\n샘플 데이터:")
            if table_info["has_data"]:
                for i, row in enumerate(table_info["sample_data"], 1):
                    print(f"  행 {i}:")
                    for key, value in row.items():
                        print(f"    {key}: {value}")
            else:
                print("  이 테이블에는 데이터가 없습니다")
            
            # 행 수 출력
            if table_info["row_count"] > 0:
                print(f"\n행 수: {table_info['row_count']}")
            else:
                print("\n행 수: 0 (빈 테이블)")
    
    def get_all_posts_data(self) -> List[Dict[str, Any]]:
        """posts 테이블의 모든 데이터를 가져옵니다."""
        try:
            print("posts 테이블의 모든 데이터를 가져오는 중...")
            response = self.supabase.table("posts").select('*').execute()
            
            if hasattr(response, 'data'):
                print(f"총 {len(response.data)}개의 posts 데이터를 가져왔습니다.")
                return response.data
            else:
                print("posts 테이블에서 데이터를 가져올 수 없습니다.")
                return []
        except Exception as e:
            print(f"posts 테이블에서 데이터를 가져오는 중 오류 발생: {e}")
            return []
    
    def export_all_posts_to_csv(self, filepath: str = "posts_all_data.csv") -> None:
        """posts 테이블의 모든 데이터를 CSV 파일로 내보냅니다."""
        try:
            data = self.get_all_posts_data()
            if data:
                df = pd.DataFrame(data)
                df.to_csv(filepath, index=False)
                print(f"posts 테이블의 모든 데이터가 {filepath}에 저장되었습니다.")
            else:
                print("내보낼 posts 데이터가 없습니다.")
        except Exception as e:
            print(f"posts 데이터 내보내기 중 오류 발생: {e}")


def main():
    try:
        explorer = SupabaseExplorer()
        
        print("\n===== SUPABASE 포스트 데이터 추출기 =====")
        print("posts 테이블의 모든 데이터를 가져옵니다.")
        
        posts_data = explorer.get_all_posts_data()
        
        if posts_data:
            print(f"\n총 {len(posts_data)}개의 포스트를 가져왔습니다.")
            
            # 모든 포스트 정보 출력 (모든 칼럼 포함)
            print("\n포스트 목록 전체 (모든 칼럼):")
            for i, post in enumerate(posts_data, 1):
                print(f"\n=== 포스트 #{i} ===")
                for column_name, value in post.items():
                    print(f"  {column_name}: {value}")
                print("---------------")
        else:
            print("posts 테이블에 데이터가 없습니다.")
            
    except Exception as e:
        print(f"오류: {e}")
        print("\n문제 해결 팁:")
        print("1. .env 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY가 있는지 확인하세요.")
        print("2. Supabase URL과 키가 올바른지 확인하세요.")
        print("3. 필요한 Python 패키지가 설치되어 있는지 확인하세요:")
        print("   pip install python-dotenv supabase pandas")


if __name__ == "__main__":
    main()
